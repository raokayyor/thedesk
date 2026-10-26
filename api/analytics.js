import { timingSafeEqual } from 'node:crypto';
import { report } from '../lib/analytics.mjs';
import { apiFailure } from '../lib/report-store.mjs';

// GET ?days=7|30|90 with "Authorization: Bearer <ANALYTICS_KEY>". Falls back to PRACTITIONER_SUPPORT_KEY so no new secret is required.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  const expected = process.env.ANALYTICS_KEY || process.env.PRACTITIONER_SUPPORT_KEY;
  if (!expected) return res.status(503).json({ error: 'Analytics access is not configured.' });
  const provided = String(req.headers.authorization || '').replace(/^Bearer /, '');
  const a = Buffer.from(provided), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ error: 'Staff access required.' });
  const days = [1, 7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  try { return res.json(await report(days)); } catch (e) { return apiFailure(res, e); }
}
