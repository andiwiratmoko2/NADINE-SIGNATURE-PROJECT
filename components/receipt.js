'use client';
import {rp} from '@/lib/data';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CSS='.struk{font-family:"Courier New",Courier,monospace;color:#000;background:#fff;width:100%;max-width:300px;margin:0 auto;padding:14px 12px;font-size:12px;line-height:1.45}.struk h1{font-size:17px;text-align:center;letter-spacing:.12em;margin:0;font-weight:700}.struk .c{text-align:center}.struk hr{border:0;border-top:1px dashed #000;margin:8px 0}.struk .r{display:flex;justify-content:space-between;gap:8px}.struk .it{margin-bottom:6px}.struk .tt{font-size:14px;font-weight:700}.struk .stamp{margin:10px auto 6px;border:2px solid #000;text-align:center;font-weight:700;padding:4px 0;letter-spacing:.14em}.struk small{font-size:10.5px}.struk p{margin:0}';

// o: {code,date,name,phone,address,items:[{n|name,p|price,q,s,c}],total,status}
export function strukHtml(o,bank){
  const items=(o.items||[]).map(i=>({n:i.n||i.name,p:Number(i.p??i.price)||0,q:Number(i.q)||0,s:i.s,c:i.c}));
  const total=o.total??items.reduce((a,i)=>a+i.p*i.q,0);
  const paid=o.status=='Lunas'||o.status=='Dikirim',cancelled=o.status=='Dibatalkan';
  const stamp=paid?'LUNAS':cancelled?'DIBATALKAN':'MENUNGGU KONFIRMASI';
  const d=o.date?new Date(o.date):new Date();
  const tgl=d.toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  return `<style>${CSS}</style><div class="struk">
<h1>NADINE SIGNATURE</h1><p class="c"><small>Konfeksi Premium</small></p><hr>
<p class="c"><b>STRUK PEMBAYARAN</b></p>
<div class="r"><span>No. Pesanan</span><b>${esc(o.code)}</b></div>
<div class="r"><span>Tgl Pesan</span><span>${esc(tgl)}</span></div>
${paid&&o.paid_at?`<div class="r"><span>Tgl Bayar</span><span>${esc(new Date(o.paid_at).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}))}</span></div>`:''}
<hr>
<p>Pelanggan: ${esc(o.name)}</p><p>WhatsApp : ${esc(o.phone)}</p><p>Alamat   : ${esc(o.address)}</p>
<hr>
${items.map(i=>`<div class="it"><div>${esc(i.n)}</div><div class="r"><span>${esc([i.s,i.c].filter(Boolean).join(' / '))} ${i.q} x ${rp(i.p)}</span><span>${rp(i.p*i.q)}</span></div></div>`).join('')}
<hr>
<div class="r tt"><span>TOTAL</span><span>${rp(total)}</span></div>
<p><small>Belum termasuk ongkos kirim (dikonfirmasi penjual lewat WhatsApp).</small></p>
<div class="stamp">${stamp}</div>
${!paid&&!cancelled&&bank?`<hr><p>Transfer ke:</p><p><b>${esc(bank.bank)} ${esc(bank.no)}</b></p><p>a.n. ${esc(bank.an)}</p>`:''}
<hr><p class="c">Terima kasih telah berbelanja</p><p class="c"><small>Simpan struk ini sebagai bukti.</small></p>
</div>`;
}

export function printStruk(o,bank){
  const f=document.createElement('iframe');
  f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(f);
  const w=f.contentWindow,d=w.document;
  d.open();
  d.write('<!doctype html><html><head><meta charset="utf-8"><title>Struk '+esc(o.code)+'</title><style>@page{size:80mm auto;margin:3mm}html,body{margin:0;background:#fff}</style></head><body>'+strukHtml(o,bank)+'</body></html>');
  d.close();
  setTimeout(()=>{try{w.focus();w.print()}catch{alert('Cetak tidak didukung di perangkat ini.')}},300);
  setTimeout(()=>f.remove(),120000);
}

export function StrukCard({o,bank}){
  return(<div style={{margin:'18px 0'}}>
    <div style={{background:'#fff',borderRadius:12,border:'1px solid var(--line)',padding:8}} dangerouslySetInnerHTML={{__html:strukHtml(o,bank)}}/>
    <button className="b2" onClick={()=>printStruk(o,bank)}>Cetak Struk</button>
  </div>);
}
