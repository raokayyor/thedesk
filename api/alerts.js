import {runWeekly} from '../lib/alert-delivery.mjs';
import {validateAlertPrefs} from '../lib/alerts-core.mjs';
import { timingSafeEqual } from 'node:crypto';
import { sql, sameOrigin, apiFailure } from '../lib/report-store.mjs';
import { currentAccount, initAccounts, createLoginLink, sendLoginEmail,allow } from '../lib/accounts.mjs';
import { loadProgrammes, firmList, TYPES } from '../lib/programmes.mjs';
import { getPrefs, setPrefs, unsubscribe, buildDigest, digestEmail } from '../lib/alerts.mjs';
import { emailReady } from '../lib/email.mjs';

const keyOk = (req, expected) => { if (!expected) return false; const a = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b); };
const origin = req => new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN || `https://${req.headers.host}`).origin;

// GET                      → firms and programme types for the preferences form, plus the student's preferences
// POST {action:'prefs', enabled, firms[], types[]}   → save preferences (signed in)
// POST {action:'unsubscribe', token} or POST ?u=<token> (one-click from the email client) → stop alerts
// GET ?run=weekly  (Vercel cron, "Authorization: Bearer <CRON_SECRET>") → send this week's emails
// GET ?preview=<email> (staff key) → this week's email for that student, as HTML, without sending
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    // One-click unsubscribe (RFC 8058): the token is the authorisation, so no origin check.
    if (req.method === 'POST' && req.query && req.query.u) { await unsubscribe(String(req.query.u)); return res.status(200).json({ success: true }); }
    if (req.method === 'GET' && req.query.run === 'weekly') {
      if (!keyOk(req, process.env.CRON_SECRET) && !keyOk(req, process.env.ANALYTICS_KEY || process.env.PRACTITIONER_SUPPORT_KEY)) return res.status(401).end();
      return res.json(await runWeekly(origin(req)));
    }
    if (req.method === 'GET' && req.query.preview) {
      if (!keyOk(req, process.env.ANALYTICS_KEY || process.env.PRACTITIONER_SUPPORT_KEY)) return res.status(401).end();
      await initAccounts();
      const row = (await sql().query('SELECT p.*, a.email FROM desk_alert_prefs p JOIN desk_accounts a ON a.id=p.account_id WHERE a.email=$1', [String(req.query.preview).toLowerCase()]))[0];
      const data = await loadProgrammes();
      const prefs = row || { firms: [], types: [] };
      const d = buildDigest(prefs, data, { since: row && row.last_sent_at });
      const e = digestEmail(d, data, { origin: origin(req), unsubscribeUrl: origin(req) + '/unsubscribe.html?u=preview', firms: prefs.firms });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!-- subject: ${d.subject} -->` + e.html);
    }
    if (req.method === 'GET') {
      const data = await loadProgrammes();
      const account = await currentAccount(req);
      const prefs = account ? await getPrefs(account.id) : null;
      const verified = account ? !!(await sql().query('SELECT verified_at FROM desk_accounts WHERE id=$1', [account.id]))[0]?.verified_at : false;
      return res.json({ firms: firmList(data), types: TYPES, checked: data.checked, signedIn: !!account, verified, emailReady: emailReady(),
        prefs: prefs ? { enabled: prefs.enabled, firms: prefs.firms, types: prefs.types } : null });
    }
    if (req.method !== 'POST') return res.status(405).end();
    const body = req.body || {};
    if (body.action === 'unsubscribe') return res.json({ success: await unsubscribe(body.token) });
    if (!sameOrigin(req, res)) return;
    if (body.action === 'prefs') {
      const account = await currentAccount(req);
      if (!account) return res.status(401).json({ error: 'Sign in to set up alerts.' });
      const data = await loadProgrammes();
      const all = data.programmes.map(p => p.firm);
      try{validateAlertPrefs(body,[...new Set(all)],TYPES);}catch{return res.status(400).json({error:'Choose valid firms and programme types.'});}
      const saved = await setPrefs(account.id, body, [...new Set(all)]);
      const verified = !!(await sql().query('SELECT verified_at FROM desk_accounts WHERE id=$1', [account.id]))[0]?.verified_at;
      let confirmSent = false;
      if (saved.enabled && !verified && emailReady() && await allow('confirm:'+account.id,3)) { await sendLoginEmail(account.email, await createLoginLink(account.email, origin(req), { purpose: 'confirm' }), 'confirm'); confirmSent = true; }
      return res.json({ success: true, prefs: saved, verified, confirmSent });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}

