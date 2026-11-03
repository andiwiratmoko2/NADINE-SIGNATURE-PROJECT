import {NextResponse as R} from 'next/server';
import {cookies} from 'next/headers';
import {put} from '@vercel/blob';
import {sql,getBank} from '@/lib/db';
import {isAdmin,makeToken,same} from '@/lib/auth';
import {CATS,SEED,BGS,defCols} from '@/lib/data';
const J=(d,s=200)=>R.json(d,{status:s});
const num=x=>Math.max(0,Math.min(2e9,Math.round(+x)||0));
const hex=x=>/^#[0-9a-f]{6}$/i.test(x);
const clean=s=>String(s||'').trim();

let stockReady=false;
async function ensureStock(){
  if(stockReady)return;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS counted_at timestamptz`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS counted_qty int`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz`;
  await sql`CREATE TABLE IF NOT EXISTS stock_log(id serial PRIMARY KEY,product_id int,name text,qty_before int,qty_after int,physical int,reserved int,note text NOT NULL DEFAULT '',created_at timestamptz DEFAULT now())`;
  stockReady=true;
}

async function placeOrder(b){
  const name=clean(b.name).slice(0,80),phone=clean(b.phone).slice(0,30),address=clean(b.address).slice(0,300);
  const items=(Array.isArray(b.items)?b.items:[]).slice(0,50).map(i=>({id:+i.id,q:Math.max(1,Math.min(99,+i.q||0)),s:clean(i.s).slice(0,10),c:clean(i.c).slice(0,40)}));
  if(!name||!phone||!address||!items.length)return J({error:'Lengkapi nama, WhatsApp, dan alamat.'},400);
  const rows=await sql`SELECT id,name,price,stock FROM products WHERE id=ANY(${items.map(i=>i.id)}) AND NOT hidden`;
  let total=0;const det=[];
  for(const i of items){
    const p=rows.find(r=>r.id==i.id);
    if(!p)return J({error:'Ada produk yang sudah tidak tersedia.'},400);
    if(p.stock<i.q)return J({error:p.name+': stok tidak cukup.'},400);
    total+=p.price*i.q;det.push({...i,n:p.name,p:p.price});
  }
  const [{id}]=await sql`SELECT nextval('orders_id_seq')::int AS id`;
  const code='NS-'+String(id).padStart(4,'0');
  await sql.transaction([
    ...det.map(i=>sql`UPDATE products SET stock=stock-${i.q} WHERE id=${i.id}`),
    sql`INSERT INTO orders(id,code,name,phone,address,total,items) VALUES(${id},${code},${name},${phone},${address},${total},${JSON.stringify(det)}::jsonb)`
  ]);
  return J({code,total});
}

export async function h(req,slug){
  const a=slug[0],b=new URL(req.url).searchParams.get('id'),m=req.method,body=()=>req.json().catch(()=>({}));
  try{
    if(a=='login'&&m=='POST'){
      await new Promise(r=>setTimeout(r,600));
      const {password}=await body();
      if(!process.env.ADMIN_PASSWORD||!process.env.AUTH_SECRET)return J({error:'ADMIN_PASSWORD dan AUTH_SECRET belum diisi di server.'},500);
      if(!same(password||'',process.env.ADMIN_PASSWORD))return J({error:'Password salah.'},401);
      cookies().set('ns_admin',makeToken(),{httpOnly:true,secure:process.env.NODE_ENV=='production',sameSite:'lax',path:'/',maxAge:604800});
      return J({ok:true});
    }
    if(a=='logout'){cookies().delete('ns_admin');return J({ok:true})}
    if(a=='orders'&&m=='POST')return await placeOrder(await body());
    if(!isAdmin())return J({error:'Silakan login sebagai penjual.'},401);

    if(a=='setup'){
      await sql`CREATE TABLE IF NOT EXISTS products(id serial PRIMARY KEY,name text NOT NULL,category text NOT NULL,price int NOT NULL CHECK(price>=0),stock int NOT NULL DEFAULT 0 CHECK(stock>=0),sold int NOT NULL DEFAULT 0,description text NOT NULL DEFAULT '',bg text NOT NULL DEFAULT '#e8dfd0',images jsonb NOT NULL DEFAULT '[]',colors jsonb NOT NULL DEFAULT '[]',hidden boolean NOT NULL DEFAULT false,created_at timestamptz DEFAULT now())`;
      await sql`CREATE SEQUENCE IF NOT EXISTS orders_id_seq`;
      await sql`CREATE TABLE IF NOT EXISTS orders(id int PRIMARY KEY,code text NOT NULL,name text NOT NULL,phone text NOT NULL,address text NOT NULL,total int NOT NULL,status text NOT NULL DEFAULT 'Menunggu Konfirmasi',items jsonb NOT NULL,created_at timestamptz DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS settings(key text PRIMARY KEY,value text NOT NULL)`;
      await ensureStock();
      const [{n}]=await sql`SELECT count(*)::int AS n FROM products`;
      if(!n)for(const [i,[c,nm,pr]] of SEED.entries())
        await sql`INSERT INTO products(name,category,price,stock,bg,colors) VALUES(${nm},${c},${pr},${10+(i*7)%20},${BGS[i%BGS.length]},${JSON.stringify(defCols(c))}::jsonb)`;
      return J({ok:true,pesan:'Database siap. Buka kembali halaman toko.'});
    }
    if(a=='admin'){
      await ensureStock();
      const products=await sql`SELECT * FROM products WHERE NOT hidden ORDER BY id`;
      const orders=await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 1000`;
      const log=await sql`SELECT * FROM stock_log ORDER BY id DESC LIMIT 150`;
      return J({products,orders,log,bank:await getBank()});
    }
    if(a=='opname'&&m=='POST'){
      const x=await body();
      const items=(Array.isArray(x.items)?x.items:[]).slice(0,300)
        .filter(i=>i&&i.fisik!==''&&i.fisik!=null&&Number(i.id)>0)
        .map(i=>({id:Math.round(+i.id),f:num(i.fisik)}));
      if(!items.length)return J({error:'Belum ada hitungan fisik yang diisi.'},400);
      const note=clean(x.note).slice(0,200);
      await ensureStock();
      await sql.transaction(items.map(i=>sql`WITH r AS (SELECT COALESCE(SUM((it->>'q')::int),0)::int AS q FROM orders o, jsonb_array_elements(o.items) it WHERE o.status IN ('Menunggu Konfirmasi','Lunas') AND (it->>'id')::int=${i.id}::int),
        o AS (SELECT id,name,stock FROM products WHERE id=${i.id}::int AND NOT hidden FOR UPDATE),
        u AS (UPDATE products SET stock=GREATEST(0,${i.f}::int-(SELECT q FROM r)),counted_at=now(),counted_qty=${i.f}::int WHERE id=${i.id}::int AND NOT hidden RETURNING id)
        INSERT INTO stock_log(product_id,name,qty_before,qty_after,physical,reserved,note) SELECT o.id,o.name,o.stock,GREATEST(0,${i.f}::int-(SELECT q FROM r)),${i.f}::int,(SELECT q FROM r),${note}::text FROM o`));
      return J({ok:true,n:items.length});
    }
    if(a=='products'&&m=='POST'){
      const x=await body(),nm=clean(x.name).slice(0,120);
      if(!nm)return J({error:'Nama barang wajib diisi.'},400);
      const c=CATS.includes(x.category)?x.category:CATS[0];
      const [r]=await sql`INSERT INTO products(name,category,price,stock,description,bg,colors) VALUES(${nm},${c},${num(x.price)},${num(x.stock)},${clean(x.description).slice(0,1000)},${hex(x.bg)?x.bg:'#e8dfd0'},${JSON.stringify(defCols(c))}::jsonb) RETURNING id`;
      return J(r);
    }
    if(a=='products'&&b&&m=='PATCH'){
      const x=await body();
      const images=Array.isArray(x.images)?x.images.filter(u=>typeof u=='string'&&u.startsWith('https://')).slice(0,4):null;
      const colors=Array.isArray(x.colors)?x.colors.filter(c=>c&&typeof c.n=='string'&&Array.isArray(c.c)&&c.c.length&&c.c.every(hex)).map(c=>({n:c.n.slice(0,30),c:c.c.slice(0,6)})).slice(0,40):null;
      await sql`UPDATE products SET name=COALESCE(${x.name?clean(x.name).slice(0,120):null},name),category=COALESCE(${CATS.includes(x.category)?x.category:null},category),price=COALESCE(${x.price==null?null:num(x.price)},price),stock=COALESCE(${x.stock==null?null:num(x.stock)},stock),description=COALESCE(${x.description==null?null:clean(x.description).slice(0,1000)},description),bg=COALESCE(${hex(x.bg)?x.bg:null},bg),images=COALESCE(${images?JSON.stringify(images):null}::jsonb,images),colors=COALESCE(${colors?JSON.stringify(colors):null}::jsonb,colors),location=COALESCE(${x.location==null?null:clean(x.location).slice(0,40)},location) WHERE id=${+b}`;
      return J({ok:true});
    }
    if(a=='products'&&b&&m=='DELETE'){await sql`UPDATE products SET hidden=true WHERE id=${+b}`;return J({ok:true})}
    if(a=='orders'&&b&&m=='PATCH'){
      const {status}=await body();
      const [o]=await sql`SELECT * FROM orders WHERE id=${+b}`;
      if(!o)return J({error:'Pesanan tidak ditemukan.'},404);
      const allow={'Menunggu Konfirmasi':['Lunas','Dibatalkan'],'Lunas':['Dikirim']}[o.status]||[];
      if(!allow.includes(status))return J({error:'Perubahan status tidak valid.'},400);
      const q=[sql`UPDATE orders SET status=${status}::text,paid_at=CASE WHEN ${status}::text='Lunas' THEN now() ELSE paid_at END,shipped_at=CASE WHEN ${status}::text='Dikirim' THEN now() ELSE shipped_at END,cancelled_at=CASE WHEN ${status}::text='Dibatalkan' THEN now() ELSE cancelled_at END WHERE id=${o.id}`];
      if(status=='Lunas')o.items.forEach(i=>q.push(sql`UPDATE products SET sold=sold+${i.q} WHERE id=${i.id}`));
      if(status=='Dibatalkan')o.items.forEach(i=>q.push(sql`UPDATE products SET stock=stock+${i.q} WHERE id=${i.id}`));
      await sql.transaction(q);
      return J({ok:true});
    }
    if(a=='bank'&&m=='PUT'){
      const x=await body();
      await sql.transaction(['bank','no','an'].map(k=>sql`INSERT INTO settings(key,value) VALUES(${'bank_'+k},${clean(x[k]).slice(0,80)}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`));
      return J({ok:true});
    }
    if(a=='upload'&&m=='POST'){
      const f=(await req.formData()).get('file');
      if(!f||!f.type?.startsWith('image/')||f.size>3e6)return J({error:'File harus berupa gambar, maksimal 3 MB.'},400);
      const r=await put('produk/foto.'+(f.type.split('/')[1]||'jpg').replace('jpeg','jpg'),f,{access:'public',addRandomSuffix:true,contentType:f.type});
      let n=null;
      if(b&&+b>0){
        const [u]=await sql`UPDATE products SET images=CASE WHEN jsonb_array_length(images)<4 THEN images||jsonb_build_array(${r.url}::text) ELSE images END WHERE id=${+b} AND NOT hidden RETURNING jsonb_array_length(images) AS n`;
        n=u?u.n:null;
      }
      return J({url:r.url,n});
    }
    return J({error:'Tidak ditemukan.'},404);
  }catch(e){
    const msg=String(e.message||e);
    return J({error:/check constraint|stock/i.test(msg)?'Stok tidak cukup.':msg},500);
  }
}
