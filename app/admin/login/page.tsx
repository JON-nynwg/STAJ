import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminLogin from '@/components/AdminLogin';
import { adminSession } from '@/lib/admin';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin | STAJ', robots: { index: false, follow: false } };
export default async function AdminLoginPage() {
  if (await adminSession()) redirect('/admin');
  return <main className="wrap"><div className="formbox"><h1>Founder login</h1><p className="muted">Restricted area for the STAJ team.</p><AdminLogin/></div></main>;
}
