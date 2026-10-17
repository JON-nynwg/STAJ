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

export const MAX_METHODS = 5;
export type Method = { id: string; type: string; name: string; number: string; account: string };
export const methodText = (m: Method) => payoutText({ payout_type: m.type, payout_name: m.name, payout_number: m.number, payout_account: m.account });
/** What the browser may see of a method: a label to pick by and the instruction to follow. */
export const publicMethods = (ms: Method[]) => ms.map(m => ({ id: m.id, label: PAYOUT_LABEL[m.type] || m.type, text: methodText(m) }));

export const listMethods = (kind: 'platform' | 'business', businessId = '') =>
  query<Method>('SELECT id,type,name,number,account FROM payment_methods WHERE kind=? AND business_id=? ORDER BY position,created_at', kind, businessId);

/** Keeps the salon's first method mirrored on the business row; deposit payouts and the "can take bookings" check read it. */
export async function syncPrimary(businessId: string) {
  const m = (await listMethods('business', businessId))[0];
  await run('UPDATE businesses SET payout_type=?,payout_name=?,payout_number=?,payout_account=? WHERE id=?', m?.type || '', m?.name || '', m?.number || '', m?.account || '', businessId);
}

export async function addMethod(kind: 'platform' | 'business', businessId: string, p: { type: string; name: string; number: string; account: string }) {
  const have = await listMethods(kind, businessId);
  if (have.length >= MAX_METHODS) return 'You can add up to ' + MAX_METHODS + ' payment methods.';
  if (have.some(m => m.type === p.type && m.number === p.number && m.account === p.account)) return 'That payment method is already added.';
  const pos = (await db().prepare('SELECT COALESCE(MAX(position),-1)+1 AS n FROM payment_methods WHERE kind=? AND business_id=?').bind(kind, businessId).first<{ n: number }>())?.n ?? 0;
  await run('INSERT INTO payment_methods (id,kind,business_id,type,name,number,account,position,created_at) VALUES (?,?,?,?,?,?,?,?,?)', crypto.randomUUID(), kind, businessId, p.type, p.name, p.number, p.account, pos, new Date().toISOString());
  if (kind === 'business') await syncPrimary(businessId);
  return '';
}
export async function removeMethod(kind: 'platform' | 'business', businessId: string, id: string) {
  const have = await listMethods(kind, businessId);
  if (!have.some(m => m.id === id)) return 'Payment method not found.';
  if (kind === 'business' && have.length <= 1) return 'Keep at least one payment method, or clients cannot book you. Add another first, then remove this one.';
  await run('DELETE FROM payment_methods WHERE id=? AND kind=? AND business_id=?', id, kind, businessId);
  if (kind === 'business') await syncPrimary(businessId);
  return '';
}
export async function makePrimary(kind: 'platform' | 'business', businessId: string, id: string) {
  const min = (await db().prepare('SELECT COALESCE(MIN(position),0)-1 AS n FROM payment_methods WHERE kind=? AND business_id=?').bind(kind, businessId).first<{ n: number }>())?.n ?? 0;
  await run('UPDATE payment_methods SET position=? WHERE id=? AND kind=? AND business_id=?', min, id, kind, businessId);
  if (kind === 'business') await syncPrimary(businessId);
}
export const getPlatformNote = async () => (await query<{ value: string }>("SELECT value FROM platform_settings WHERE key='pay_instructions'"))[0]?.value || '';
