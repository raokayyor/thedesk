import { recordEvents } from '../lib/analytics.mjs';

// POST { session, page, aid?, touch?, events:[{e, p}] } from /desk-track.js. Always answers 204 so tracking never breaks a page.
export default async function handler(req, res) {
  if(process.env.ANALYTICS_ENABLED!=='true')return res.status(204).end();
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const expected = new URL(process.env.APP_ORIGIN || `https://${req.headers.host}`).origin;
  if (req.headers.origin !== expected) return res.status(204).end(); // other sites can't write events
  try { await recordEvents(req, req.body); } catch (e) { console.warn('track failed', e.message); }
  return res.status(204).end();
}
