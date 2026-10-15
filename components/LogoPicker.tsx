'use client';
import { useRef, useState } from 'react';
import '../app/logo.css';

const MAX_SIDE = 512, MAX_B64 = 380_000;

// Resizes in the browser, which also strips camera/location metadata, and keeps transparency (WebP, falling back to PNG).
async function toDataUrl(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Choose a PNG, JPG or WebP image.');
  const bmp = await createImageBitmap(file);
  let side = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  for (let attempt = 0; attempt < 4; attempt++, side *= 0.75) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * side)); c.height = Math.max(1, Math.round(bmp.height * side));
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    for (const [type, q] of [['image/webp', 0.9], ['image/png', undefined]] as const) {
      const url = c.toDataURL(type, q);
      if (url.startsWith('data:' + type) && url.length - url.indexOf(',') - 1 <= MAX_B64) return url;
    }
  }
  throw new Error('That image is too large. Try a smaller one.');
}

export default function LogoPicker({ value, onChange, label = 'Choose logo' }: { value: string | null; onChange: (dataUrl: string | null) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setError('');
    try { onChange(await toDataUrl(f)); } catch (err) { setError(err instanceof Error ? err.message : 'Could not read that image.'); }
  }
  return <div className="logo-picker">
    <div className="lp-row">
      <div className="lp-box">{value ? <img src={value} alt="Logo preview"/> : 'No logo yet'}</div>
      <div className="lp-actions">
        <button type="button" className="lp-btn" onClick={() => input.current?.click()}>{value ? 'Change logo' : label}</button>
        {value && <button type="button" className="lp-btn" onClick={() => onChange(null)}>Remove</button>}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} aria-label="Business logo file"/>
    </div>
    <small className="muted">PNG, JPG or WebP. A square or wide logo on a plain background works best.</small>
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}
