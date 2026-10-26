import { sameOrigin, apiFailure, ownedRecord } from '../lib/report-store.mjs';
import { currentAccount, entitlement, latestAssessment, listItems, saveItem, deleteItem, ITEM_KINDS, claimResult, resultUnlocked } from '../lib/accounts.mjs';
import { practiceMeasures, QUESTION_TYPES, MODES } from '../interview-practice-core.mjs';

const str = (v, max) => typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null; };

// GET  ?kind=interview|answer|drill&limit=  → who is signed in, their access, current assessment and saved work
// POST { action: 'save', kind: 'interview', data }  → saves one practised answer (answers and drills are saved by their own endpoints)
// POST { action: 'delete', id }
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const account = await currentAccount(req);
    if (req.method === 'GET' && req.query.unlock) {
      if(process.env.RESULT_EMAIL_GATE_ENABLED!=='true')return res.json({unlocked:true,enabled:false});
      // Free result page: has an email been given for this result yet?
      const row = await ownedRecord(req, res, String(req.query.unlock));
      if (!row) return res.status(404).json({ error: 'Not found.' });
      return res.json({ unlocked: await resultUnlocked(row), signedIn: !!account });
    }
    if (req.method === 'GET') {
      if (!account) return res.json({ signedIn: false });
      const kind = ITEM_KINDS.includes(req.query.kind) ? req.query.kind : null;
      const [access, latest, items] = await Promise.all([entitlement(account.id), latestAssessment(account.id), req.query.kind ? listItems(account.id, kind, Number(req.query.limit) || 200) : Promise.resolve([])]);
      const profile = latest?.input?.profile || {};
      return res.json({
        signedIn: true, email: account.email, access,
        assessment: latest ? { id: latest.id, createdAt: latest.created_at, paid: !!latest.paid_at && !latest.refunded_at, firm: profile.targetFirm || latest.result?.targetFirm || '', division: String(profile.targetDivision || profile.targetSector || '').split(' / ')[0] } : null,
        items,
        features: { serverVoice: !!process.env.OPENAI_API_KEY, email: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) }
      });
    }
    if (req.method !== 'POST') return res.status(405).end();
    if (!sameOrigin(req, res)) return;
    const body = req.body || {};
    if (body.action === 'claim') { if(process.env.RESULT_EMAIL_GATE_ENABLED!=='true')return res.status(503).json({error:'Email saving is not switched on yet.'}); const out = await claimResult(req, res, body); return res.status(out.status || 200).json(out); }
    if (!account) return res.status(401).json({ error: 'Sign in to save your work.' });
    if (body.action === 'delete') return res.json({ success: await deleteItem(account.id, Number(body.id) || 0) });
    if (body.action === 'save' && body.kind === 'interview') {
      const access = await entitlement(account.id);
      if (!access.active) return res.status(402).json({ error: 'Saving practice is part of Full Cycle.' });
      const d = body.data || {};
      const transcript = str(d.transcript, 8000);
      if (!QUESTION_TYPES.includes(d.qtype) || !str(d.question, 400) || transcript.length < 5) return res.status(400).json({ error: 'Nothing to save.' });
      const fu = d.followUp && str(d.followUp.text, 300) ? { text: str(d.followUp.text, 300), transcript: str(d.followUp.transcript, 4000) } : null;
      const durationSec = num(d.durationSec, 0, 900) || 0, answerSec = num(d.answerSec, 30, 900) || 120;
      const saved = await saveItem(account.id, 'interview', {
        session: str(d.session, 40), mode: MODES[d.mode] ? d.mode : 'first', firm: str(d.firm, 60), division: str(d.division, 60),
        qtype: d.qtype, question: str(d.question, 400), transcript, followUp: fu, durationSec, answerSec,
        overall: num(d.overall, 0, 5), band: str(d.band, 30), feedbackKind: d.feedbackKind === 'full' ? 'full' : 'quick',
        fixes: Array.isArray(d.fixes) ? d.fixes.slice(0, 3).map(x => str(x, 300)).filter(Boolean) : [],
        measures: practiceMeasures(transcript, durationSec, answerSec, fu)
      });
      return res.json({ success: true, id: saved.id });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}
