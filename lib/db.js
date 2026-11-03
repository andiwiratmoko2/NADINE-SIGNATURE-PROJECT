import {neon} from '@neondatabase/serverless';
export const sql=neon(process.env.DATABASE_URL||'postgresql://x:x@localhost/x');
export async function getBank(){
  try{
    const r=await sql`SELECT key,value FROM settings WHERE key LIKE 'bank_%'`;
    const m=Object.fromEntries(r.map(x=>[x.key.slice(5),x.value]));
    return {bank:m.bank||'BCA',no:m.no||'0000 0000 00',an:m.an||'Nadine Signature'};
  }catch{return {bank:'BCA',no:'0000 0000 00',an:'Nadine Signature'}}
}
