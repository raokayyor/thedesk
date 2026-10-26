import { timingSafeEqual } from 'node:crypto';
import { sameOrigin, apiFailure } from '../lib/report-store.mjs';
import { normEmail, validEmail, createLoginLink, redeemLoginToken, startSession, endSession, emailConfigured, sendLoginEmail, allow, upsertAccount } from '../lib/accounts.mjs';

// POST { action: 'request', email }   → emails a one-time sign-in link (same answer whether or not the email has an account)
// POST { action: 'verify', token }    → signs this device in
// POST { action: 'signout' }
// POST { action: 'staff-link', email } with "Authorization: Bearer <staff key>" → returns a sign-in link to send by hand
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req, res)) return;
  const body = req.body || {};
  const origin = new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN || `https://${req.headers.host}`).origin;
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  try {
    if (body.action === 'request') {
      const email = normEmail(body.email);
      if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (!emailConfigured()) return res.status(503).json({ error: 'Email sign-in isn’t switched on yet. Contact us and we’ll send you a sign-in link.' });
      if (!await allow('login-ip:' + ip, 10) || !await allow('login-email:' + email, 3)) return res.status(429).json({ error: 'Too many sign-in requests. Try again in an hour.' });
      await sendLoginEmail(email, await createLoginLink(email, origin));
      return res.json({ success: true, message: 'Check your inbox for a sign-in link. It works once and expires in 30 minutes.' });
    }
    if (body.action === 'verify') {
      if (!await allow('verify-ip:' + ip, 30)) return res.status(429).json({ error: 'Too many attempts. Try again in an hour.' });
      const account = await redeemLoginToken(body.token);
      if (!account) return res.status(400).json({ error: 'This sign-in link has expired or has already been used. Ask for a new one.' });
      await startSession(res, account.id);
      return res.json({ success: true });
    }
    if (body.action === 'signout') { await endSession(req, res); return res.json({ success: true }); }
    if (body.action === 'staff-link') {
      const expected = process.env.ANALYTICS_KEY || process.env.PRACTITIONER_SUPPORT_KEY || '';
      const a = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), b = Buffer.from(expected);
      if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ error: 'Staff access required.' });
      const email = normEmail(body.email);
      if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      await upsertAccount(email);
      return res.json({ success: true, link: await createLoginLink(email, origin), expiresMinutes: 30 });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}
