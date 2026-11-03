'use client';
import {useState,useEffect} from 'react';
import Link from 'next/link';
import {useRouter,usePathname} from 'next/navigation';
import {StrukCard} from '@/components/receipt';
import {rp,sizes,swBg} from '@/lib/data';

const getCart=()=>{try{return JSON.parse(localStorage.getItem('ns_cart')||'[]')}catch{return[]}};
const setCart=c=>{localStorage.setItem('ns_cart',JSON.stringify(c));window.dispatchEvent(new Event('cart'))};
const Mono=({w})=>(<svg viewBox="0 0 40 40" style={{width:w}}><circle cx="20" cy="20" r="18.5" fill="none" stroke="#c4a25d" strokeWidth="1.3"/><path d="M12.5 28.5V11.5l15 17v-17" fill="none" stroke="#c4a25d" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round"/><path d="M8 32.5c8 3.6 17 3.4 24-1.5" fill="none" stroke="#f6f2ea" strokeWidth="1.2" strokeLinecap="round" opacity=".8"/></svg>);
export const Pic=({p,k=0})=>p.images?.[k]?<img src={p.images[k]} alt={p.name}/>:<svg className="ph" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/><path d="M12.5 28.5V11.5l15 17v-17"/></svg>;

export function Header(){
  const [n,setN]=useState(0),path=usePathname()||'';
  useEffect(()=>{const f=()=>setN(getCart().reduce((s,c)=>s+c.q,0));f();window.addEventListener('cart',f);return()=>window.removeEventListener('cart',f)},[]);
  if(path.startsWith('/admin'))return(<header><div className="brand"><Mono w={38}/><div><b>Nadine</b><i>SIGNATURE</i></div></div></header>);
  return(<header>
    <Link href="/" className="brand"><Mono w={38}/><div><b>Nadine</b><i>SIGNATURE</i></div></Link>
    <form action="/" className="search"><input name="q" placeholder="Cari produk pilihan…"/></form>
    <Link href="/keranjang" className="ic">KERANJANG <em>{n}</em></Link>
  </header>);
}

export function Shop({products}){
  const [c,setC]=useState('Semua');
  const cats=['Semua',...new Set(products.map(p=>p.category))];
  const l=products.filter(p=>c=='Semua'||p.category==c);
  return(<div className="wrap">
    <nav className="tabs">{cats.map(x=><button key={x} className={x==c?'on':''} onClick={()=>setC(x)}>{x}</button>)}</nav>
    <main className="grid">
      {l.map(p=>(<Link key={p.id} href={'/produk?id='+p.id} className="card">
        <div className="img" style={{background:p.bg}}><Pic p={p}/></div>
        <div className="info"><small>{p.category}</small><h3>{p.name}</h3><div className="pr">{rp(p.price)}</div>{p.stock<=0&&<div className="low">Stok habis</div>}</div>
      </Link>))}
    </main>
    {!l.length&&<p className="empty">Belum ada produk.</p>}
  </div>);
}

export function ProductView({p}){
  const r=useRouter(),S=sizes(p.category);
  const [s,setS]=useState(S[Math.min(1,S.length-1)]),[ci,setCi]=useState(0),[q,setQ]=useState(1),[t,setT]=useState(0);
  const col=p.colors[ci],max=Math.max(1,Math.min(99,p.stock));
  const add=()=>{
    if(p.stock<=0)return;
    const c=getCart(),k=c.find(x=>x.id==p.id&&x.s==s&&x.c==(col?.n||''));
    k?k.q=Math.min(99,k.q+q):c.push({id:p.id,name:p.name,price:p.price,img:p.images?.[0]||'',bg:p.bg,s,c:col?.n||'',q,sel:true});
    setCart(c);r.push('/keranjang');
  };
  return(<div className="wrap">
    <div className="crumb"><Link href="/">Beranda</Link> › {p.category} › {p.name}</div>
    <div className="pd">
      <div>
        <div className="main" style={{background:p.bg}}><Pic p={p} k={t}/></div>
        {p.images.length>1&&<div className="ths">{p.images.map((x,k)=><button key={k} className={'th'+(k==t?' on':'')} style={{background:p.bg}} onClick={()=>setT(k)}><Pic p={p} k={k}/></button>)}</div>}
      </div>
      <div>
        <h1 className="t">{p.name}</h1><div className="big">{rp(p.price)}</div>
        <div className="lb">PILIH UKURAN</div>
        <div className="sz">{S.map(x=><button key={x} className={x==s?'on':''} onClick={()=>setS(x)}>{x}</button>)}
          {p.stock<=0?<span className="low">● Stok habis</span>:p.stock<=5&&<span className="low">● Sisa {p.stock} stok!</span>}</div>
        <div className="lb">WARNA{col&&<> · <b>{col.n}</b></>}</div>
        <div className="sw">{p.colors.map((c,k)=><button key={k} title={c.n} className={k==ci?'on':''} style={{background:swBg(c)}} onClick={()=>setCi(k)}/>)}</div>
        <div className="lb">DESKRIPSI</div>
        <p className="desc">{p.description||`${p.name} dari Nadine Signature dibuat dengan bahan berkualitas, jahitan rapi, dan potongan modern yang nyaman dipakai setiap hari.`}</p>
        <div className="lb">PENGIRIMAN</div>
        <div className="box">Dikirim dari <b>Jakarta Selatan</b><br/>Ongkos kirim dikonfirmasi penjual lewat WhatsApp.</div>
      </div>
      <aside className="panel">
        <div><h4>Atur Pesanan</h4></div>
        <div><div className="row"><span className="cap">KUANTITAS</span><span className="qty"><button onClick={()=>setQ(Math.max(1,q-1))}>−</button>{Math.min(q,max)}<button onClick={()=>setQ(Math.min(max,q+1))}>+</button></span></div>
          <div className="ship">Ongkos kirim dihitung setelah pesanan dibuat.</div></div>
        <div><div className="row"><span className="cap">ESTIMASI SUBTOTAL</span><b>{rp(p.price*Math.min(q,max))}</b></div>
          <button className={'b1'+(p.stock<=0?' dis':'')} onClick={add}>Tambah ke Keranjang</button></div>
        <div className="row"><div style={{display:'flex',alignItems:'center',gap:12}}><span style={{background:'#0a1222',borderRadius:'50%',width:40,height:40,display:'grid',placeItems:'center'}}><Mono w={26}/></span><b style={{fontSize:13}}>Toko Nadine Signature</b></div></div>
      </aside>
    </div>
  </div>);
}

export function CartView(){
  const [it,setIt]=useState(null);
  useEffect(()=>setIt(getCart()),[]);
  const save=c=>{setIt(c);setCart(c)};
  if(!it)return <div className="wrap"><p className="empty">Memuat…</p></div>;
  const sel=it.filter(x=>x.sel),t=sel.reduce((s,x)=>s+x.price*x.q,0);
  const chg=(i,d)=>{const c=[...it];c[i]={...c[i],q:c[i].q+d};save(c.filter(x=>x.q>0))};
  return(<div className="wrap"><div className="crumb"><Link href="/">Beranda</Link> › Keranjang</div>
    <div className="cart"><div>
      {it.length?it.map((x,i)=>(<div className="ci" key={i}>
        <input type="checkbox" checked={x.sel} onChange={e=>{const c=[...it];c[i]={...x,sel:e.target.checked};save(c)}}/>
        <div className="im" style={{background:x.bg}}>{x.img?<img src={x.img} alt=""/>:<svg className="ph" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/><path d="M12.5 28.5V11.5l15 17v-17"/></svg>}</div>
        <div className="nm">{x.name}<br/><small>{x.s} · {x.c||'-'} · {rp(x.price)}</small></div>
        <span className="qty"><button onClick={()=>chg(i,-1)}>−</button>{x.q}<button onClick={()=>chg(i,1)}>+</button></span>
      </div>)):<p className="empty">Keranjang masih kosong.</p>}
    </div>
    <aside className="panel"><div><h4>Pesanan</h4></div>
      <div><div className="row"><span className="cap">ESTIMASI SUBTOTAL</span><b>{rp(t)}</b></div>
      <Link href="/bayar" className={'b1'+(t?'':' dis')}>Bayar Sekarang</Link></div></aside></div></div>);
}

function Bank({bank}){return(<div className="box"><b>Transfer ke Rekening</b><br/>{bank.bank} · <b style={{letterSpacing:'.08em'}}>{bank.no}</b><br/>a.n. {bank.an}</div>)}

export function Thanks({done,it,f,bank}){
  const o={code:done.code,total:done.total,status:'Menunggu Konfirmasi',name:f.name,phone:f.phone,address:f.address,items:it,date:done.date};
  return(<div className="wrap" style={{maxWidth:560,padding:'40px 5vw 60px'}}>
    <h1 className="t" style={{marginBottom:12}}>Terima kasih</h1>
    <p className="desc" style={{marginBottom:16}}>Pesanan <b>{done.code}</b> sudah kami terima. Transfer sebesar <b>{rp(done.total)}</b> ke rekening di bawah. Penjual akan memeriksa pembayaran dan menghubungi Anda lewat WhatsApp.</p>
    <Bank bank={bank}/>
    <StrukCard o={o} bank={bank}/>
    <p className="desc" style={{fontSize:12}}>Cetak struk ini atau simpan sebagai PDF lewat jendela cetak. Struk berstatus LUNAS dapat diminta dari penjual setelah pembayaran dikonfirmasi.</p>
    <Link href="/" className="b1">Kembali Belanja</Link></div>);
}

export function PayView({bank}){
  const [it,setIt]=useState(null),[f,setF]=useState({name:'',phone:'',address:''}),[err,setErr]=useState(''),[done,setDone]=useState(null),[busy,setBusy]=useState(false);
  useEffect(()=>setIt(getCart().filter(x=>x.sel)),[]);
  if(!it)return <div className="wrap"><p className="empty">Memuat…</p></div>;
  const total=it.reduce((s,x)=>s+x.price*x.q,0);
  async function go(){
    setBusy(true);setErr('');
    try{
      const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,items:it.map(x=>({id:x.id,q:x.q,s:x.s,c:x.c}))})});
      const d=await r.json();
      if(!r.ok)setErr(d.error||'Gagal membuat pesanan.');
      else{setCart(getCart().filter(x=>!x.sel));setDone({...d,date:new Date().toISOString()})}
    }catch{setErr('Koneksi bermasalah, coba lagi.')}
    setBusy(false);
  }
  if(done)return <Thanks done={done} it={it} f={f} bank={bank}/>;
  if(!it.length)return <div className="wrap"><p className="empty">Tidak ada barang yang dipilih. <Link href="/keranjang"><u>Kembali ke keranjang</u></Link></p></div>;
  return(<div className="wrap"><div className="crumb"><Link href="/keranjang">Keranjang</Link> › Pembayaran</div>
    <div className="cart"><div>
      <div className="box" style={{marginBottom:14}}><b>Data Pengiriman</b>
        <input className="note" placeholder="Nama lengkap" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <input className="note" placeholder="No. WhatsApp" inputMode="tel" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
        <input className="note" placeholder="Alamat lengkap" value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></div>
      <Bank bank={bank}/><p className="desc" style={{fontSize:12,marginTop:10}}>Transfer sesuai total, lalu tekan tombol konfirmasi. Ongkos kirim dikonfirmasi penjual lewat WhatsApp.</p>
    </div>
    <aside className="panel"><div><h4>Ringkasan</h4></div>
      <div>{it.map((x,i)=><div className="row" key={i} style={{fontSize:13,marginBottom:6}}><span>{x.name} ({x.s}) ×{x.q}</span><span>{rp(x.price*x.q)}</span></div>)}</div>
      <div><div className="row"><span className="cap">TOTAL TRANSFER</span><b>{rp(total)}</b></div>
        {err&&<p className="low" style={{marginTop:10}}>{err}</p>}
        <button className={'b1'+(busy?' dis':'')} onClick={go}>{busy?'Memproses…':'Saya Sudah Transfer'}</button></div></aside></div></div>);
}
