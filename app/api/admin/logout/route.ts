import { destroyAdminSession } from '@/lib/admin';
import { json, safe } from '@/lib/server';
export async function POST() { return safe(async () => { await destroyAdminSession(); return json({ ok: true }); }); }
