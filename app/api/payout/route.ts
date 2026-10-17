import { parsePayout } from '@/lib/payments';
import { fail, json, one, run, safe, sessionOwner } from '@/lib/server';
export async function GET() {
  return safe(async () => {
    const o = await sessionOwner(); if (!o) return fail('Sign in first.', 401);
    return json(await one('SELECT payout_type AS type,payout_name AS name,payout_number AS number,payout_account AS account FROM businesses WHERE owner_id=?', o.id) ?? {});
  });
}
export async function POST(req: Request) {
  return safe(async () => {
    const o = await sessionOwner(); if (!o) return fail('Sign in first.', 401);
    const p = parsePayout(await req.json() as Record<string, unknown>);
    if ('error' in p) return fail(p.error);
    await run('UPDATE businesses SET payout_type=?,payout_name=?,payout_number=?,payout_account=? WHERE owner_id=?', p.type, p.name, p.number, p.account, o.id);
    return json({ ok: true });
  });
}
