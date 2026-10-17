'use client';
import { useState } from 'react';
export type Payout = { type?: string; name?: string; number?: string; account?: string };
export const PAYOUT_LABEL: Record<string, string> = { mpesa_phone: 'M-Pesa (phone number)', mpesa_till: 'M-Pesa Till (Buy Goods)', mpesa_paybill: 'M-Pesa Paybill', bank: 'Bank account' };

/** Form body shared by the salon's payout settings and the founder's own collection account. */
export default function PayoutFields({ initial, extra, prefix = '' }: { initial: Payout; extra?: React.ReactNode; prefix?: string }) {
  const [type, setType] = useState(initial.type || 'mpesa_phone');
  const L = type === 'mpesa_phone' ? ['Registered name on M-Pesa', 'M-Pesa phone number', '0712 345 678']
    : type === 'mpesa_till' ? ['Business name on the Till', 'Till number', '123456']
    : type === 'mpesa_paybill' ? ['Business name on the Paybill', 'Paybill number', '123456']
    : ['Account holder name', 'Account number', '0123456789'];
  return <>
    <label>How do you want to be paid?<select name={prefix+'type'} value={type} onChange={e => setType(e.target.value)}>{Object.entries(PAYOUT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
    <label>{L[0]}<input name={prefix+'name'} required defaultValue={initial.name || ''} key={'n' + type}/></label>
    <label>{L[1]}<input name={prefix+'number'} required defaultValue={type === initial.type ? initial.number || '' : ''} placeholder={L[2]} inputMode="numeric" key={'x' + type}/></label>
    {type === 'mpesa_paybill' && <label>Account number or name customers use<input name={prefix+'account'} required defaultValue={initial.type === type ? initial.account || '' : ''} key="pa"/></label>}
    {type === 'bank' && <label>Bank name<input name={prefix+'account'} required defaultValue={initial.type === type ? initial.account || '' : ''} placeholder="e.g. Equity Bank" key="ba"/></label>}
    {extra}
  </>;
}
