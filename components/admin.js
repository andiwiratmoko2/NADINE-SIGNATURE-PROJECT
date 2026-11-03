'use client';
import {useState,useEffect} from 'react';
import {PAL,swBg,CATS,rp} from '@/lib/data';

const api=async(u,m='GET',b)=>{
  const r=await fetch(u,{method:m,headers:b?{'Content-Type':'application/json'}:{},body:b?JSON.stringify(b):undefined});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(d.error||'Gagal'),{status:r.status});
  return d;
};
const shrink=f=>new Promise(res=>{const im=new Image();im.onload=()=>{const k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(res,'image/jpeg',.82)};im.src=URL.createObjectURL(f)});

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
    try{await api('/api/products?id='+p.id,'PATCH',{name:v.name,category:v.category,price:+v.price,stock:+v.stock,description:v.description,bg:v.bg,images:v.images,colors:v.colors});await reload()}
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
    <span style={{fontSize:12,color:'var(--mut)'}}>Terjual {p.sold}</span>
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
  const rev=d.orders.filter(o=>o.status=='Lunas'||o.status=='Dikirim').reduce((s,o)=>s+o.total,0),wait=d.orders.filter(o=>o.status=='Menunggu Konfirmasi').length;
  return(<div className="wrap" style={{paddingBottom:60}}>
    <div className="crumb">Dasbor Penjual <a style={{float:'right',cursor:'pointer'}} onClick={async()=>{await api('/api/logout','POST');setD(false)}}>Keluar</a></div>
    <div className="st">{[['Terjual',sold+' pcs'],['Pendapatan',rp(rev)],['Total Stok',stock+' pcs'],['Menunggu Konfirmasi',wait]].map(x=><div className="box" key={x[0]}><small style={{color:'var(--mut)'}}>{x[0]}</small><br/><b style={{fontSize:20}}>{x[1]}</b></div>)}</div>

    <h3 className="sh">Rekening Pembayaran</h3>
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

    <h3 className="sh">Barang, Harga &amp; Stok</h3>
    {d.products.map(p=><Row key={p.id+':'+p.name} p={p} reload={load}/>)}

    <h3 className="sh">Pesanan Masuk</h3>
    {d.orders.length?d.orders.map(o=>(<div className="ci" key={o.id} style={{alignItems:'flex-start'}}>
      <div className="nm"><b>{o.code}</b> · {o.name} · {o.phone}<br/><small>{o.address}</small><br/><small>{o.items.map(i=>`${i.n} (${i.s}, ${i.c||'-'}) ×${i.q}`).join(', ')}</small></div>
      <div style={{textAlign:'right'}}><b>{rp(o.total)}</b><br/><small style={{color:'var(--gold)'}}>{o.status}</small><br/>
        {o.status=='Menunggu Konfirmasi'&&<><button className="b2" style={{padding:'8px 16px',marginTop:6,width:'auto'}} onClick={()=>act(()=>api('/api/orders?id='+o.id,'PATCH',{status:'Lunas'}))}>Tandai Lunas</button><br/><button style={{fontSize:12,color:'#c0392b',marginTop:6}} onClick={()=>confirm('Batalkan pesanan dan kembalikan stok?')&&act(()=>api('/api/orders?id='+o.id,'PATCH',{status:'Dibatalkan'}))}>Batalkan</button></>}
        {o.status=='Lunas'&&<button className="b2" style={{padding:'8px 16px',marginTop:6,width:'auto'}} onClick={()=>act(()=>api('/api/orders?id='+o.id,'PATCH',{status:'Dikirim'}))}>Tandai Dikirim</button>}
      </div></div>)):<p className="empty">Belum ada pesanan.</p>}
  </div>);
}
