// Logos are stored as base64 in D1 (table business_logos) and served by /api/logo/[id].
// Only PNG, JPEG and WebP are accepted (never SVG, which can carry scripts). The browser already resizes and re-encodes
// the picture before upload; this re-checks the type, size and file signature on the server.
export const MAX_LOGO_BASE64 = 400_000; // about 300 KB of image
export function parseLogo(input: unknown): { type: string; data: string } | null {
  if (typeof input !== 'string') return null;
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(input);
  if (!m || m[2].length > MAX_LOGO_BASE64) return null;
  let head: string;
  try { head = atob(m[2].slice(0, 24)); } catch { return null; }
  const b = (i: number) => head.charCodeAt(i);
  const ok = m[1] === 'image/png' ? b(0) === 0x89 && head.slice(1, 4) === 'PNG'
    : m[1] === 'image/jpeg' ? b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff
    : head.slice(0, 4) === 'RIFF' && head.slice(8, 12) === 'WEBP';
  return ok ? { type: m[1], data: m[2] } : null;
}
