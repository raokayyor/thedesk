import authHandler from './auth.js';
import { timingSafeEqual } from 'node:crypto';
import { owner, sameOrigin, apiFailure, hash } from '../lib/report-store.mjs';
import * as A from '../lib/value-accounts.mjs';
import * as O from '../lib/outcomes.mjs';

// One endpoint for sign-in, My Desk and the post-interview form.
// GET  ?verify=<token>            sign-in link from the email → signs this device in → redirect
// GET  ?view=me                   the student's assessments, saved practice, and (Full Cycle) the call link
// GET  ?view=formats | proof      public: confirmed HireVue formats per firm, approved quotes and counts
// GET  ?view=staff-outcomes&status=   staff (Authorization: Bearer PRACTITIONER_SUPPORT_KEY)
// POST { action: request | signout | delete-item | outcome }
// POST { action: staff-link | staff-outcome | staff-outcome-to-knowledge }  staff
const staffOk = req => { const e = process.env.PRACTITIONER_SUPPORT_KEY || ''; const a = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), b = Buffer.from(e); return !!e && a.length === b.length && timingSafeEqual(a, b); };
const originOf = req => new URL(process.env.APP_ORIGIN || `https://${req.headers.host}`).origin;

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    if (req.method === 'POST' && ['request','staff-link','signout'].includes(req.body?.action)) return authHandler(req,res);
    if (req.method === 'GET' && q.verify) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).json({ error: 'Use the sign-in link sent by The Desk.' });
    }
    if (req.method === 'GET' && (q.view === 'formats' || q.view === 'proof')) {
      res.setHeader('Cache-Control', 'public, max-age=120');
      return res.json(q.view === 'formats' ? { formats: await O.formats() } : await O.proof());
    }
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET' && q.view === 'staff-outcomes') {
      if (!staffOk(req)) return res.status(401).json({ error: 'Staff access required.' });
      return res.json({ items: await O.listOutcomes(['pending', 'approved', 'rejected'].includes(q.status) ? q.status : 'pending'), stages: O.STAGES });
    }
    if (req.method === 'GET') {
      const account = await A.currentAccount(req);
      const s = await A.ownerSummary(await A.principal(req, res));
      return res.json({ signedIn: !!account, email: account ? account.email : '', emailReady: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), ...s,
        call: s.paid && process.env.CALL_URL ? { url: process.env.CALL_URL, label: process.env.CALL_LABEL || 'Book your free 5-minute call with a practitioner' } : null,
        options: { stages: O.STAGES, outcomes: O.OUTCOMES, think: O.THINK, answer: O.ANSWER, retakes: O.RETAKES } });
    }
    if (req.method !== 'POST') return res.status(405).end();
    if (!sameOrigin(req, res)) return;
    const b = req.body || {};
    if (String(b.action || '').startsWith('staff-')) {
      if (!staffOk(req)) return res.status(401).json({ error: 'Staff access required.' });
      // Sign-in link without email, for testing before Resend is set up.
      if (b.action === 'staff-link') { const out = await A.requestLink(b.email, originOf(req), b.next || '/my.html'); return res.status(out.error ? 400 : 200).json(out.error ? out : { link: out.link || null, emailed: !!out.emailed }); }
      if (b.action === 'staff-outcome') return res.json(await O.reviewOutcome(b.id, b));
      if (b.action === 'staff-outcome-to-knowledge') {
        const { addDrafts, validateInsights } = await import('../lib/knowledge.mjs').catch(() => ({}));
        if (!addDrafts) return res.status(400).json({ error: 'The knowledge base isn’t installed.' });
        const list = (await O.listOutcomes('approved')).concat(await O.listOutcomes('pending')).find(x => x.id === String(b.id));
        if (!list) return res.status(404).json({ error: 'Not found.' });
        const items = validateInsights({ insights: list.asked.map(text => ({ kind: 'firm_question', statement: text, detail: '', firm: list.firm, division: '', stage: list.stage.startsWith('HireVue') ? 'Video interview' : list.stage.startsWith('First') ? 'First round' : list.stage.startsWith('Assessment') ? 'Assessment centre / superday' : '', needsCheck: false })) });
        const out = await addDrafts(items, { type: 'Student report', name: 'Student report', url: '' }, 'outcome-' + list.id);
        return res.json({ added: out.ids.length, merged: out.merged });
      }
      return res.status(400).json({ error: 'Unknown action.' });
    }
    if (b.action === 'request') {
      const out = await A.requestLink(b.email, originOf(req), b.next || '/my.html');
      if (out.error) return res.status(400).json(out);
      if (!out.emailed) return res.status(503).json({ error: 'Sign-in by email isn’t switched on yet. Your work is still saved in this browser.' });
      return res.json({ success: true });
    }
    if (b.action === 'signout') { await A.signOut(req, res); return res.json({ success: true }); }
    if (b.action === 'delete-item') return res.json({ success: await A.deleteItem(await A.principal(req, res), b.id) });
    if (b.action === 'outcome') {
      if (!await A.useQuota('outcome:' + hash(A.clientKey(req)), 10)) return res.status(429).json({ error: 'Thanks, that’s plenty for today.' });
      const v = O.validateOutcome(b);
      if (v.error) return res.status(400).json(v);
      return res.json({ success: true, id: await O.addOutcome(owner(req, res), v.outcome) });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}

