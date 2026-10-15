'use client';
import { useState } from 'react';
import LogoPicker from './LogoPicker';

export default function LogoSettings({ businessId, logoV }: { businessId: string; logoV?: string | null }) {
  const [value, setValue] = useState<string | null>(logoV ? '/api/logo/' + businessId + '?v=' + encodeURIComponent(logoV) : null);
  const [msg, setMsg] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function change(next: string | null) {
    setBusy(true); setError(''); setMsg('');
    try {
      const r = await fetch('/api/businesses/logo', next ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ logo: next }) } : { method: 'DELETE' });
      const j = await r.json() as { error?: string };
      if (!r.ok) throw new Error(j.error);
      setValue(next); setMsg(next ? 'Logo saved.' : 'Logo removed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    setBusy(false);
  }
  return <div className="card settings-card" style={{ marginBottom: 20 }}>
    <h2>Business logo</h2>
    <p className="muted">Shown on your business card and your booking page.</p>
    <LogoPicker value={value} onChange={change} label={busy ? 'Saving…' : 'Upload logo'}/>
    {msg && <p className="success" role="status">{msg}</p>}
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}
