import { headers } from 'next/headers';
// Address customers and owners can use for privacy and account requests.
export const CONTACT_EMAIL='garvinstan6@gmail.com';
export const siteOrigin=async()=>{const h=await headers(),host=h.get('x-forwarded-host')||h.get('host')||'localhost';return (h.get('x-forwarded-proto')||(host.startsWith('localhost')||host.startsWith('127.')?'http':'https'))+'://'+host;};
