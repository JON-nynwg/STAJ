'use client';
import { useMemo, useState } from 'react';
import '../app/admin/admin.css';
import BizLogo from './BizLogo';
import PayoutFields, { PAYOUT_LABEL } from './PayoutFields';
import { BarList, ColumnChart, type Pt, type Row } from './AdminCharts';

type Stats = { pending: number; approved: number; suspended: number; owners: number; services: number; bookings: number; pendingBookings: number; week: number };
type Biz = { id: string; slug: string; name: string; category: string; location: string; status: string; created_at: string; owner_email: string; blocked: number; logo_v: string | null; services: number; bookings: number };
type Bk = { id: string; client_name: string; client_phone: string; appointment_at: string; status: string; created_at: string; service_name: string; price: number; business_name: string };

type Pay = { id: string; client_name: string; client_phone: string; appointment_at: string; status: string; created_at: string; service_name: string; business_name: string; total_price: number; deposit_amount: number; commission_rate: number; commission_amount: number; salon_deposit_share: number; balance_amount: number; payment_status: string; payment_ref: string; payout_status: string; payout_ref: string; refund_status: string; refund_ref: string; payout_type: string; payout_name: string; payout_number: string; payout_account: string };
type Plat = { type: string; name: string; number: string; account: string; instructions: string };
type Money = { commission: number; payoutsDue: number; refundsDue: number; toCheck: number };
const kes = (n: number) => 'KES ' + n.toLocaleString('en-KE');
const fmt = (iso: string) => new Date(iso).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium' });

export default function AdminDashboard({ stats, businesses, bookings, charts, money, pays, platform, noPayout }: { money: Money; pays: Pay[]; platform: Plat; noPayout: { id: string; name: string }[]; stats: Stats; businesses: Biz[]; bookings: Bk[]; charts: { signups: Pt[]; bookings: Pt[]; byStatus: Row[]; byPlace: Row[] } }) {
  const [tab, setTab] = useState<'businesses' | 'bookings' | 'payments'>(money.toCheck ? 'payments' : 'businesses');
  const [q, setQ] = useState(''), [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(''), [error, setError] = useState('');
  const [note, setNote] = useState<{ email: string; password: string } | null>(null);

  const shown = useMemo(() => businesses.filter(b =>
    (filter === 'all' || b.status === filter) &&
    (!q.trim() || [b.name, b.location, b.owner_email, b.category].some(v => v.toLowerCase().includes(q.trim().toLowerCase())))), [businesses, q, filter]);

  async function act(b: Biz, action: string) {
    const warn: Record<string, string> = {
      suspend: `Suspend ${b.name}? Its page is hidden and the owner is signed out and blocked.`,
      delete: `PERMANENTLY delete ${b.name}, its owner account, services and all bookings? This cannot be undone.`,
      'reset-password': `Create a new temporary password for ${b.owner_email}? They will be signed out everywhere.`,
    };
    if (warn[action] && !window.confirm(warn[action])) return;
    setBusy(b.id + action); setError(''); setNote(null);
    try {
      const r = await fetch('/api/admin/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, businessId: b.id }) });
      const j = await r.json() as { error?: string; tempPassword?: string };
      if (!r.ok) throw new Error(j.error);
      if (action === 'reset-password' && j.tempPassword) { setNote({ email: b.owner_email, password: j.tempPassword }); setBusy(''); return; }
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); setBusy(''); }
  }
  async function pay(action: string, id: string, ask?: string) {
    let ref = '';
    if (ask) { const v = window.prompt(ask); if (v === null) return; ref = v.trim(); }
    if (action === 'cancel-refund' && !window.confirm('Cancel this booking and refund the customer in full? Only do this after agreeing it with the salon.')) return;
    setBusy(id + action); setError('');
    try {
      const r = await fetch('/api/admin/payments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, id, ref }) });
      const j = await r.json() as { error?: string }; if (!r.ok) throw new Error(j.error);
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); setBusy(''); }
  }
  const [platMsg, setPlatMsg] = useState('');
  async function savePlatform(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPlatMsg(''); setError('');
    try {
      const r = await fetch('/api/admin/payments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'save-platform', ...Object.fromEntries(new FormData(e.currentTarget)) }) });
      const j = await r.json() as { error?: string }; if (!r.ok) throw new Error(j.error);
      setPlatMsg('Saved. Customers will now see these details when they pay a deposit.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  }
  const emails = useMemo(() => Array.from(new Set(shown.map(b => b.owner_email))), [shown]);
  const [copied, setCopied] = useState(false);
  const mailAll = () => { const bcc = emails.join(','); if (bcc.length < 1500) window.location.href = 'mailto:?bcc=' + encodeURIComponent(bcc); else copyAll(); };
  async function copyAll() { try { await navigator.clipboard.writeText(emails.join(', ')); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setError('Could not copy. Select the emails manually instead.'); } }
  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }

  const cards: [string, number][] = [['Awaiting approval', stats.pending], ['Live businesses', stats.approved], ['Suspended', stats.suspended], ['Owner accounts', stats.owners], ['Services listed', stats.services], ['Bookings total', stats.bookings], ['Bookings pending', stats.pendingBookings], ['Bookings, last 7 days', stats.week]];

  return <main className="wrap section">
    <div className="dashboard-head"><div><span className="eyebrow">Founder</span><h1 className="page-title">STAJ control room</h1><p className="muted">Everything on the platform, in one place.</p></div><button className="button outline" onClick={logout}>Sign out</button></div>
    <div className="adm-stats">{([['Commission earned', kes(money.commission)], ['Salon payouts to send', kes(money.payoutsDue)], ['Refunds to send', kes(money.refundsDue)], ['Deposits to check', String(money.toCheck)]] as [string, string][]).map(([l, v]) => <div className="card" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <div className="adm-stats">{cards.map(([l, v]) => <div className="card" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <div className="adm-charts">
      <ColumnChart title="New businesses per week" sub="Sign-ups over the last 12 weeks" data={charts.signups} unit="new businesses"/>
      <ColumnChart title="Bookings per week" sub="Booking requests over the last 12 weeks" data={charts.bookings} unit="bookings"/>
      <BarList title="Bookings by status" sub="All time" rows={charts.byStatus} empty="No bookings yet."/>
      <BarList title="Top places" sub="Live businesses by location" rows={charts.byPlace} empty="No live businesses yet."/>
    </div>
    {error && <p role="alert" className="error">{error}</p>}
    {note && <div className="adm-note" role="status">Temporary password for <strong>{note.email}</strong>: <code>{note.password}</code><span className="adm-sub">Shown once. Send it to the owner privately and ask them to change it from their dashboard after signing in.</span></div>}
    <div className="adm-tabs" role="tablist">
      <button className="adm-tab" role="tab" aria-selected={tab === 'businesses'} onClick={() => setTab('businesses')}>Businesses ({businesses.length})</button>
      <button className="adm-tab" role="tab" aria-selected={tab === 'payments'} onClick={() => setTab('payments')}>Payments ({pays.length})</button>
      <button className="adm-tab" role="tab" aria-selected={tab === 'bookings'} onClick={() => setTab('bookings')}>Recent bookings ({bookings.length})</button>
    </div>
    {tab === 'payments' ? <>
      <section className="card settings-card" style={{ marginBottom: 16 }}><h2>Where customers pay their deposit</h2>
        <p className="muted">Your STAJ collection account. Customers see this after they book. Replaced by automatic collection once a payment provider is connected.</p>
        <form className="form" onSubmit={savePlatform}><PayoutFields initial={platform} extra={<label>Extra note for customers (optional)<input name="instructions" maxLength={300} defaultValue={platform.instructions}/></label>}/><button className="button">Save</button></form>{platMsg && <p className="success" role="status">{platMsg}</p>}
      </section>
      {noPayout.length > 0 && <p className="adm-note">Live businesses with no payout details yet (they cannot take bookings): {noPayout.map(x => x.name).join(', ')}.</p>}
      <div className="adm-wrap card"><table className="adm-table"><thead><tr><th>Booking</th><th>Money</th><th>Deposit</th><th>Salon payout</th><th>Refund</th></tr></thead><tbody>
        {pays.length ? pays.map(k => <tr key={k.id}>
          <td><strong>{k.client_name}</strong><span className="adm-sub">{k.client_phone}</span><span className="adm-sub">{k.service_name} · {k.business_name}</span><span className="adm-sub">{fmt(k.appointment_at)} · {k.status}</span></td>
          <td>Total {kes(k.total_price)}<span className="adm-sub">Deposit {kes(k.deposit_amount)}</span><span className="adm-sub">Commission {k.commission_rate}% = {kes(k.commission_amount)}</span><span className="adm-sub">Salon share {kes(k.salon_deposit_share)} · Balance {kes(k.balance_amount)}</span></td>
          <td>{k.payment_status === 'deposit_paid' ? 'Paid' : k.payment_status === 'deposit_submitted' ? 'Customer says paid' : k.payment_status === 'expired' ? 'Expired' : 'Waiting'}{k.payment_ref && <span className="adm-sub">Code {k.payment_ref}</span>}
            {(k.payment_status === 'awaiting_deposit' || k.payment_status === 'deposit_submitted' || k.payment_status === 'expired') && <div className="adm-actions"><button className="adm-btn ok" disabled={!!busy} onClick={() => pay('confirm-deposit', k.id, 'M-Pesa code you received (optional):')}>Confirm deposit</button>{k.payment_status !== 'expired' && <button className="adm-btn danger" disabled={!!busy} onClick={() => pay('reject-deposit', k.id)}>Not received</button>}</div>}</td>
          <td>{k.payout_status === 'due' ? <><strong>Send {kes(k.salon_deposit_share)}</strong><span className="adm-sub">{PAYOUT_LABEL[k.payout_type]}: {k.payout_name} · {k.payout_number}{k.payout_account ? ' · ' + k.payout_account : ''}</span><div className="adm-actions"><button className="adm-btn ok" disabled={!!busy} onClick={() => pay('payout-paid', k.id, 'Your payment reference for this payout (optional):')}>Mark sent</button></div></> : k.payout_status === 'paid' ? <>Sent<span className="adm-sub">{k.payout_ref}</span></> : '—'}</td>
          <td>{k.refund_status === 'due' ? <><strong>Refund {kes(k.deposit_amount)}</strong><span className="adm-sub">to {k.client_phone}</span><div className="adm-actions"><button className="adm-btn ok" disabled={!!busy} onClick={() => pay('refund-done', k.id, 'Refund reference (optional):')}>Mark refunded</button></div></> : k.refund_status === 'refunded' ? <>Refunded<span className="adm-sub">{k.refund_ref}</span></> : (k.payment_status === 'deposit_paid' && ['pending', 'confirmed'].includes(k.status)) ? <button className="adm-btn danger" disabled={!!busy} onClick={() => pay('cancel-refund', k.id)}>Cancel &amp; refund</button> : '—'}</td></tr>) : <tr><td colSpan={5}>No paid bookings yet.</td></tr>}
      </tbody></table></div>
    </> : tab === 'businesses' ? <>
      <div className="adm-tools">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, place, owner email…" aria-label="Search businesses"/>
        <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="pending">Awaiting approval</option><option value="approved">Live</option><option value="suspended">Suspended</option></select>
      </div>
      <div className="adm-mail"><button className="adm-btn" disabled={!emails.length} onClick={mailAll}>Email {emails.length} shown {emails.length === 1 ? 'owner' : 'owners'}</button><button className="adm-btn" disabled={!emails.length} onClick={copyAll}>{copied ? 'Copied!' : 'Copy emails'}</button><span className="muted">Opens your own email app with owners hidden in BCC. Use the search and status filter to pick who gets it.</span></div>
      <div className="adm-wrap card"><table className="adm-table"><thead><tr><th>Business</th><th>Owner</th><th>Status</th><th>Services</th><th>Bookings</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
        {shown.length ? shown.map(b => <tr key={b.id}>
          <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><BizLogo id={b.id} v={b.logo_v} name={b.name} size={36}/><div><strong>{b.name}</strong><span className="adm-sub">{b.category} · {b.location}</span></div></div></td>
          <td><a href={'mailto:' + b.owner_email} style={{ textDecoration: 'underline' }}>{b.owner_email}</a>{b.blocked ? <span className="adm-sub">login blocked</span> : null}</td>
          <td><span className={'adm-st ' + b.status}>{b.status === 'pending' ? 'Awaiting approval' : b.status === 'approved' ? 'Live' : 'Suspended'}</span></td>
          <td>{b.services}</td><td>{b.bookings}</td><td>{day(b.created_at)}</td>
          <td><div className="adm-actions">
            {b.status === 'pending' && <button className="adm-btn ok" disabled={!!busy} onClick={() => act(b, 'approve')}>Approve</button>}
            {b.status === 'approved' && <a className="adm-btn" href={'/b/' + b.slug} target="_blank" rel="noreferrer">View</a>}
            {b.status === 'approved' && <button className="adm-btn danger" disabled={!!busy} onClick={() => act(b, 'suspend')}>Suspend</button>}
            {b.status === 'suspended' && <button className="adm-btn ok" disabled={!!busy} onClick={() => act(b, 'reinstate')}>Reinstate</button>}
            <button className="adm-btn" disabled={!!busy} onClick={() => act(b, 'reset-password')}>Reset password</button>
            <button className="adm-btn danger" disabled={!!busy} onClick={() => act(b, 'delete')}>{b.status === 'pending' ? 'Reject' : 'Delete'}</button>
          </div></td></tr>) : <tr><td colSpan={7}>No businesses match.</td></tr>}
      </tbody></table></div>
    </> : <div className="adm-wrap card"><table className="adm-table"><thead><tr><th>Client</th><th>Service</th><th>Business</th><th>Appointment</th><th>Status</th><th>Requested</th></tr></thead><tbody>
      {bookings.length ? bookings.map(k => <tr key={k.id}>
        <td><strong>{k.client_name}</strong><span className="adm-sub">{k.client_phone}</span></td>
        <td>{k.service_name}<span className="adm-sub">KES {k.price.toLocaleString('en-KE')}</span></td>
        <td>{k.business_name}</td><td>{fmt(k.appointment_at)}</td><td>{k.status}</td><td>{fmt(k.created_at)}</td></tr>) : <tr><td colSpan={6}>No bookings yet.</td></tr>}
    </tbody></table></div>}
  </main>;
}
