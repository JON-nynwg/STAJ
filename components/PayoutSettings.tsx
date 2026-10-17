'use client';
import { useState } from 'react';
import PayoutFields, { PAYOUT_LABEL, type Payout } from './PayoutFields';

export default function PayoutSettings({ initial }: { initial: Payout }) {
  const [saved, setSaved] = useState<Payout>(initial), [editing, setEditing] = useState(!initial.type);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [msg, setMsg] = useState('');
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setMsg('');
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const r = await fetch('/api/payout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json() as { error?: string }; if (!r.ok) throw new Error(j.error);
      const g = await (await fetch('/api/payout')).json() as Payout;
      setSaved(g); setEditing(false); setMsg('Payment details saved. Clients can now book you.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
    setBusy(false);
  }
  return <section className="card settings-card" style={{ marginBottom: 20 }} id="payments">
    <h2>Get paid</h2>
    {!saved.type && <p className="error" role="status">Add your payment details to start taking bookings. Until then clients cannot book you.</p>}
    <p className="muted">Clients pay a 30% deposit on STAJ. STAJ keeps its commission from that deposit and sends you the rest right after the deposit is confirmed. Clients pay the remaining 70% directly to you.</p>
    {saved.type && !editing ? <>
      <p><strong>{PAYOUT_LABEL[saved.type]}</strong><br/>{saved.name} · {saved.number}{saved.account ? ' · ' + saved.account : ''}</p>
      <button className="button outline small" onClick={() => setEditing(true)}>Change payment details</button>
    </> : <form className="form" onSubmit={save}><PayoutFields initial={saved}/><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save payment details'}</button>{saved.type && <button type="button" className="text-button" onClick={() => setEditing(false)}>Cancel</button>}</form>}
    {msg && <p className="success" role="status">{msg}</p>}{error && <p className="error" role="alert">{error}</p>}
    <details style={{ marginTop: 14 }}><summary>How STAJ fees work</summary>
      <table className="adm-table" style={{ marginTop: 8 }}><thead><tr><th>Service price (KES)</th><th>STAJ commission</th><th>You keep</th></tr></thead><tbody><tr><td>1 – 12,999</td><td>10%</td><td>90%</td></tr><tr><td>13,000 – 25,000</td><td>8%</td><td>92%</td></tr><tr><td>25,001 and above</td><td>4%</td><td>96%</td></tr></tbody></table>
      <p className="muted">Commission is worked out on the full service price and taken from the deposit. Example: a KES 12,000 service has a KES 3,600 deposit; STAJ keeps KES 1,200, you receive KES 2,400 right away, and the client pays you KES 8,400 on the day. No extra commission on the balance.</p>
    </details>
  </section>;
}
