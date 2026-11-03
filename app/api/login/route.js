import {h} from '@/lib/handler';
export const dynamic='force-dynamic';
const f=r=>h(r,['login']);
export const GET=f,POST=f,PATCH=f,PUT=f,DELETE=f;
