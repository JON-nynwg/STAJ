import { adminSession } from '@/lib/admin';
import { PBKDF2_ITERATIONS, clean, db, fail, json, one, passwordHash, safe } from '@/lib/server';

const tempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, x => chars[x % chars.length]).join('');
};

export async function POST(req: Request) {
  return safe(async () => {
    if (!await adminSession()) return fail('Sign in as admin first.', 401);
    const b = await req.json() as Record<string, unknown>;
    const action = clean(b.action, 30), businessId = clean(b.businessId, 80);
    const biz = await one<{ id: string; owner_id: string }>('SELECT id,owner_id FROM businesses WHERE id=?', businessId);
    if (!biz) return fail('Business not found.', 404);
    const d = db();
    const killSessions = d.prepare('DELETE FROM sessions WHERE owner_id=?').bind(biz.owner_id);

    if (action === 'approve') {
      await d.prepare("UPDATE businesses SET status='approved' WHERE id=?").bind(biz.id).run();
      return json({ ok: true });
    }
    if (action === 'suspend') {
      await d.batch([
        d.prepare("UPDATE businesses SET status='suspended' WHERE id=?").bind(biz.id),
        d.prepare('UPDATE owners SET blocked=1 WHERE id=?').bind(biz.owner_id),
        killSessions,
      ]);
      return json({ ok: true });
    }
    if (action === 'reinstate') {
      await d.batch([
        d.prepare("UPDATE businesses SET status='approved' WHERE id=?").bind(biz.id),
        d.prepare('UPDATE owners SET blocked=0 WHERE id=?').bind(biz.owner_id),
      ]);
      return json({ ok: true });
    }
    if (action === 'delete') {
      await d.batch([
        d.prepare('DELETE FROM bookings WHERE business_id=?').bind(biz.id),
        d.prepare('DELETE FROM services WHERE business_id=?').bind(biz.id),
        d.prepare('DELETE FROM businesses WHERE id=?').bind(biz.id),
        killSessions,
        d.prepare('DELETE FROM owners WHERE id=?').bind(biz.owner_id),
      ]);
      return json({ ok: true });
    }
    if (action === 'reset-password') {
      const temp = tempPassword(), salt = crypto.randomUUID();
      await d.batch([
        d.prepare('UPDATE owners SET password_hash=?,salt=?,password_iterations=? WHERE id=?').bind(await passwordHash(temp, salt), salt, PBKDF2_ITERATIONS, biz.owner_id),
        killSessions,
      ]);
      return json({ ok: true, tempPassword: temp });
    }
    return fail('Unknown action.');
  });
}
