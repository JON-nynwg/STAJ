import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { db, hash, one, run } from '@/lib/server';

// The founder's login lives in two Cloudflare secrets (ADMIN_EMAIL and ADMIN_PASSWORD), never in the code or database.
const secrets = () => env as unknown as { ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string };
const COOKIE = 'staj_admin';
const HOURS = 12;

export const adminConfigured = () => { const s = secrets(); return !!(s.ADMIN_EMAIL && s.ADMIN_PASSWORD); };

export async function checkAdmin(email: string, password: string) {
  const s = secrets();
  if (!s.ADMIN_EMAIL || !s.ADMIN_PASSWORD) return false;
  const a = await hash('e:' + email.trim().toLowerCase() + '|p:' + password);
  const b = await hash('e:' + s.ADMIN_EMAIL.trim().toLowerCase() + '|p:' + s.ADMIN_PASSWORD);
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length && i < b.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminSession() {
  const now = new Date().toISOString();
  await db().prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(now).run();
  const token = crypto.randomUUID() + crypto.randomUUID();
  await run('INSERT INTO admin_sessions (token_hash,expires_at) VALUES (?,?)', await hash(token), new Date(Date.now() + HOURS * 3600000).toISOString());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: HOURS * 3600 });
}

export async function adminSession() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const row = await one<{ token_hash: string }>('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>?', await hash(token), new Date().toISOString());
  return !!row;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run('DELETE FROM admin_sessions WHERE token_hash=?', await hash(token));
  jar.set(COOKIE, '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
}
