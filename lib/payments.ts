import { clean, db, query, run } from '@/lib/server';

export const PAYOUT_TYPES = ['mpesa_phone', 'mpesa_till', 'mpesa_paybill', 'bank'] as const;
export type PayoutType = typeof PAYOUT_TYPES[number];
export const PAYOUT_LABEL: Record<string, string> = { mpesa_phone: 'M-Pesa (phone number)', mpesa_till: 'M-Pesa Till (Buy Goods)', mpesa_paybill: 'M-Pesa Paybill', bank: 'Bank account' };

/** Describes where to send money, in plain words, for the payer. */
export function payoutText(p: { payout_type: string; payout_name: string; payout_number: string; payout_account: string }) {
  switch (p.payout_type) {
    case 'mpesa_phone': return `Send to M-Pesa number ${p.payout_number} (${p.payout_name})`;
    case 'mpesa_till': return `Pay to Till number ${p.payout_number} (${p.payout_name})`;
    case 'mpesa_paybill': return `Pay to Paybill ${p.payout_number}, account ${p.payout_account} (${p.payout_name})`;
    case 'bank': return `Bank: ${p.payout_account}, account ${p.payout_number} (${p.payout_name})`;
    default: return '';
  }
}

/** Validates and cleans payout details typed by a salon or by the founder. Returns an error message or the cleaned values. */
export function parsePayout(b: Record<string, unknown>): { error: string } | { type: PayoutType; name: string; number: string; account: string } {
  const type = clean(b.type, 20) as PayoutType, name = clean(b.name, 80);
  let number = clean(b.number, 30).replace(/[\s-]/g, ''), account = clean(b.account, 60);
  if (!PAYOUT_TYPES.includes(type)) return { error: 'Choose how you want to be paid.' };
  if (name.length < 2) return { error: 'Enter the name the account is registered under.' };
  if (type === 'mpesa_phone') {
    const d = number.replace(/\D/g, '');
    const n = /^0[17]\d{8}$/.test(d) ? '+254' + d.slice(1) : /^254[17]\d{8}$/.test(d) ? '+' + d : /^[17]\d{8}$/.test(d) ? '+254' + d : '';
    if (!n) return { error: 'Enter a valid Kenyan M-Pesa number, like 0712 345 678.' };
    return { type, name, number: n, account: '' };
  }
  if (type === 'mpesa_till') { if (!/^\d{5,7}$/.test(number)) return { error: 'A Till number is 5 to 7 digits.' }; return { type, name, number, account: '' }; }
  if (type === 'mpesa_paybill') {
    if (!/^\d{5,7}$/.test(number)) return { error: 'A Paybill number is 5 to 7 digits.' };
    if (account.length < 1) return { error: 'Enter the account number or name customers should use with your Paybill.' };
    return { type, name, number, account };
  }
  if (!/^\d{6,20}$/.test(number)) return { error: 'Enter the bank account number (digits only).' };
  if (account.length < 2) return { error: 'Enter the bank name.' };
  return { type, name, number, account };
}

export const DEPOSIT_HOLD_HOURS = 2;
/** Frees time slots held by requests whose deposit never arrived. Safe to call often. */
export async function expireUnpaid() {
  const cutoff = new Date(Date.now() - DEPOSIT_HOLD_HOURS * 3600000).toISOString();
  // Only requests with no payment code yet expire; if the customer sent a code, the founder gets to check it first.
  await run("UPDATE bookings SET status='expired',payment_status='expired' WHERE payment_status='awaiting_deposit' AND status='pending' AND created_at<?", cutoff);
}

/**
 * The single place a deposit becomes "paid". The founder's Confirm button calls it today; a payment provider's
 * webhook will call it later. Marks the salon's share of the deposit as due for payout (right after confirmation).
 * An expired request is only revived when its time slot has not been taken by someone else in the meantime.
 */
export async function confirmDeposit(bookingId: string, ref: string) {
  const r = await db().prepare(`UPDATE bookings SET payment_status='deposit_paid',status='pending',payment_ref=CASE WHEN ?<>'' THEN ? ELSE payment_ref END,deposit_paid_at=?,payout_status='due'
    WHERE id=? AND (payment_status IN ('awaiting_deposit','deposit_submitted') OR (payment_status='expired' AND NOT EXISTS (
      SELECT 1 FROM bookings o JOIN services os ON os.id=o.service_id, services ms
      WHERE ms.id=bookings.service_id AND o.id<>bookings.id AND o.business_id=bookings.business_id AND o.status IN ('pending','confirmed')
      AND datetime(o.appointment_at)<datetime(bookings.appointment_at,'+'||ms.duration||' minutes')
      AND datetime(o.appointment_at,'+'||os.duration||' minutes')>datetime(bookings.appointment_at))))`).bind(ref, ref, new Date().toISOString(), bookingId).run();
  return r.meta.changes > 0;
}

export type PlatformPay = { type: string; name: string; number: string; account: string; instructions: string };
export async function getPlatformPay(): Promise<PlatformPay> {
  const rows = await query<{ key: string; value: string }>("SELECT key,value FROM platform_settings WHERE key LIKE 'pay_%'");
  const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return { type: m.pay_type || '', name: m.pay_name || '', number: m.pay_number || '', account: m.pay_account || '', instructions: m.pay_instructions || '' };
}
export const platformPayText = (p: PlatformPay) => p.type ? payoutText({ payout_type: p.type, payout_name: p.name, payout_number: p.number, payout_account: p.account }) : '';
