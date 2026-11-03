import {NextResponse} from 'next/server';

// Opsional: pisahkan link pembeli dan penjual.
// SITE_MODE=buyer  -> halaman /admin tidak bisa dibuka (kembali ke beranda)
// SITE_MODE=seller -> halaman awal langsung ke /admin
// Jika SITE_MODE tidak diisi, perilaku tidak berubah.
export function middleware(req){
  const mode=process.env.SITE_MODE,{pathname}=req.nextUrl;
  if(mode==='buyer'&&pathname.startsWith('/admin'))return NextResponse.redirect(new URL('/',req.url));
  if(mode==='seller'&&pathname==='/')return NextResponse.redirect(new URL('/admin',req.url));
  return NextResponse.next();
}
export const config={matcher:['/','/admin/:path*']};
