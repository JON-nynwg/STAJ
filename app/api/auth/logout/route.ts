import { cookies } from 'next/headers';
import { hash, json, run, safe } from '@/lib/server';
export async function POST(){return safe(async()=>{const c=await cookies(),token=c.get('staj_session')?.value;if(token)await run('DELETE FROM sessions WHERE token_hash=?',await hash(token));c.delete('staj_session');return json({ok:true});});}
