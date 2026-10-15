import { one } from '@/lib/server';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await one<{ content_type: string; data: string }>('SELECT content_type,data FROM business_logos WHERE business_id=?', id).catch(() => null);
  if (!row) return new Response('Not found', { status: 404 });
  const bin = atob(row.data), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { 'content-type': row.content_type, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" } });
}
