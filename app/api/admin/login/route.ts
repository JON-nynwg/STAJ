import { adminConfigured, checkAdmin, createAdminSession } from '@/lib/admin';
import { clean, clientIp, fail, json, rateLimit, safe, tooMany } from '@/lib/server';
export async function POST(req: Request) {
  return safe(async () => {
    if (!await rateLimit('adminlogin:ip:' + clientIp(req), 8, 900) || !await rateLimit('adminlogin:all', 40, 3600)) return tooMany();
    if (!adminConfigured()) return fail('Admin login is not set up yet.', 503);
    const b = await req.json() as Record<string, unknown>;
    if (!await checkAdmin(clean(b.email, 180), String(b.password || ''))) return fail('Incorrect email or password.', 401);
    await createAdminSession();
    return json({ ok: true });
  });
}
