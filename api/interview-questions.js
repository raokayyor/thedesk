import {signQuestion,interviewContextKey} from '../lib/interview-session.mjs';
import { sameOrigin, apiFailure } from '../lib/report-store.mjs';
import { loadContext, generateQuestions, reserve, LIMITS, interviewTeaser } from '../lib/interview-practice.mjs';
import { MODES } from '../interview-practice-core.mjs';

// POST { assessmentId | sample:'amelia', mode, firm?, division? }
// Paid assessments get questions personalised by the model (falls back to the framework set).
// The fictional sample always gets the framework set, at no model cost.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req, res)) return;
  try {
    const body = req.body || {};
    // { teaser: true, assessmentId } → three likely questions for the free result page (text only).
    if (body.teaser === true) { const out = await interviewTeaser(req, res, body.assessmentId); if (out.error) return res.status(404).json({ error: 'Not available.' }); return res.json({ success: true, ...out }); }
    const mode = MODES[body.mode] ? body.mode : 'video';
    const loaded = await loadContext(req, res, body);
    if (loaded.error === 404) return res.status(404).json({ error: 'Open interview practice from your own assessment in this browser.' });
    if (loaded.error === 402) return res.status(402).json({ error: 'Interview practice on your own CV is part of Full Cycle.' });
    let useModel = !loaded.sample;
    if (useModel && !await reserve(loaded.key, 'questions', LIMITS.questions)) useModel = false; // over the daily limit: framework set
    const out = await generateQuestions(loaded.ctx, mode, { useModel });
    out.questions=out.questions.map(q=>signQuestion(q,interviewContextKey(loaded.ctx,loaded.key)));
    return res.json({ success: true, mode, ...out, context: { firm: loaded.ctx.firm, division: loaded.ctx.division, programme: loaded.ctx.programme, name: loaded.ctx.name, firmValues: loaded.ctx.firmValues, firmValuesLabel: loaded.ctx.firmValuesLabel, peers: loaded.ctx.peers, firmGroup: loaded.ctx.firmGroup } });
  } catch (e) { return apiFailure(res, e); }
}
