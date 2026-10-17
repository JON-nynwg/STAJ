import { adminSession } from '@/lib/admin';
import { addMethod, confirmDeposit, listMethods, makePrimary, parsePayout, removeMethod } from '@/lib/payments';
import { clean, fail, json, one, run, safe } from '@/lib/server';

const refOk = (s: string) => /^[A-Za-z0-9 _.-]{0,40}$/.test(s);
export async function POST(req: Request) {
  return safe(async () => {
    if (!await adminSession()) return fail('Sign in as admin first.', 401);
    const b = await req.json() as Record<string, unknown>, action = clean(b.action, 30), id = clean(b.id, 80), ref = clean(b.ref, 40);
    if (!refOk(ref)) return fail('Reference can only use letters, numbers, spaces and - _ .');
    const now = new Date().toISOString();

    if (action === 'add-platform') {
      const p = parsePayout(b);
      if ('error' in p) return fail(p.error);
      const err = await addMethod('platform', '', p);
      return err ? fail(err) : json({ ok: true, methods: await listMethods('platform') });
    }
    if (action === 'remove-platform') { const err = await removeMethod('platform', '', id); return err ? fail(err) : json({ ok: true, methods: await listMethods('platform') }); }
    if (action === 'primary-platform') { await makePrimary('platform', '', id); return json({ ok: true, methods: await listMethods('platform') }); }
    if (action === 'save-note') {
      await run('INSERT INTO platform_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', 'pay_instructions', clean(b.instructions, 300));
      return json({ ok: true });
    }

    const bk = await one<{ id: string; payment_status: string; payout_status: string; refund_status: string; status: string }>('SELECT id,payment_status,payout_status,refund_status,status FROM bookings WHERE id=?', id);
    if (!bk) return fail('Booking not found.', 404);

    if (action === 'confirm-deposit') {
      if (!await confirmDeposit(bk.id, ref)) return fail('This deposit cannot be confirmed (already confirmed or not awaiting payment).');
      return json({ ok: true });
    }
    if (action === 'payout-paid') {
      if (bk.payout_status !== 'due') return fail('No payout is due on this booking.');
      await run("UPDATE bookings SET payout_status='paid',payout_ref=? WHERE id=?", ref || 'paid ' + now.slice(0, 10), bk.id);
      return json({ ok: true });
    }
    if (action === 'cancel-refund') {
      // Used once the founder has spoken to the salon and agreed the cancellation is approved: full refund of what the customer paid.
      if (!['pending', 'confirmed'].includes(bk.status)) return fail('Only pending or confirmed bookings can be cancelled.');
      await run("UPDATE bookings SET status='cancelled',refund_status=CASE WHEN payment_status='deposit_paid' AND refund_status='none' THEN 'due' ELSE refund_status END WHERE id=?", bk.id);
      return json({ ok: true });
    }
    if (action === 'refund-done') {
      if (bk.refund_status !== 'due') return fail('No refund is due on this booking.');
      await run("UPDATE bookings SET refund_status='refunded',refund_ref=? WHERE id=?", ref || 'refunded ' + now.slice(0, 10), bk.id);
      return json({ ok: true });
    }
    if (action === 'reject-deposit') {
      if (!['awaiting_deposit', 'deposit_submitted'].includes(bk.payment_status)) return fail('Not awaiting a deposit.');
      await run("UPDATE bookings SET status='expired',payment_status='expired' WHERE id=?", bk.id);
      return json({ ok: true });
    }
    return fail('Unknown action.');
  });
}
