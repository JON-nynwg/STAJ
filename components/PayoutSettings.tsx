'use client';
import MethodsEditor, { type Method } from './MethodsEditor';

export default function PayoutSettings({ initial }: { initial: Method[] }) {
  return <section className="card settings-card" style={{ marginBottom: 20 }} id="payments">
    <h2>Get paid</h2>
    {!initial.length && <p className="error" role="status">Add your payment details to start taking bookings. Until then clients cannot book you.</p>}
    <p className="muted">Clients pay a 30% deposit on STAJ. STAJ keeps its commission from that deposit and sends you the rest, right after the deposit is confirmed, to your <strong>Main</strong> method. Clients pay the remaining 70% directly to you and can choose any method you list here.</p>
    <MethodsEditor initial={initial} endpoint="/api/payout" actions={{ add: 'add', remove: 'remove', primary: 'primary' }}/>
    <details style={{ marginTop: 14 }}><summary>How STAJ fees work</summary>
      <table className="adm-table" style={{ marginTop: 8 }}><thead><tr><th>Service price (KES)</th><th>STAJ commission</th><th>You keep</th></tr></thead><tbody><tr><td>1 – 12,999</td><td>10%</td><td>90%</td></tr><tr><td>13,000 – 25,000</td><td>8%</td><td>92%</td></tr><tr><td>25,001 and above</td><td>4%</td><td>96%</td></tr></tbody></table>
      <p className="muted">Commission is worked out on the full service price and taken from the deposit. Example: a KES 12,000 service has a KES 3,600 deposit; STAJ keeps KES 1,200, you receive KES 2,400 right away, and the client pays you KES 8,400 on the day. No extra commission on the balance.</p>
    </details>
  </section>;
}
