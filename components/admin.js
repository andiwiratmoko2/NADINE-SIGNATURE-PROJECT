'use client';
import {useState,useEffect} from 'react';
import {PAL,swBg,CATS,rp} from '@/lib/data';
import {printStruk} from '@/components/receipt';

const api=async(u,m='GET',b)=>{
  const r=await fetch(u,{method:m,headers:b?{'Content-Type':'application/json'}:{},body:b?JSON.stringify(b):undefined});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(d.error||'Gagal'),{status:r.status});
  return d;
};
const shrink=f=>new Promise(res=>{const im=new Image();im.onload=()=>{const k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(res,'image/jpeg',.82)};im.src=URL.createObjectURL(f)});

const sku=id=>'SKU-'+String(id).padStart(3,'0');
const tgl=t=>t?new Date(t).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'Belum pernah';
const wkt=t=>new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const DAY=864e5;
const dt=t=>t?new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
const dk=t=>new Date(t).toLocaleDateString('sv-SE');
const saveCsv=(L,name)=>{
  const t='\ufeff'+L.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8'}));a.download=name+'-'+dk(Date.now())+'.csv';a.click();
};
const stCls=st=>st=='Dibatalkan'?'kr':st=='Menunggu Konfirmasi'?'ls':'ok';
const itemsTxt=o=>o.items.map(i=>`${i.n} (${i.s}, ${i.c||'-'}) ×${i.q}`).join(', ');
const OrderDates=({o})=><small>Dipesan {dt(o.created_at)}{o.paid_at?' · Lunas '+dt(o.paid_at):''}{o.shipped_at?' · Dikirim '+dt(o.shipped_at):''}{o.cancelled_at?' · Batal '+dt(o.cancelled_at):''}</small>;
const stale=p=>!p.counted_at||Date.now()-new Date(p.counted_at).getTime()>30*DAY;
const reservedOf=orders=>{const m={};orders.filter(o=>o.status=='Menunggu Konfirmasi'||o.status=='Lunas').forEach(o=>o.items.forEach(i=>{m[i.id]=(m[i.id]||0)+i.q}));return m};
const Pill=({d})=>d==null?null:d==0?<span className="pill ok">Cocok</span>:d<0?<span className="pill kr">Kurang {-d}</span>:<span className="pill ls">Lebih {d}</span>;

function Opname({products,orders,reload}){
  const [cnt,setCnt]=useState({}),[q,setQ]=useState(''),[cat,setCat]=useState(''),[old,setOld]=useState(false),[note,setNote]=useState(''),[busy,setBusy]=useState(false);
  const rsv=reservedOf(orders);
  const exp=p=>p.stock+(rsv[p.id]||0);
  const has=p=>cnt[p.id]!==undefined&&cnt[p.id]!=='';
  const rows=products.filter(p=>(!cat||p.category==cat)&&(!old||stale(p))&&(!q||(p.name+' '+sku(p.id)+' '+(p.location||'')).toLowerCase().includes(q.toLowerCase())));
  const filled=products.filter(has),bad=filled.filter(p=>+cnt[p.id]!=exp(p));
  const step=(p,d)=>setCnt(o=>({...o,[p.id]:String(Math.max(0,(has(p)?+cnt[p.id]:exp(p))+d))}));
  async function save(){
    if(!filled.length)return;
    if(!confirm(`Simpan ${filled.length} hitungan?\n${bad.length?bad.length+' barang berselisih — stok sistem akan disesuaikan dengan hitungan fisik.':'Semua hitungan cocok dengan sistem.'}`))return;
    setBusy(true);
    try{await api('/api/opname','POST',{items:filled.map(p=>({id:p.id,fisik:+cnt[p.id]})),note});setCnt({});setNote('');await reload()}
    catch(e){alert(e.message)}
    setBusy(false);
  }
  function csv(){
    const L=[['Kode','Nama','Kategori','Lokasi','Stok Sistem','Dipesan (belum dikirim)','Seharusnya di Rak','Hitung Fisik','Selisih','Terakhir Dihitung']];
    rows.forEach(p=>L.push([sku(p.id),p.name,p.category,p.location||'',p.stock,rsv[p.id]||0,exp(p),has(p)?cnt[p.id]:'',has(p)?+cnt[p.id]-exp(p):'',p.counted_at?tgl(p.counted_at):'']));
    saveCsv(L,'stock-taking');
  }
  return(<div className="opn">
    <div className="box noprint" style={{marginBottom:12}}>
      <div className="full">
        <input className="in" style={{flex:1,minWidth:170}} placeholder="Cari nama, kode, atau lokasi rak" value={q} onChange={e=>setQ(e.target.value)}/>
        <select className="in" value={cat} onChange={e=>setCat(e.target.value)}><option value="">Semua kategori</option>{CATS.map(c=><option key={c}>{c}</option>)}</select>
        <label style={{fontSize:12,color:'var(--mut)'}}><input type="checkbox" checked={old} onChange={e=>setOld(e.target.checked)}/> Belum dihitung &gt; 30 hari</label>
        <button className="up" onClick={()=>window.print()}>Cetak Lembar Hitung</button>
        <button className="up" onClick={csv}>Unduh CSV</button>
      </div>
      <div className="bar"><i style={{width:(products.length?filled.length/products.length*100:0)+'%'}}/></div>
      <small style={{color:'var(--mut)'}}>Dihitung sesi ini: {filled.length} dari {products.length} barang{bad.length?` · ${bad.length} berselisih`:''}. Hitung semua barang yang ada di rak, termasuk yang sudah dipesan tapi belum dikirim.</small>
    </div>
    {rows.map(p=>{const r=rsv[p.id]||0,e=exp(p),d=has(p)?+cnt[p.id]-e:null;
      return(<div key={p.id} className={'or'+(has(p)?' done':'')}>
        <div><h5>{p.name}</h5><small>{sku(p.id)} · {p.category}{p.location?' · Rak '+p.location:''}<br/>Dihitung: {tgl(p.counted_at)}</small></div>
        <div className="fg"><span>Sistem<b>{p.stock}</b></span><span>Dipesan<b>{r}</b></span><span>Di rak seharusnya<b>{e}</b></span></div>
        <div className="ct">
          <button className="s noprint" onClick={()=>step(p,-1)} aria-label="Kurangi">−</button>
          <input className="in" inputMode="numeric" type="number" min="0" placeholder="Fisik" aria-label={'Hitung fisik '+p.name} value={cnt[p.id]??''} onChange={ev=>setCnt(o=>({...o,[p.id]:ev.target.value}))}/>
          <button className="s noprint" onClick={()=>step(p,1)} aria-label="Tambah">+</button>
          <button className="s noprint" style={{width:'auto',padding:'0 10px',fontSize:12}} title="Hitungan sama dengan seharusnya" onClick={()=>setCnt(o=>({...o,[p.id]:String(e)}))}>Cocok</button>
          <Pill d={d}/>
        </div>
      </div>)})}
    {!rows.length&&<p className="empty">Tidak ada barang yang cocok dengan filter.</p>}
    <div className="box noprint" style={{marginTop:12}}><div className="full">
      <input className="in" style={{flex:1,minWidth:180}} placeholder="Catatan (mis. Opname akhir bulan)" value={note} onChange={e=>setNote(e.target.value)}/>
      <button className="b1" style={{width:'auto',margin:0,padding:'10px 26px',opacity:filled.length?1:.4}} onClick={save}>{busy?'Menyimpan…':`Simpan ${filled.length} Hitungan`}</button>
      <button style={{fontSize:13,color:'var(--mut)'}} onClick={()=>confirm('Kosongkan semua isian hitungan?')&&setCnt({})}>Kosongkan</button></div>
      <small style={{color:'var(--mut)'}}>Saat disimpan, stok sistem = hitungan fisik dikurangi barang yang sudah dipesan tapi belum dikirim. Setiap hitungan tercatat di riwayat.</small></div>
  </div>);
}

function Sales({orders,bank}){
  const [f,setF]=useState({from:'',to:'',st:'',by:'created_at'}),[all,setAll]=useState(false);
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const today=dk(Date.now());
  const quick=(a,b)=>setF(o=>({...o,from:a,to:b}));
  const rows=orders.filter(o=>{
    const t=o[f.by];
    if((f.from||f.to)&&!t)return false;
    const k=t&&dk(t);
    return(!f.st||o.status==f.st)&&(!f.from||k>=f.from)&&(!f.to||k<=f.to);
  });
  const paid=rows.filter(o=>o.status=='Lunas'||o.status=='Dikirim');
  const pcs=paid.reduce((s,o)=>s+o.items.reduce((a,i)=>a+i.q,0),0);
  const cards=[['Jumlah Pesanan',rows.length],['Pendapatan (Lunas + Dikirim)',rp(paid.reduce((s,o)=>s+o.total,0))],['Barang Terjual',pcs+' pcs'],['Menunggu Konfirmasi',rows.filter(o=>o.status=='Menunggu Konfirmasi').length],['Dibatalkan',rows.filter(o=>o.status=='Dibatalkan').length]];
  const csv=()=>saveCsv([['Kode','Tanggal Pesan','Tanggal Bayar','Tanggal Kirim','Tanggal Batal','Pelanggan','WhatsApp','Alamat','Barang','Total','Status'],...rows.map(o=>[o.code,dt(o.created_at),dt(o.paid_at),dt(o.shipped_at),dt(o.cancelled_at),o.name,o.phone,o.address,itemsTxt(o),o.total,o.status])],'riwayat-penjualan');
  return(<div>
    <div className="box" style={{marginBottom:12}}>
      <div className="full">
        <label className="lb2">BERDASARKAN<select className="in" value={f.by} onChange={e=>set('by',e.target.value)}><option value="created_at">Tanggal pesan</option><option value="paid_at">Tanggal bayar</option><option value="shipped_at">Tanggal kirim</option></select></label>
        <label className="lb2">DARI<input type="date" className="in" value={f.from} onChange={e=>set('from',e.target.value)}/></label>
        <label className="lb2">SAMPAI<input type="date" className="in" value={f.to} onChange={e=>set('to',e.target.value)}/></label>
        <label className="lb2">STATUS<select className="in" value={f.st} onChange={e=>set('st',e.target.value)}><option value="">Semua</option>{['Menunggu Konfirmasi','Lunas','Dikirim','Dibatalkan'].map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="full" style={{marginTop:10}}>
        <button className="up" onClick={()=>quick(today,today)}>Hari ini</button>
        <button className="up" onClick={()=>quick(dk(Date.now()-6*DAY),today)}>7 hari terakhir</button>
        <button className="up" onClick={()=>quick(today.slice(0,8)+'01',today)}>Bulan ini</button>
        <button className="up" onClick={()=>setF(o=>({...o,from:'',to:'',st:''}))}>Semua</button>
        <button className="up" onClick={csv}>Unduh CSV</button>
      </div>
    </div>
    <div className="st" style={{marginBottom:12}}>{cards.map(x=><div className="box" key={x[0]}><small style={{color:'var(--mut)'}}>{x[0]}</small><br/><b style={{fontSize:19}}>{x[1]}</b></div>)}</div>
    {(all?rows:rows.slice(0,40)).map(o=>(<div className="ci" key={o.id} style={{alignItems:'flex-start'}}>
      <div className="nm"><b>{o.code}</b> · {o.name} · {o.phone}<br/><small>{itemsTxt(o)}</small><br/><OrderDates o={o}/></div>
      <div style={{textAlign:'right'}}><b>{rp(o.total)}</b><br/><span className={'pill '+stCls(o.status)}>{o.status}</span><br/>
        <button className="up" style={{marginTop:6,display:'inline-block'}} onClick={()=>printStruk({...o,date:o.created_at},bank)}>Cetak Struk</button></div></div>))}
    {!rows.length&&<p className="empty">Tidak ada pesanan pada filter ini.</p>}
    {!all&&rows.length>40&&<button className="up" onClick={()=>setAll(true)}>Tampilkan semua ({rows.length})</button>}
  </div>);
}

function LogList({log}){
  const [all,setAll]=useState(false);
  if(!log||!log.length)return <p className="empty">Belum ada riwayat stock taking.</p>;
  return(<>{(all?log:log.slice(0,25)).map(l=>(<div className="ci" key={l.id} style={{padding:'10px 14px'}}>
    <div className="nm"><b>{l.name}</b> <small>{sku(l.product_id)} · {wkt(l.created_at)}</small><br/>
      <small>Fisik {l.physical} · Dipesan {l.reserved} · Stok sistem {l.qty_before} → {l.qty_after}{l.note?' · '+l.note:''}</small></div>
    <Pill d={l.physical-(l.qty_before+l.reserved)}/></div>))}
    {!all&&log.length>25&&<button className="up" onClick={()=>setAll(true)}>Tampilkan semua ({log.length})</button>}</>);
}

function Row({p,reload}){
  const [v,setV]=useState(p),[busy,setBusy]=useState(false),[sel,setSel]=useState(0),[nc,setNc]=useState({n:'',a:'#c4a25d',b:'#111111',m:false});
  const set=(k,x)=>setV(o=>({...o,[k]:x}));
  async function up(files){
    for(const f of [...files].slice(0,Math.max(0,4-v.images.length))){
      const fd=new FormData();fd.append('file',await shrink(f),'foto.jpg');
      const r=await fetch('/api/upload',{method:'POST',body:fd}),d=await r.json();
      if(!r.ok)return alert(d.error);
      setV(o=>({...o,images:[...o.images,d.url].slice(0,4)}));
    }
  }
  async function save(){
    setBusy(true);
    try{await api('/api/products?id='+p.id,'PATCH',{name:v.name,category:v.category,price:+v.price,stock:+v.stock,description:v.description,bg:v.bg,images:v.images,colors:v.colors,location:v.location||''});await reload()}
    catch(e){alert(e.message)}
    setBusy(false);
  }
  async function del(){if(confirm('Hapus barang ini dari toko?')){await api('/api/products?id='+p.id,'DELETE');reload()}}
  const addCol=c=>!v.colors.some(x=>x.n==c.n)&&set('colors',[...v.colors,c]);
  return(<div className="ci">
    <div className="im" style={{background:v.bg}}>{v.images[0]&&<img src={v.images[0]} alt=""/>}</div>
    <input className="in" style={{flex:1,minWidth:150}} value={v.name} onChange={e=>set('name',e.target.value)}/>
    <label className="lb2">KATEGORI<select className="in" value={v.category} onChange={e=>set('category',e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select></label>
    <label className="lb2">LATAR<input type="color" className="in" style={{width:48,padding:2,height:34}} value={v.bg} onChange={e=>set('bg',e.target.value)}/></label>
    <label className="lb2">HARGA<input className="in" type="number" value={v.price} onChange={e=>set('price',e.target.value)}/></label>
    <label className="lb2">STOK<input className="in" type="number" style={{width:80}} value={v.stock} onChange={e=>set('stock',e.target.value)}/></label>
    <label className="lb2">LOKASI RAK<input className="in" style={{width:100}} placeholder="mis. A-2" value={v.location||''} onChange={e=>set('location',e.target.value)}/></label>
    <span style={{fontSize:12,color:'var(--mut)'}}>Terjual {p.sold}</span>
    <div className="full"><small style={{color:'var(--mut)'}}>{sku(p.id)} · Terakhir dihitung: {tgl(p.counted_at)}{p.counted_at?` (${p.counted_qty} pcs di rak)`:''}</small></div>
    <div className="full"><span className="lb2">WARNA</span>
      {v.colors.map((c,k)=><button key={k} title={c.n+' (klik untuk hapus)'} style={{width:30,height:30,borderRadius:'50%',background:swBg(c),boxShadow:'0 0 0 1px var(--line)'}} onClick={()=>set('colors',v.colors.filter((_,j)=>j!=k))}/>)}
      <select className="in" value={sel} onChange={e=>setSel(+e.target.value)}>{PAL.map((c,k)=><option key={k} value={k}>{c.n}</option>)}</select>
      <button className="up" onClick={()=>addCol(PAL[sel])}>+ Warna</button>
      <input className="in" placeholder="Nama warna baru" style={{width:130}} value={nc.n} onChange={e=>setNc({...nc,n:e.target.value})}/>
      <input className="in" type="color" style={{width:44,padding:2,height:34}} value={nc.a} onChange={e=>setNc({...nc,a:e.target.value})}/>
      <input className="in" type="color" style={{width:44,padding:2,height:34}} value={nc.b} onChange={e=>setNc({...nc,b:e.target.value})}/>
      <label style={{fontSize:11,color:'var(--mut)'}}><input type="checkbox" checked={nc.m} onChange={e=>setNc({...nc,m:e.target.checked})}/> Multi</label>
      <button className="up" onClick={()=>nc.n.trim()&&addCol({n:nc.n.trim(),c:nc.m?[nc.a,nc.b]:[nc.a]})}>+ Kustom</button>
      <small style={{color:'var(--mut)'}}>Klik warna untuk menghapus</small></div>
    <div className="full">
      {v.images.map((x,k)=><span className="pv" key={k}><img src={x} alt=""/><button onClick={()=>set('images',v.images.filter((_,j)=>j!=k))}>×</button></span>)}
      {v.images.length<4&&<label className="up">+ Foto Produk<input type="file" accept="image/*" multiple hidden onChange={e=>up(e.target.files)}/></label>}
      <small style={{color:'var(--mut)'}}>Maks. 4 foto per produk</small></div>
    <textarea className="in" style={{flex:'1 1 100%',width:'100%',minHeight:56,fontFamily:'inherit'}} placeholder="Deskripsi produk" value={v.description} onChange={e=>set('description',e.target.value)}/>
    <button className="b1" style={{width:'auto',margin:0,padding:'10px 28px'}} onClick={save}>{busy?'Menyimpan…':'Simpan Perubahan'}</button>
    <button style={{color:'#c0392b',fontSize:13}} onClick={del}>Hapus Barang</button>
  </div>);
}

export default function Admin(){
  const [d,setD]=useState(null),[pw,setPw]=useState(''),[err,setErr]=useState(''),[bank,setBank]=useState(null);
  const [nf,setNf]=useState({name:'',category:CATS[0],price:'',stock:'',description:'',bg:'#e8dfd0'});
  const load=async()=>{try{const r=await api('/api/admin');setD(r);setBank(b=>b||r.bank)}catch(e){e.status==401?setD(false):setErr(e.message)}};
  useEffect(()=>{load()},[]);
  async function login(){setErr('');try{await api('/api/login','POST',{password:pw});setPw('');setD(null);load()}catch(e){setErr(e.message)}}
  async function act(f){try{await f();await load()}catch(e){alert(e.message)}}

  if(d===null&&!err)return <div className="wrap"><p className="empty">Memuat…</p></div>;
  if(d===false||(d===null&&err&&!/relation|does not exist/i.test(err)&&false))return(<div className="wrap"><div className="panel" style={{maxWidth:380,margin:'60px auto'}}>
    <div><h4>Masuk Penjual</h4></div>
    <div><input className="note" style={{marginTop:0}} type="password" placeholder="Password penjual" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key=='Enter'&&login()}/>
      {err&&<p className="low" style={{marginTop:10}}>{err}</p>}<button className="b1" onClick={login}>Masuk</button></div></div></div>);
  if(!d)return <div className="wrap"><p className="empty">{err}<br/>Jika ini pertama kali, login lalu buka <a href="/api/setup"><u>/api/setup</u></a> sekali.</p></div>;

  const sold=d.products.reduce((s,p)=>s+p.sold,0),stock=d.products.reduce((s,p)=>s+p.stock,0);
  const stl=d.products.filter(stale).length,go=id=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
  const rev=d.orders.filter(o=>o.status=='Lunas'||o.status=='Dikirim').reduce((s,o)=>s+o.total,0),wait=d.orders.filter(o=>o.status=='Menunggu Konfirmasi').length;
  return(<div className="wrap" style={{paddingBottom:60}}>
    <div className="crumb">Dasbor Penjual <a style={{float:'right',cursor:'pointer'}} onClick={async()=>{await api('/api/logout','POST');setD(false)}}>Keluar</a></div>
    <div className="st">{[['Terjual',sold+' pcs'],['Pendapatan',rp(rev)],['Total Stok',stock+' pcs'],['Menunggu Konfirmasi',wait],['Belum Dihitung (30 hari)',stl+' barang']].map(x=><div className="box" key={x[0]}><small style={{color:'var(--mut)'}}>{x[0]}</small><br/><b style={{fontSize:20}}>{x[1]}</b></div>)}</div>

    <div className="tabs" style={{marginTop:16,paddingBottom:0}}>{[['stok','Stock Taking'],['rek','Rekening'],['barang','Barang & Stok'],['pesanan','Pesanan'],['jual','Riwayat Penjualan'],['riwayat','Riwayat Stock Taking']].map(x=><button key={x[0]} onClick={()=>go(x[0])}>{x[1]}</button>)}</div>

    <h3 className="sh" id="stok">Stock Taking</h3>
    <Opname products={d.products} orders={d.orders} reload={load}/>

    <h3 className="sh" id="rek">Rekening Pembayaran</h3>
    <div className="box"><div className="full">
      <input className="in" placeholder="Nama bank" value={bank.bank} onChange={e=>setBank({...bank,bank:e.target.value})}/>
      <input className="in" style={{flex:1,minWidth:160}} placeholder="Nomor rekening" value={bank.no} onChange={e=>setBank({...bank,no:e.target.value})}/>
      <input className="in" style={{flex:1,minWidth:160}} placeholder="Atas nama" value={bank.an} onChange={e=>setBank({...bank,an:e.target.value})}/>
      <button className="b1" style={{width:'auto',margin:0,padding:'10px 24px'}} onClick={()=>act(async()=>{await api('/api/bank','PUT',bank);alert('Rekening tersimpan.')})}>Simpan</button></div>
      <small style={{color:'var(--mut)'}}>Tampil di halaman pembayaran pembeli.</small></div>

    <h3 className="sh">Tambah Barang</h3>
    <div className="box"><div className="full">
      <input className="in" style={{flex:1,minWidth:160}} placeholder="Nama barang" value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})}/>
      <select className="in" value={nf.category} onChange={e=>setNf({...nf,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
      <input className="in" type="number" placeholder="Harga" value={nf.price} onChange={e=>setNf({...nf,price:e.target.value})}/>
      <input className="in" type="number" placeholder="Stok" style={{width:80}} value={nf.stock} onChange={e=>setNf({...nf,stock:e.target.value})}/>
      <input className="in" type="color" title="Warna latar" style={{width:48,padding:2,height:34}} value={nf.bg} onChange={e=>setNf({...nf,bg:e.target.value})}/>
      <input className="in" placeholder="Deskripsi produk" style={{flex:'1 1 100%',width:'100%'}} value={nf.description} onChange={e=>setNf({...nf,description:e.target.value})}/>
      <button className="b1" style={{width:'auto',margin:0,padding:'10px 24px'}} onClick={()=>act(async()=>{await api('/api/products','POST',nf);setNf({...nf,name:'',price:'',stock:'',description:''})})}>Tambah</button></div>
      <small style={{color:'var(--mut)'}}>Setelah ditambahkan, unggah foto dan atur warna pada daftar di bawah.</small></div>

    <h3 className="sh" id="barang">Barang, Harga &amp; Stok</h3>
    {d.products.map(p=><Row key={p.id+':'+p.name+':'+p.stock+':'+(p.counted_at||'')} p={p} reload={load}/>)}

    <h3 className="sh" id="pesanan">Pesanan Masuk</h3>
    {d.orders.some(o=>o.status=='Menunggu Konfirmasi'||o.status=='Lunas')?d.orders.filter(o=>o.status=='Menunggu Konfirmasi'||o.status=='Lunas').map(o=>(<div className="ci" key={o.id} style={{alignItems:'flex-start'}}>
      <div className="nm"><b>{o.code}</b> · {o.name} · {o.phone}<br/><small>{o.address}</small><br/><small>{itemsTxt(o)}</small><br/><OrderDates o={o}/></div>
      <div style={{textAlign:'right'}}><b>{rp(o.total)}</b><br/><small style={{color:'var(--gold)'}}>{o.status}</small><br/>
        {o.status=='Menunggu Konfirmasi'&&<><button className="b2" style={{padding:'8px 16px',marginTop:6,width:'auto'}} onClick={()=>act(async()=>{await api('/api/orders?id='+o.id,'PATCH',{status:'Lunas'});if(confirm('Pesanan ditandai lunas. Cetak struk sekarang?'))printStruk({...o,date:o.created_at,status:'Lunas',paid_at:new Date().toISOString()},d.bank)})}>Tandai Lunas</button><br/><button style={{fontSize:12,color:'#c0392b',marginTop:6}} onClick={()=>confirm('Batalkan pesanan dan kembalikan stok?')&&act(()=>api('/api/orders?id='+o.id,'PATCH',{status:'Dibatalkan'}))}>Batalkan</button></>}
        <button className="up" style={{marginTop:6,display:'inline-block'}} onClick={()=>printStruk({...o,date:o.created_at},d.bank)}>Cetak Struk</button><br/>
        {o.status=='Lunas'&&<button className="b2" style={{padding:'8px 16px',marginTop:6,width:'auto'}} onClick={()=>act(()=>api('/api/orders?id='+o.id,'PATCH',{status:'Dikirim'}))}>Tandai Dikirim</button>}
      </div></div>)):<p className="empty">Tidak ada pesanan yang perlu diproses.</p>}

    <h3 className="sh" id="jual">Riwayat Penjualan</h3>
    <Sales orders={d.orders} bank={d.bank}/>

    <h3 className="sh" id="riwayat">Riwayat Stock Taking</h3>
    <LogList log={d.log}/>
  </div>);
}
