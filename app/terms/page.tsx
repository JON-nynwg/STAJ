import type { Metadata } from 'next';import { CONTACT_EMAIL } from '@/lib/site';
export const metadata:Metadata={title:'Terms of use | STAJ'};
// Draft: have this reviewed by a lawyer before launch.
export default function Terms(){const contact=CONTACT_EMAIL?<a className="text-link" href={'mailto:'+CONTACT_EMAIL}>{CONTACT_EMAIL}</a>:'the STAJ team';return <main className="wrap section legal"><span className="eyebrow" style={{color:'#136b5b'}}>Last updated September 2026</span><h1 className="page-title">Terms of use</h1>
<h2>What STAJ does</h2><p>STAJ lets beauty and wellness businesses publish their services and receive appointment requests. STAJ is not a party to the appointment. The service, price, timing and any cancellation are between the customer and the business.</p>
<h2>Booking requests</h2><p>A request is not confirmed until the business confirms it. STAJ does not take payments. Please give accurate contact details and do not make requests you do not intend to keep.</p>
<h2>Business owners</h2><p>You are responsible for the accuracy of your listing, prices and opening hours, for keeping your password safe, and for handling customers’ personal data lawfully and only to provide the booked service.</p>
<h2>Acceptable use</h2><p>Do not submit fake bookings, attempt to access other accounts, or disrupt the service. We may remove listings or accounts that break these terms.</p>
<h2>Contact</h2><p>Questions about these terms can be sent to {contact}. See also our <a className="text-link" href="/privacy">privacy notice</a>.</p></main>}
