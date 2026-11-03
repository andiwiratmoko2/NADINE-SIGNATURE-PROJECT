import {notFound} from 'next/navigation';
import {sql} from '@/lib/db';
import {ProductView} from '@/components/ui';
export const dynamic='force-dynamic';
export default async function Page({searchParams}){
  let p;
  try{[p]=await sql`SELECT * FROM products WHERE id=${+searchParams.id} AND NOT hidden`}catch{}
  if(!p)notFound();
  return <ProductView p={p}/>;
}
