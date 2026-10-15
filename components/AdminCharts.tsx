'use client';
import { useState } from 'react';

export type Pt = { label: string; full: string; value: number };
export type Row = { label: string; value: number };

const compact = (n: number) => n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0).replace(/\.0$/, '') + 'K' : String(n);
const niceMax = (m: number) => { if (m <= 4) return 4; const p = 10 ** Math.floor(Math.log10(m)); for (const s of [1, 2, 2.5, 5, 10]) if (m <= s * p) return s * p; return 10 * p; };

const W = 380, H = 210, L = 30, R = 6, T = 22, B = 28;

export function ColumnChart({ title, sub, data, unit }: { title: string; sub: string; data: Pt[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null), [table, setTable] = useState(false);
  const total = data.reduce((a, d) => a + d.value, 0);
  const max = niceMax(Math.max(0, ...data.map(d => d.value)));
  const n = data.length, slot = (W - L - R) / n, bw = Math.min(24, slot * 0.6), base = H - B, plot = base - T;
  const y = (v: number) => base - (v / max) * plot;
  const ticks = [0, max / 2, max];
  const hi = hover === null ? null : data[hover];
  return <figure className="card adm-chart">
    <figcaption><strong>{title}</strong>{hi ? <span className="adm-sub adm-read"><b>{hi.value}</b> {unit} · {hi.full}</span> : <span className="adm-sub">{sub}</span>}</figcaption>
    {table ? <div className="adm-wrap"><table className="adm-table"><thead><tr><th>Week</th><th>{unit}</th></tr></thead><tbody>{data.map(d => <tr key={d.full}><td>{d.full}</td><td>{d.value}</td></tr>)}</tbody></table></div> :
    <div className="adm-plot">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${total} in total over the last ${n} weeks`}>
        {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1"/><text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".65">{compact(t)}</text></g>)}
        {data.map((d, i) => {
          const cx = L + slot * i + slot / 2, x = cx - bw / 2, h = (d.value / max) * plot, r = Math.min(4, h / 2, bw / 2);
          return <g key={d.full} tabIndex={0} role="img" aria-label={`${d.full}: ${d.value} ${unit}`} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} style={{ outline: 'none', cursor: 'default' }}>
            <rect x={L + slot * i} y={T - 8} width={slot} height={plot + 8} fill="transparent"/>
            {h > 0 && <path d={`M${x},${base} V${base - h + r} a${r},${r} 0 0 1 ${r},${-r} H${x + bw - r} a${r},${r} 0 0 1 ${r},${r} V${base} Z`} fill="var(--lime)" fillOpacity={hover === null || hover === i ? 1 : 0.55}/>}
            {i === n - 1 && d.value > 0 && hover === null && <text x={cx} y={base - h - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">{d.value}</text>}
            {(i % 3 === (n - 1) % 3) && <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".65">{d.label}</text>}
          </g>;
        })}
        <line x1={L} x2={W - R} y1={base} y2={base} stroke="var(--line)" strokeWidth="1"/>
        {hover !== null && <line x1={L + slot * hover + slot / 2} x2={L + slot * hover + slot / 2} y1={T - 8} y2={base} stroke="currentColor" opacity=".25" strokeWidth="1"/>}
      </svg>

    </div>}
    <button className="adm-btn adm-toggle" onClick={() => setTable(t => !t)}>{table ? 'View chart' : 'View as table'}</button>
  </figure>;
}

export function BarList({ title, sub, rows, empty }: { title: string; sub: string; rows: Row[]; empty: string }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return <figure className="card adm-chart">
    <figcaption><strong>{title}</strong><span className="adm-sub">{sub}</span></figcaption>
    {rows.length ? <ul className="adm-bars">{rows.map(r => <li key={r.label}>
      <span className="adm-bar-label" title={r.label}>{r.label}</span>
      <span className="adm-bar-track"><span className="adm-bar" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}/></span>
      <b>{r.value}</b>
    </li>)}</ul> : <p className="muted">{empty}</p>}
  </figure>;
}
