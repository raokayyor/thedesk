// The Desk · "How did it go?" after a real interview. One short form gives us three things:
// confirmed formats per firm (questions, thinking time, answer time, retakes), question themes for the knowledge base,
// and real testimonials (only with consent, only after staff approve them). Nothing is public until staff approve it.
import { sql } from './report-store.mjs';

export const STAGES = ['HireVue / video interview', 'Phone screen', 'First round', 'Assessment centre / superday', 'Final / partner'];
export const OUTCOMES = ['Still waiting', 'Moved to the next stage', 'Offer', 'Rejected', 'Prefer not to say'];
export const THINK = ['', 'No thinking time', '15 seconds', '30 seconds', '45 seconds', '1 minute', 'Varied by question'];
export const ANSWER = ['', '30 seconds', '1 minute', '90 seconds', '2 minutes', '3 minutes', 'Varied by question'];
export const RETAKES = ['', 'No retakes', 'One retake', 'Two or more', 'Varied by question'];
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const scrub = s => s.replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '').replace(/(?:\+?44\s?|0)(?:\d[\s-]?){9,10}\b/g, '');
const pick = (v, list) => list.includes(v) ? v : '';

export function validateOutcome(b) {
  b = b || {};
  const firm = clean(b.firm, 60); if (firm.length < 2) return { error: 'Which firm was it?' };
  const stage = pick(b.stage, STAGES); if (!stage) return { error: 'Which stage was it?' };
  const month = /^\d{4}-\d{2}$/.test(b.month || '') ? b.month : ''; if (!month) return { error: 'When was it?' };
  const nq = Math.round(Number(b.questions));
  const questionsAsked = (Array.isArray(b.asked) ? b.asked : String(b.asked || '').split('\n')).map(x => scrub(clean(x, 240))).filter(x => x.length >= 8).slice(0, 6);
  const quote = scrub(clean(b.quote, 400)), consent = b.consent === true;
  if (consent && quote.length < 15) return { error: 'Add a sentence or two for your quote, or untick sharing.' };
  return { outcome: {
    firm, programme: clean(b.programme, 60), stage, month, outcome: pick(b.outcome, OUTCOMES) || 'Prefer not to say',
    format: stage === STAGES[0] ? { questions: nq >= 1 && nq <= 15 ? nq : null, think: pick(b.think, THINK), answer: pick(b.answer, ANSWER), retakes: pick(b.retakes, RETAKES) } : null,
    asked: questionsAsked, usedDesk: b.usedDesk === true, quote, consent,
    firstName: consent ? clean(b.firstName, 30).replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '') : '', university: consent ? clean(b.university, 80) : ''
  } };
}
let ready;
export function initOutcomes() {
  return ready ??= sql().query(`CREATE TABLE IF NOT EXISTS desk_outcomes (id bigserial PRIMARY KEY, owner_hash text, firm text NOT NULL, programme text NOT NULL DEFAULT '', stage text NOT NULL,
    month text NOT NULL, outcome text NOT NULL, format jsonb, asked jsonb NOT NULL DEFAULT '[]', used_desk boolean NOT NULL DEFAULT false, quote text NOT NULL DEFAULT '', consent boolean NOT NULL DEFAULT false,
    first_name text NOT NULL DEFAULT '', university text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending', quote_approved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz)`).catch(e => { ready = null; throw e; });
}
export async function addOutcome(ownerHash, o) {
  await initOutcomes();
  const r = await sql().query(`INSERT INTO desk_outcomes(owner_hash, firm, programme, stage, month, outcome, format, asked, used_desk, quote, consent, first_name, university)
    VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13) RETURNING id`,
    [ownerHash || null, o.firm, o.programme, o.stage, o.month, o.outcome, o.format ? JSON.stringify(o.format) : null, JSON.stringify(o.asked), o.usedDesk, o.quote, o.consent, o.firstName, o.university]);
  return String(r[0].id);
}
export async function listOutcomes(status = 'pending') {
  await initOutcomes();
  return sql().query(`SELECT id::text, firm, programme, stage, month, outcome, format, asked, used_desk AS "usedDesk", quote, consent, first_name AS "firstName", university, status, quote_approved AS "quoteApproved", created_at AS "createdAt"
    FROM desk_outcomes WHERE status=$1 ORDER BY created_at ${status === 'pending' ? 'ASC' : 'DESC'} LIMIT 200`, [status]);
}
// Staff: approve the format and questions (status), and separately approve the quote (only possible with consent).
export async function reviewOutcome(id, b) {
  await initOutcomes();
  if (!/^\d{1,18}$/.test(String(id))) return { error: 'Not found.' };
  const status = ['approved', 'rejected'].includes(b.status) ? b.status : null; if (!status) return { error: 'Choose approve or reject.' };
  const rows = await sql().query(`UPDATE desk_outcomes SET status=$2, quote=CASE WHEN $3::text IS NULL THEN quote ELSE $3 END, quote_approved=(consent AND $4 AND $2='approved'), reviewed_at=now() WHERE id=$1 RETURNING id`,
    [String(id), status, typeof b.quote === 'string' ? clean(b.quote, 400) : null, b.quoteApproved === true]);
  return rows.length ? { success: true } : { error: 'Not found.' };
}
// Pure: the most common reported value for each format field, per firm.
export function summariseFormats(rows) {
  const by = {};
  for (const r of rows) { const f = r.format || {}; const b = by[r.firm] ||= { n: 0, latest: '', fields: { questions: {}, think: {}, answer: {}, retakes: {} } }; b.n++; if (r.month > b.latest) b.latest = r.month;
    for (const k of Object.keys(b.fields)) { const v = f[k]; if (v !== null && v !== undefined && v !== '') b.fields[k][v] = (b.fields[k][v] || 0) + 1; } }
  const top = m => { const e = Object.entries(m).sort((a, b) => b[1] - a[1])[0]; return e ? { value: e[0], n: e[1] } : null; };
  return Object.fromEntries(Object.entries(by).map(([firm, b]) => [firm, { reports: b.n, latest: b.latest, questions: top(b.fields.questions), think: top(b.fields.think), answer: top(b.fields.answer), retakes: top(b.fields.retakes) }]));
}
export async function formats() {
  await initOutcomes();
  return summariseFormats(await sql().query(`SELECT firm, month, format FROM desk_outcomes WHERE status='approved' AND stage=$1 AND format IS NOT NULL AND month >= to_char(now() - interval '13 months','YYYY-MM')`, [STAGES[0]]));
}
// Public proof: approved quotes and a few honest counts.
export async function proof() {
  await initOutcomes();
  const quotes = await sql().query(`SELECT quote, first_name AS "firstName", university, firm, stage, outcome, month FROM desk_outcomes WHERE quote_approved ORDER BY reviewed_at DESC LIMIT 12`);
  const c = (await sql().query(`SELECT (SELECT count(*)::int FROM desk_value_items WHERE kind='interview' AND created_at > now() - interval '30 days') AS answers30,
      (SELECT count(*)::int FROM desk_outcomes WHERE status='approved' AND outcome IN ('Moved to the next stage','Offer') AND used_desk) AS progressed`).catch(() => [{ answers30: 0, progressed: 0 }]))[0];
  return { quotes, stats: { practiceAnswers30d: c.answers30 >= 50 ? c.answers30 : null, progressed: c.progressed >= 5 ? c.progressed : null } };
}

