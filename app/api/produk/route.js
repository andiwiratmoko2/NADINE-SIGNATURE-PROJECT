import {NextResponse} from 'next/server';
import {sql} from '@/lib/db';
export const dynamic='force-dynamic';
export const revalidate=0;
// Daftar produk publik (hanya data yang memang tampil di toko). Dipakai untuk memeriksa foto.
export async function GET(){
  try{
    const r=await sql`SELECT id,name,price,stock,images FROM products WHERE NOT hidden ORDER BY id`;
    return NextResponse.json(r,{headers:{'Cache-Control':'no-store'}});
  }catch(e){return NextResponse.json({error:String(e.message||e)},{status:500})}
}
