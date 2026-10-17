import { clean, clientIp, fail, json, normalizePhone, one, rateLimit, run, safe, tooMany } from '@/lib/server';
// The customer tells us the M-Pesa confirmation code of the deposit they sent, so the founder can match and confirm it.
export async function POST(req: Request) {
  return safe(async () => {
    if (!await rateLimit('pay:ip:' + clientIp(req), 20, 900)) return tooMany();
    const b = await req.json() as Record<string, unknown>, id = clean(b.id, 80), phone = clean(b.phone, 30), ref = clean(b.ref, 30).toUpperCase().replace(/\s/g, '');
    if (!id || !phone) return fail('Enter your booking reference and phone number.');
    if (!/^[A-Z0-9]{6,20}$/.test(ref)) return fail('Enter the confirmation code from your payment message (letters and numbers, like SGH7XK2LM9).');
    const r = await one<{ client_phone: string; payment_status: string }>('SELECT client_phone,payment_status FROM bookings WHERE id=?', id);
    if (!r || normalizePhone(r.client_phone) !== normalizePhone(phone)) return fail('No booking found with those details.', 404);
    if (!['awaiting_deposit', 'deposit_submitted', 'expired'].includes(r.payment_status)) return fail('This deposit has already been confirmed.');
    await run("UPDATE bookings SET payment_ref=?,payment_status=CASE WHEN payment_status='awaiting_deposit' THEN 'deposit_submitted' ELSE payment_status END WHERE id=?", ref, id);
    return json({ ok: true });
  });
}
