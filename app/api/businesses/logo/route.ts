import { parseLogo } from '@/lib/logo';
import { fail, json, one, rateLimit, run, safe, sessionOwner, tooMany } from '@/lib/server';
export async function POST(req: Request) {
  return safe(async () => {
    const owner = await sessionOwner();
    if (!owner) return fail('Sign in first.', 401);
    if (!await rateLimit('logo:' + owner.id, 20, 3600)) return tooMany();
    const b = await req.json() as Record<string, unknown>, logo = parseLogo(b.logo);
    if (!logo) return fail('Use a PNG, JPG or WebP image under 300 KB.');
    const biz = await one<{ id: string }>('SELECT id FROM businesses WHERE owner_id=?', owner.id);
    if (!biz) return fail('Business not found.', 404);
    await run('INSERT INTO business_logos (business_id,content_type,data,updated_at) VALUES (?,?,?,?) ON CONFLICT(business_id) DO UPDATE SET content_type=excluded.content_type,data=excluded.data,updated_at=excluded.updated_at', biz.id, logo.type, logo.data, new Date().toISOString());
    return json({ ok: true });
  });
}
export async function DELETE() {
  return safe(async () => {
    const owner = await sessionOwner();
    if (!owner) return fail('Sign in first.', 401);
    await run('DELETE FROM business_logos WHERE business_id=(SELECT id FROM businesses WHERE owner_id=?)', owner.id);
    return json({ ok: true });
  });
}
