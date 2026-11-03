import {getBank} from '@/lib/db';
import {PayView} from '@/components/ui';
export const dynamic='force-dynamic';
export const metadata={title:'Pembayaran — Nadine Signature'};
export default async function Page(){return <PayView bank={await getBank()}/>}
