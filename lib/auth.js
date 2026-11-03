import crypto from 'crypto';
import {cookies} from 'next/headers';
const sign=v=>crypto.createHmac('sha256',process.env.AUTH_SECRET||'').update(v).digest('hex');
export const same=(a,b)=>crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(),crypto.createHash('sha256').update(String(b)).digest());
export const makeToken=()=>{const e=String(Date.now()+7*864e5);return e+'.'+sign(e)};
export function isAdmin(){
  if(!process.env.AUTH_SECRET)return false;
  const t=cookies().get('ns_admin')?.value;if(!t)return false;
  const [e,s]=t.split('.');if(!e||!s||Number(e)<Date.now())return false;
  const x=sign(e);return s.length===x.length&&same(s,x);
}
