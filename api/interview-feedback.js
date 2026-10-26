import {verifyQuestion,interviewContextKey} from '../lib/interview-session.mjs';
import { sameOrigin, apiFailure } from '../lib/report-store.mjs';
import { loadContext, generateFeedback, generateFollowUp, reserve, LIMITS } from '../lib/interview-practice.mjs';
import { deliveryMetrics, quickCheck, QUESTION_TYPES } from '../interview-practice-core.mjs';

// POST { assessmentId | sample:'amelia', firm?, division?, question:{type,text,lookFor,modelAnswer,answerSec}, transcript, durationSec, followUp?:{text,transcript} }
// With stage:'followup' it returns one push-back question instead of feedback.
// Only the transcript is sent here. Video and audio never leave the student's device.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req, res)) return;
  try {
    const body = req.body || {};
    let q = body.question || {};
    const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : '';
    const durationSec = Math.max(0, Math.min(600, Number(body.durationSec) || 0));
    if (!QUESTION_TYPES.includes(q.type) || typeof q.text !== 'string' || q.text.length > 400) return res.status(400).json({ error: 'Invalid question.' });
    if (body.stage === 'followup') {
      if (!QUESTION_TYPES.includes(q.type) || typeof q.text !== 'string' || q.text.length > 400 || transcript.length > 8000) return res.status(400).json({ error: 'Invalid request.' });
      const loadedF = await loadContext(req, res, body);
      if (loadedF.error) return res.status(loadedF.error).json({ error: 'Not available.' });
      try{q=verifyQuestion(q.token,interviewContextKey(loadedF.ctx,loadedF.key));}catch{return res.status(400).json({error:'Reopen practice to get a valid question.'});}
      // The sample uses rule-based follow-ups (no model cost); paid users get one written for their answer.
      const useModel = !loadedF.sample && await reserve(loadedF.key, 'feedback', LIMITS.feedback);
      return res.json({ success: true, followUp: await generateFollowUp(loadedF.ctx, { type: q.type, text: q.text }, transcript, { useModel }) });
    }
    if (transcript.length < 20 || transcript.length > 8000) return res.status(400).json({ error: 'Say a little more before asking for feedback.' });
    const f = body.followUp && typeof body.followUp === 'object' ? body.followUp : null;
    const fu = f && typeof f.text === 'string' && f.text.length <= 300 ? { text: f.text.trim(), transcript: typeof f.transcript === 'string' ? f.transcript.trim().slice(0, 4000) : '' } : null;
    let question = { type: q.type, text: q.text, lookFor: Array.isArray(q.lookFor) ? q.lookFor.slice(0, 4).map(String) : [], modelAnswer: typeof q.modelAnswer === 'string' ? q.modelAnswer.slice(0, 1000) : '', answerSec: Number(q.answerSec) || 90 };

    const loaded = await loadContext(req, res, body);
    if (loaded.error === 404) return res.status(404).json({ error: 'Open interview practice from your own assessment in this browser.' });
    if (loaded.error === 402) return res.status(402).json({ error: 'Interview feedback on your own CV is part of Full Cycle.' });

    try{question=verifyQuestion(q.token,interviewContextKey(loaded.ctx,loaded.key));}catch{return res.status(400).json({error:'Reopen practice to get a valid question.'});}
    // Pause stats measured on the device (numbers only; no audio is uploaded).
    const a = body.audio && typeof body.audio === 'object' ? body.audio : null;
    const num = (v, max) => Math.max(0, Math.min(max, Number(v) || 0));
    const audio = a ? { startDelaySec: num(a.startDelaySec, 600), longPauses: Math.round(num(a.longPauses, 200)), stalls: Math.round(num(a.stalls, 200)), longestPauseSec: num(a.longestPauseSec, 600), silencePct: num(a.silencePct, 100), quietPct: num(a.quietPct, 100), trailingOff: a.trailingOff === true } : null;
    const metrics = deliveryMetrics(transcript, durationSec, audio);
    const quick = quickCheck(question, transcript, metrics, loaded.ctx);
    const limit = loaded.sample ? LIMITS.sampleFeedbackPerHour : LIMITS.feedback;
    if (!await reserve(loaded.key, 'feedback', limit)) {
      return res.json({ success: true, metrics, quick, feedback: null, notice: loaded.sample ? 'Sample feedback limit reached for now. Here is the automatic quick check.' : 'Daily feedback limit reached. Here is the automatic quick check; full feedback resets tomorrow.' });
    }
    let feedback = null, notice = '';
    try { feedback = await generateFeedback(loaded.ctx, question, transcript, metrics, fu); }
    catch (e) { console.warn('interview feedback fell back to quick check', e.message); notice = 'Full feedback is unavailable right now. Here is the automatic quick check.'; }
    return res.json({ success: true, metrics, quick, feedback, notice });
  } catch (e) { return apiFailure(res, e); }
}
