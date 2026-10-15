'use client';
import { useState } from 'react';
export default function AdminLogin() {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json() as { error?: string };
      if (!r.ok) throw new Error(j.error);
      window.location.href = '/admin';
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); setBusy(false); }
  }
  return <form className="form" onSubmit={submit}>
    <label>Email address<input type="email" name="email" required autoComplete="username"/></label>
    <label>Password<input type="password" name="password" required autoComplete="current-password"/></label>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="button" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}</button>
  </form>;
}
