import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
export const db = () => { if (!env.DB) throw new Error('Database unavailable'); return env.DB; };
export const query = <T>(sql: string, ...args: (string|number)[]) => db().prepare(sql).bind(...args).all<T>().then(r => r.results);
export const one = <T>(sql: string, ...args: (string|number)[]) => db().prepare(sql).bind(...args).first<T>();
export const run = (sql: string, ...args: (string|number)[]) => db().prepare(sql).bind(...args).run();
export const json = (body: unknown, status=200) => Response.json(body,{status});
export const fail = (message: string, status=400) => json({error:message},status);
export const hash = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
// Cloudflare Workers rejects PBKDF2 above 100,000 iterations in production. The count is stored per owner so older hashes
// still verify (where the runtime allows it) and are upgraded to this value on the next successful login.
export const PBKDF2_ITERATIONS=100000;
export async function passwordHash(password:string,salt:string,iterations=PBKDF2_ITERATIONS) { const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations},key,256); return Array.from(new Uint8Array(bits)).map(x=>x.toString(16).padStart(2,'0')).join(''); }
export async function sessionOwner() { const token=(await cookies()).get('staj_session')?.value; if (!token) return null; return one<{id:string,email:string}>(`SELECT o.id,o.email FROM sessions s JOIN owners o ON o.id=s.owner_id WHERE s.token_hash=? AND s.expires_at>?`,await hash(token),new Date().toISOString()); }
export async function createSession(ownerId:string) { const now=new Date().toISOString(); await db().batch([db().prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now),db().prepare('DELETE FROM rate_limits WHERE reset_at<=?').bind(now)]); const token=crypto.randomUUID()+crypto.randomUUID(); await run('INSERT INTO sessions (token_hash,owner_id,expires_at) VALUES (?,?,?)',await hash(token),ownerId,new Date(Date.now()+30*86400000).toISOString()); (await cookies()).set('staj_session',token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:30*86400}); }
export const slugify=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);
export const clean=(v:unknown,max=120)=>typeof v==='string'?v.trim().slice(0,max):'';
// Kenyan numbers become +2547XXXXXXXX / +2541XXXXXXXX so "0712 345 678", "712345678" and "+254 712-345-678" all match.
export const normalizePhone=(v:string)=>{const d=v.replace(/\D/g,'');if(/^0[17]\d{8}$/.test(d))return '+254'+d.slice(1);if(/^254[17]\d{8}$/.test(d))return '+'+d;if(/^[17]\d{8}$/.test(d))return '+254'+d;return (v.trim().startsWith('+')?'+':'')+d;};
export const clientIp=(req:Request)=>req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
// Fixed-window counter in D1. Returns false once `key` has been used more than `limit` times in `windowSeconds`.
export async function rateLimit(key:string,limit:number,windowSeconds:number){const now=new Date().toISOString(),reset=new Date(Date.now()+windowSeconds*1000).toISOString();const r=await one<{count:number}>(`INSERT INTO rate_limits (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<=? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END RETURNING count`,key,reset,now,now);return (r?.count??0)<=limit;}
export const tooMany=()=>fail('Too many attempts. Please wait a few minutes and try again.',429);
export const safe=async<T>(fn:()=>Promise<T>)=>{try{return await fn()}catch(e){console.error(e);return fail('Something went wrong. Please try again.',500)}};
