'use client';
import { useState } from 'react';
import PayoutFields, { PAYOUT_LABEL } from './PayoutFields';
export type Method = { id: string; type: string; name: string; number: string; account: string };
const MAX = 5;

/** Lists payment methods with add / make main / remove. Used for a salon's own methods and for the founder's collection methods. */
export default function MethodsEditor({ initial, endpoint, actions, note }: { initial: Method[]; endpoint: string; actions: { add: string; remove: string; primary: string }; note?: string }) {
  const [methods, setMethods] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState(''), [msg, setMsg] = useState(''), [n, setN] = useState(0);
  async function call(body: Record<string, unknown>, ok: string) {
    setBusy(true); setError(''); setMsg('');
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json() as { error?: string; methods?: Method[] }; if (!r.ok) throw new Error(j.error);
      if (j.methods) setMethods(j.methods); setMsg(ok); return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); return false; } finally { setBusy(false); }
  }
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (await call({ action: actions.add, ...data }, 'Payment method added.')) setN(n + 1);
  }
  return <div>
    {methods.length ? <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'grid', gap: 8 }}>{methods.map((m, i) => <li key={m.id} className="card" style={{ padding: 12, display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
      <div><strong>{PAYOUT_LABEL[m.type] || m.type}</strong>{i === 0 && <span className="pill" style={{ marginLeft: 8 }}>Main</span>}<br/><span className="muted">{m.name} · {m.number}{m.account ? ' · ' + m.account : ''}</span></div>
      <div style={{ display: 'flex', gap: 8 }}>{i > 0 && <button type="button" className="text-button" disabled={busy} onClick={() => call({ action: actions.primary, id: m.id }, 'Main method updated.')}>Make main</button>}<button type="button" className="text-button" disabled={busy} onClick={() => { if (window.confirm('Remove this payment method?')) call({ action: actions.remove, id: m.id }, 'Payment method removed.'); }}>Remove</button></div>
    </li>)}</ul> : <p className="muted">No payment methods yet.</p>}
    {methods.length < MAX ? <form className="form" onSubmit={add} key={n}><strong>Add a payment method</strong><PayoutFields initial={{}}/><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Add payment method'}</button></form> : <p className="muted">You have added the maximum of {MAX} methods.</p>}
    {note && <p className="muted" style={{ marginTop: 8 }}>{note}</p>}
    {msg && <p className="success" role="status">{msg}</p>}{error && <p className="error" role="alert">{error}</p>}
  </div>;
}
