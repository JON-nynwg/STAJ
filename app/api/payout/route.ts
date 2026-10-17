import { addMethod, listMethods, makePrimary, parsePayout, removeMethod } from '@/lib/payments';
import { clean, fail, json, one, safe, sessionOwner } from '@/lib/server';

async function myBusiness() {
  const o = await sessionOwner(); if (!o) return null;
  return one<{ id: string }>('SELECT id FROM businesses WHERE owner_id=?', o.id);
}
export async function GET() {
  return safe(async () => {
    const b = await myBusiness(); if (!b) return fail('Sign in first.', 401);
    return json({ methods: await listMethods('business', b.id) });
  });
}
// action: add (default) | remove | primary
export async function POST(req: Request) {
  return safe(async () => {
    const b = await myBusiness(); if (!b) return fail('Sign in first.', 401);
    const body = await req.json() as Record<string, unknown>, action = clean(body.action, 20) || 'add', id = clean(body.id, 80);
    let err = '';
    if (action === 'add') { const p = parsePayout(body); if ('error' in p) return fail(p.error); err = await addMethod('business', b.id, p); }
    else if (action === 'remove') err = await removeMethod('business', b.id, id);
    else if (action === 'primary') await makePrimary('business', b.id, id);
    else return fail('Unknown action.');
    if (err) return fail(err);
    return json({ ok: true, methods: await listMethods('business', b.id) });
  });
}
