import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { adminSession } from '@/lib/admin';
import { one, query } from '@/lib/server';
import { expireUnpaid, getPlatformNote, listMethods } from '@/lib/payments';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin | STAJ', robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!await adminSession()) redirect('/admin/login');
  await expireUnpaid();
  const n = async (sql: string) => (await one<{ n: number }>(sql))?.n ?? 0;
  const [businesses, owners, services, bookings, pendingBookings] = await Promise.all([
    query<{ status: string; n: number }>('SELECT status,COUNT(*) AS n FROM businesses GROUP BY status'),
    n('SELECT COUNT(*) AS n FROM owners'),
    n('SELECT COUNT(*) AS n FROM services'),
    n('SELECT COUNT(*) AS n FROM bookings'),
    n("SELECT COUNT(*) AS n FROM bookings WHERE status='pending'"),
  ]);
  const DAY = 86400000, WEEKS = 12, d0 = new Date(), mon = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate()) - ((d0.getUTCDay() + 6) % 7) * DAY;
  const starts = Array.from({ length: WEEKS }, (_, i) => mon - (WEEKS - 1 - i) * 7 * DAY), cutoff = new Date(starts[0]).toISOString();
  const bucket = (rows: { created_at: string }[]) => { const c = new Array(WEEKS).fill(0); for (const r of rows) { const i = Math.floor((Date.parse(r.created_at) - starts[0]) / (7 * DAY)); if (i >= 0 && i < WEEKS) c[i]++; } return starts.map((s, i) => ({ label: new Date(s).toLocaleDateString('en-KE', { timeZone: 'UTC', day: 'numeric', month: 'short' }), full: 'Week of ' + new Date(s).toLocaleDateString('en-KE', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }), value: c[i] })); };
  const [signupRows, bookingRows, byStatus, byPlace] = await Promise.all([
    query<{ created_at: string }>('SELECT created_at FROM businesses WHERE created_at>=?', cutoff),
    query<{ created_at: string }>('SELECT created_at FROM bookings WHERE created_at>=?', cutoff),
    query<{ label: string; value: number }>('SELECT status AS label,COUNT(*) AS value FROM bookings GROUP BY status ORDER BY value DESC'),
    query<{ label: string; value: number }>("SELECT TRIM(location) AS label,COUNT(*) AS value FROM businesses WHERE status='approved' GROUP BY LOWER(TRIM(location)) ORDER BY value DESC, label LIMIT 6"),
  ]);
  const charts = { signups: bucket(signupRows), bookings: bucket(bookingRows), byStatus, byPlace };
  const week = await n(`SELECT COUNT(*) AS n FROM bookings WHERE created_at>='${new Date(Date.now() - 7 * 86400000).toISOString()}'`);
  const count = (s: string) => businesses.find(b => b.status === s)?.n ?? 0;
  const list = await query<{ id: string; slug: string; name: string; category: string; location: string; status: string; created_at: string; owner_email: string; blocked: number; logo_v: string | null; services: number; bookings: number }>(
    `SELECT b.id,b.slug,b.name,b.category,b.location,b.status,b.created_at,o.email AS owner_email,o.blocked,(SELECT updated_at FROM business_logos l WHERE l.business_id=b.id) AS logo_v,
      (SELECT COUNT(*) FROM services s WHERE s.business_id=b.id) AS services,
      (SELECT COUNT(*) FROM bookings k WHERE k.business_id=b.id) AS bookings
     FROM businesses b JOIN owners o ON o.id=b.owner_id
     ORDER BY (b.status='pending') DESC, b.created_at DESC LIMIT 500`);
  const recent = await query<{ id: string; client_name: string; client_phone: string; appointment_at: string; status: string; created_at: string; service_name: string; price: number; business_name: string }>(
    `SELECT k.id,k.client_name,k.client_phone,k.appointment_at,k.status,k.created_at,s.name AS service_name,s.price,b.name AS business_name
     FROM bookings k JOIN services s ON s.id=k.service_id JOIN businesses b ON b.id=k.business_id
     ORDER BY k.created_at DESC LIMIT 150`);
  const pays = await query<{ id: string; client_name: string; client_phone: string; appointment_at: string; status: string; created_at: string; service_name: string; business_name: string; total_price: number; deposit_amount: number; commission_rate: number; commission_amount: number; salon_deposit_share: number; balance_amount: number; payment_status: string; payment_ref: string; payout_status: string; payout_ref: string; refund_status: string; refund_ref: string; payment_method: string; payout_type: string; payout_name: string; payout_number: string; payout_account: string }>(
    `SELECT k.id,k.client_name,k.client_phone,k.appointment_at,k.status,k.created_at,s.name AS service_name,b.name AS business_name,k.total_price,k.deposit_amount,k.commission_rate,k.commission_amount,k.salon_deposit_share,k.balance_amount,k.payment_status,k.payment_ref,k.payout_status,k.payout_ref,k.refund_status,k.refund_ref,k.payment_method,b.payout_type,b.payout_name,b.payout_number,b.payout_account
     FROM bookings k JOIN services s ON s.id=k.service_id JOIN businesses b ON b.id=k.business_id
     WHERE k.payment_status<>'none' AND NOT (k.payment_status='expired' AND k.payment_ref='')
     ORDER BY (k.payment_status='deposit_submitted') DESC,(k.payout_status='due') DESC,(k.refund_status='due') DESC,k.created_at DESC LIMIT 300`);
  const sum = async (sql: string) => (await one<{ n: number | null }>(sql))?.n ?? 0;
  const money = {
    commission: await sum("SELECT SUM(commission_amount) AS n FROM bookings WHERE payment_status='deposit_paid' AND refund_status<>'refunded'"),
    payoutsDue: await sum("SELECT SUM(salon_deposit_share) AS n FROM bookings WHERE payout_status='due'"),
    refundsDue: await sum("SELECT SUM(deposit_amount) AS n FROM bookings WHERE refund_status='due'"),
    toCheck: await n("SELECT COUNT(*) AS n FROM bookings WHERE payment_status='deposit_submitted'"),
  };
  const platform = { methods: await listMethods('platform'), note: await getPlatformNote() };
  const noPayout = await query<{ id: string; name: string }>("SELECT id,name FROM businesses WHERE status='approved' AND payout_type=''");
  return <AdminDashboard money={money} pays={pays} platform={platform} noPayout={noPayout}
    stats={{ pending: count('pending'), approved: count('approved'), suspended: count('suspended'), owners, services, bookings, pendingBookings, week }}
    businesses={list} bookings={recent} charts={charts}/>;
}
