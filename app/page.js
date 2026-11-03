import {sql} from '@/lib/db';
import {Shop} from '@/components/ui';
export const dynamic='force-dynamic';
export const revalidate=0;
export const fetchCache='force-no-store';
export default async function Home({searchParams}){
  let ps=[],fail=false;
  try{ps=await sql`SELECT id,name,category,price,stock,bg,images FROM products WHERE NOT hidden ORDER BY id`}catch{fail=true}
  const q=(searchParams?.q||'').toLowerCase();
  if(q)ps=ps.filter(p=>p.name.toLowerCase().includes(q));
  return(<>
    <section className="hero"><small>KOLEKSI TERBARU</small><h1>Pilih Gaya<br/>Favoritmu</h1><p>Konfeksi pilihan dengan potongan rapi dan bahan terbaik, dari busana harian hingga perlengkapan perjalanan.</p></section>
    {fail&&<p className="empty">Database belum siap. Login di /admin, lalu buka /api/setup sekali.</p>}
    <Shop products={ps}/>
  </>);
}
