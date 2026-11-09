// My Desk: one endpoint behind the student's home page.
// GET                         -> everything the home page shows (membership, readiness, actions, tools, applications)
// GET  ?view=test             -> a fresh 10-question test (5 commercial/technical + 5 numerical), answers withheld
// POST {action:'test', attemptId, answers:{commercial:[5], numerical:[5]}}  -> graded test, updates readiness
// POST {action:'app-save', id?, firm, programme, stage, deadline, url, notes}
// POST {action:'app-delete', id}
// GET  ?view=shortlist / POST {action:'tracker-sync', list}  -> the tracker's shortlist ({"Firm|Programme": {stage}}), kept on the account
//
// Readiness only moves on evidence: a new assessment or recheck, or a new test result (which replaces the
// numerical and commercial/technical parts of the score with your best of the last 3 tests, same weights as the assessment).
// Interview practice is shown separately and never changes readiness.
import { createRequire } from 'node:module';
import { randomInt } from 'node:crypto';
import { sql, sameOrigin, apiFailure, initStore, hash, owner } from '../lib/report-store.mjs';
import * as A from '../lib/value-accounts.mjs';
import { select as selectKnowledge, initKnowledge, KINDS } from '../lib/knowledge.mjs';
import { initQuestions } from '../lib/practitioner-questions.mjs';
import { entitlement } from '../lib/accounts.mjs';
import { FREE_PER_DAY, PAID_PER_DAY } from '../lib/interview-feedback.mjs';
import { loadProgrammes } from '../lib/programmes.mjs';

const require = createRequire(import.meta.url);
let BANK;
const bank = () => BANK ??= { technical: require('../data/technical.json'), numerical: require('../data/numerical.json') };
const ROUTE_CODE = { 'General Finance': 'commercial_general', 'Investment Banking / IBD': 'investment_banking', 'Accounting / Audit': 'accounting_audit', 'Sales & Trading / Markets': 'markets', 'Asset Management / Investing': 'asset_management' };
// Same stages as the programme tracker (tracker.html), so the two lists are one list.
export const STAGES = ['Shortlisted', 'Preparing', 'Applied', 'Online tests', 'Interview', 'Offer', 'Unsuccessful'];
const OPEN_STAGES = ['Shortlisted', 'Preparing'];
const FIRM_NEWS = [[/deutsche/i, 'db'], [/bank of america|bofa/i, 'bofa'], [/goldman/i, 'gs'], [/j\.?\s?p\.?\s?morgan|jpm/i, 'jpm'], [/barclays/i, 'barclays'], [/\bubs\b/i, 'ubs'], [/\bey\b|ernst/i, 'ey'], [/pwc|pricewaterhouse/i, 'pwc']];
export const newsKeyFor = firm => (FIRM_NEWS.find(([re]) => re.test(String(firm || ''))) || [])[1] || null;
export const band = s => s >= 75 ? 'Competitive' : s >= 65 ? 'Borderline' : 'Weak';
const TEST_FREE_DAYS = 7, TEST_PAID_PER_DAY = 10;
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

// Readiness timeline from assessments and tests, oldest first.
export function readinessTimeline(assessments, tests) {
  const ev = [...assessments.map(a => ({ type: 'assessment', at: new Date(a.createdAt), a })), ...tests.map(t => ({ type: 'test', at: new Date(t.createdAt), t }))].sort((x, y) => x.at - y.at);
  const out = [], recent = []; let base = null;
  for (const e of ev) {
    if (e.type === 'assessment') {
      if (!Number.isFinite(+e.a.overall)) continue;
      base = e.a;
      // The assessment's own 10 questions count as its first test.
      recent.length = 0; if (e.a.breakdown) recent.push({ numericalCorrect: (+e.a.breakdown.numerical || 0) / 3, commercialCorrect: (+e.a.breakdown.technical || 0) / 4, fromAssessment: true });
      out.push({ at: e.at.toISOString(), kind: e.a.rootId ? 'Recheck' : 'Assessment', score: +e.a.overall, note: e.a.rootId ? 'Recheck of your updated CV' : 'Assessment' });
    } else if (base?.breakdown) {
      // Counts your best of the last 3 tests: rewards improvement, limits one lucky or unlucky test.
      recent.push(e.t.data); if (recent.length > 3) recent.shift();
      const best = recent.reduce((m, t) => (t.numericalCorrect * 3 + t.commercialCorrect * 4) > (m.numericalCorrect * 3 + m.commercialCorrect * 4) ? t : m);
      const b = base.breakdown, num = best.numericalCorrect * 3, tech = best.commercialCorrect * 4;
      const score = Object.values(b).reduce((s, x) => s + (+x || 0), 0) - (+b.numerical || 0) - (+b.technical || 0) + num + tech;
      out.push({ at: e.at.toISOString(), kind: 'Test', score, note: `Test: commercial ${e.t.data.commercialCorrect}/5, numerical ${e.t.data.numericalCorrect}/5${best !== e.t.data ? ' (best of last 3 counts)' : ''}` });
    }
  }
  return out;
}

function pickTest(route, seen) {
  const code = ROUTE_CODE[route] || 'commercial_general';
  const pool = (list, filter) => { const all = list.filter(filter); const fresh = all.filter(q => !seen.has(q.id)); return fresh.length >= 5 ? fresh : all; };
  const draw = (list, n) => { const a = [...list], out = []; while (out.length < n && a.length) out.push(a.splice(randomInt(a.length), 1)[0]); return out; };
  const t = pool(bank().technical, q => q.route === code || q.route === 'commercial_general');
  const n = pool(bank().numerical, () => true);
  // Mix of difficulties: mostly level 2, some 1 and 3.
  const mix = (list) => { const by = d => list.filter(q => q.difficulty === d); const picked = [...draw(by(1), 1), ...draw(by(2), 3), ...draw(by(3), 1)]; return picked.length === 5 ? picked : draw(list, 5); };
  return { commercial: mix(t), numerical: mix(n) };
}
const publicQ = q => ({ id: q.id, topic: q.topic, question: q.question, options: q.options, timeSec: q.timeSec });
const findQ = (group, id) => bank()[group === 'commercial' ? 'technical' : 'numerical'].find(q => q.id === id);

// The practitioner panel, as presented across the site (fullcycle.html).
export const PANEL = [
  { init: 'KR', name: 'Kayyor Rao', role: 'Banking · MD · 20 years', firms: 'UBS · Commerzbank · BGC · Knight · Stifel', routes: ['Investment Banking / IBD', 'Sales & Trading / Markets', 'General Finance'] },
  { init: 'PC', name: 'Peter Cheley', role: 'Banking & Asset Management · MD · 40 years', firms: 'SocGen · Commerzbank · JPM IM · BGC', routes: ['Asset Management / Investing'] },
  { init: 'NR', name: 'Neil Robertson', role: 'Banking · MD · 30 years', firms: 'UBS · Knight · Stifel · Aurel', routes: ['Sales & Trading / Markets'] },
  { init: 'JS', name: 'Jim Staples', role: 'Banking · MD · 30 years', firms: 'Barclays · BGC', routes: ['Investment Banking / IBD'] },
  { init: 'CS', name: 'Chris Sharkey', role: 'Audit, Accounting & Insurance · MD · 20+ years', firms: 'Lancashire Insurance · EY', routes: ['Accounting / Audit'] }
];
const panelMember = name => PANEL.find(m => m.name === name || m.name.split(' ').includes(name)) || null;
// Approved practitioner points for this student's firm and route, with who approved them.
async function practitionerLayer(req, res, profile, paid) {
  const out = { panel: PANEL.map(({ routes, ...m }) => m), lead: PANEL.find(m => m.routes.includes(profile.targetSector)) || PANEL[0], notes: {}, myth: null, approved: 0, question: null };
  try {
    await initKnowledge();
    const rows = await sql().query(`SELECT kind, statement, detail, firm, division, stage, stance, stance_note AS "stanceNote", practitioner FROM desk_knowledge WHERE status='approved' ORDER BY reviewed_at DESC LIMIT 1500`);
    out.approved = rows.length;
    const pick = (kinds) => {
      const chosen = selectKnowledge(rows, { firm: profile.targetFirm, division: profile.targetDivision || profile.targetSector, use: 'report', limit: 200 }).filter(i => i.stance !== 'disagree' && kinds.includes(i.kind));
      const i = chosen[0]; if (!i) return null;
      const m = panelMember(i.practitioner);
      return { kind: KINDS[i.kind], text: clean(i.statement + (i.stance === 'nuance' && i.stanceNote ? ' ' + i.stanceNote : ''), 260), firm: i.firm, by: m ? m.name : '', init: m ? m.init : '' };
    };
    out.notes = { interview: pick(['interviewer_looks_for', 'answer_technique', 'red_flag']), test: pick(['test_tip']), application: pick(['firm_insight', 'cv_tip', 'firm_question']), report: pick(['cv_tip', 'red_flag']) };
    const myth = selectKnowledge(rows, { firm: profile.targetFirm, division: profile.targetDivision || profile.targetSector, use: 'report', limit: 200 }).find(i => i.stance === 'disagree' && i.stanceNote);
    if (myth) { const m = panelMember(myth.practitioner); out.myth = { myth: clean(myth.statement, 220), view: clean(myth.stanceNote, 300), by: m ? m.name : '', init: m ? m.init : '' }; }
  } catch (e) { console.warn('practitioner layer: knowledge unavailable', e.message); }
  try {
    await initQuestions();
    const h = owner(req, res);
    const q = h ? (await sql().query(`SELECT id, practitioner, due_at AS "dueAt", answered_at AS "answeredAt" FROM desk_practitioner_questions WHERE owner_hash=$1 ORDER BY created_at DESC LIMIT 1`, [h]))[0] : null;
    out.question = q ? { id: q.id, answered: !!q.answeredAt, by: q.practitioner || '', dueAt: q.dueAt } : null;
  } catch (e) { console.warn('practitioner layer: questions unavailable', e.message); }
  out.canAsk = paid && !out.question;
  return out;
}
function cleanShortlist(list) {
  const out = {};
  if (!list || typeof list !== 'object' || Array.isArray(list)) return out;
  for (const [k, v] of Object.entries(list).slice(0, 200)) if (typeof k === 'string' && k.length <= 200 && k.includes('|')) out[k] = { stage: STAGES.includes(v?.stage) ? v.stage : 'Shortlisted' };
  return out;
}
async function getShortlist(p) {
  const r = (await sql().query(`SELECT id::text, data FROM desk_value_items WHERE principal=$1 AND kind='shortlist' ORDER BY created_at DESC LIMIT 1`, [p]))[0];
  return r ? { id: r.id, list: cleanShortlist(r.data.list) } : { id: null, list: {} };
}
async function items(p, kinds, limit = 200) {
  return sql().query(`SELECT id::text, kind, data, created_at AS "createdAt" FROM desk_value_items WHERE principal=$1 AND kind = ANY($2) ORDER BY created_at DESC LIMIT ${limit}`, [p, kinds]);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await initStore();
    const p = await A.principal(req, res);
    const paid = await A.isPaidOwner(p);
    await A.quotaLeft('desk-home-init', 1); // creates the saved-items tables on first use

    if (req.method === 'GET' && req.query?.view === 'shortlist') return res.json({ list: (await getShortlist(p)).list });

    if (req.method === 'GET' && req.query?.view === 'test') {
      const s = await A.ownerSummary(p);
      const route = s.assessments[0]?.route || 'General Finance';
      const recent = await items(p, ['test'], 20);
      if (!paid && recent[0] && Date.now() - new Date(recent[0].createdAt).getTime() < TEST_FREE_DAYS * 86400000)
        return res.status(429).json({ error: 'Free accounts get one fresh test a week.', nextAt: new Date(new Date(recent[0].createdAt).getTime() + TEST_FREE_DAYS * 86400000).toISOString(), member: false });
      if (paid && !await A.useQuota('test:' + p, TEST_PAID_PER_DAY)) return res.status(429).json({ error: 'That’s ten tests today. Come back tomorrow.' });
      const seen = new Set(recent.flatMap(r => [...(r.data.ids?.commercial || []), ...(r.data.ids?.numerical || [])]));
      const set = pickTest(route, seen);
      const ids = { commercial: set.commercial.map(q => q.id), numerical: set.numerical.map(q => q.id) };
      const attemptId = await A.saveItem(p, 'test-pending', { ids, route });
      return res.json({ attemptId, route, commercial: set.commercial.map(publicQ), numerical: set.numerical.map(publicQ) });
    }

    if (req.method === 'GET') {
      const s = await A.ownerSummary(p);
      const account = await A.currentAccount(req);
      const ids = s.assessments.map(a => a.id);
      const full = ids.length ? await sql().query(`SELECT id, result->'breakdown' AS breakdown, result->'priorities' AS priorities, result->>'band' AS band, input->'profile' AS profile FROM desk_assessments WHERE id = ANY($1)`, [ids]) : [];
      const byId = Object.fromEntries(full.map(r => [r.id, r]));
      const assessments = s.assessments.filter(a => !a.refundedAt).map(a => ({ ...a, breakdown: byId[a.id]?.breakdown, priorities: byId[a.id]?.priorities, profile: byId[a.id]?.profile }));
      const [tests, apps, practice] = await Promise.all([items(p, ['test'], 50), items(p, ['application'], 100), items(p, ['interview'], 30)]);
      const timeline = readinessTimeline(assessments, tests);
      const latest = assessments[0] || null;
      const paidRow = assessments.find(a => a.paidAt);
      let until = null;
      if (p.startsWith('account:')) { const e = await entitlement(p.slice(8)); until = e.active ? e.until : null; }
      else if (paidRow) until = new Date(new Date(paidRow.paidAt).getTime() + 365 * 86400000).toISOString();
      const now = timeline[timeline.length - 1] || null, first = timeline[0] || null;
      const scores = practice.map(x => x.data?.feedback?.overall).filter(Number.isFinite);
      const left = await A.quotaLeft(paid ? 'fb:' + p : 'fb:' + p + ':' + hash(A.clientKey(req)).slice(0, 16), paid ? PAID_PER_DAY : FREE_PER_DAY).catch(() => null);
      const short = await getShortlist(p);
      const progs = Object.keys(short.list).length ? (await loadProgrammes().catch(() => ({ programmes: [] }))).programmes : [];
      const byKey = Object.fromEntries(progs.map(x => [x.firm + '|' + x.name, x]));
      const fromTracker = Object.entries(short.list).map(([k, v]) => { const x = byKey[k]; const [firm, ...rest] = k.split('|'); return { id: 't:' + k, source: 'tracker', firm: x?.firm || firm, programme: x?.name || rest.join('|'), stage: v.stage, deadline: x?.closes || '', rolling: !!x?.rolling, url: x?.url || '' }; });
      const applications = [...fromTracker, ...apps.map(a => ({ id: a.id, source: 'manual', ...a.data, createdAt: a.createdAt }))].sort((x, y) => String(x.deadline || '9999').localeCompare(String(y.deadline || '9999')));
      const profile = latest?.profile || {};
      const firms = [...new Set([profile.targetFirm, ...applications.map(a => a.firm)].filter(Boolean))];
      const news = [...new Set(firms.map(newsKeyFor).filter(Boolean))].slice(0, 3).map(key => ({ key, firm: firms.find(f => newsKeyFor(f) === key) }));
      const reportUrl = paidRow ? '/fullcycle.html?id=' + paidRow.id : latest ? '/result-final-design.html?id=' + latest.id : null;

      // Next actions, most urgent first.
      const actions = [];
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      for (const a of applications) {
        if (!a.deadline || !OPEN_STAGES.includes(a.stage)) continue;
        const days = Math.round((new Date(a.deadline + 'T00:00:00Z') - today) / 86400000);
        if (days >= 0 && days <= 14) actions.push({ tag: 'Deadline · Applications', title: `Submit ${a.firm}${a.programme ? ' ' + a.programme : ''} by ${new Date(a.deadline + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}`, detail: days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `${days} days left`, href: '#applications', urgent: days <= 3 });
      }
      if (!latest) actions.push({ tag: 'Start here', title: 'Take the free assessment', detail: 'Upload your CV and answer 10 questions. About 10 minutes.', href: '/assessment.html' });
      else if (paidRow) actions.push({ tag: 'Report', title: 'Work through your plan', detail: 'CV rewrites, model answers and this week’s tasks', href: reportUrl + '#plan' });
      else if (latest.priorities?.[0]) actions.push({ tag: 'Your top priority', title: clean(latest.priorities[0].title, 90), detail: clean(latest.priorities[0].description, 160), href: reportUrl });
      const lastTest = tests[0];
      if (latest && (!lastTest || Date.now() - new Date(lastTest.createdAt).getTime() > 7 * 86400000)) actions.push({ tag: 'Test · moves readiness', title: 'Take a fresh 10-question test', detail: 'New questions for your route. About 8 minutes.', href: '/tests.html' });
      const lastPractice = practice[0];
      const target = profile.targetFirm || applications[0]?.firm;
      if (!lastPractice || Date.now() - new Date(lastPractice.createdAt).getTime() > 3 * 86400000) actions.push({ tag: 'Practise · Interview', title: target ? `Practise an interview question for ${target}` : 'Practise an interview question', detail: 'On camera, timed like the real thing', href: '/interview-start.html' });
      else { const weak = practice.filter(x => Number.isFinite(x.data?.feedback?.overall)).sort((a, b) => a.data.feedback.overall - b.data.feedback.overall)[0]; if (weak) actions.push({ tag: 'Practise · Interview', title: 'Retry your weakest answer', detail: `“${clean(weak.data.question, 90)}” scored ${weak.data.feedback.overall}`, href: '/interview-start.html' }); }
      if (!applications.length) actions.push({ tag: 'Applications', title: 'Pick the programmes you’re applying for', detail: 'Live deadlines from the tracker, in one list with your prep', href: '/tracker.html' });

      const practitioners = await practitionerLayer(req, res, profile, paid);
      for (const a of actions) {
        const key = /Interview/.test(a.tag) ? 'interview' : /Test/.test(a.tag) ? 'test' : /Deadline|Applications/.test(a.tag) ? 'application' : 'report';
        if (practitioners.notes[key]) a.note = practitioners.notes[key];
      }
      return res.json({
        signedIn: !!account, email: account?.email || '', emailReady: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
        member: paid, until, profile: { name: clean(profile.name, 80), firstName: clean(profile.name, 80).split(' ')[0], targetFirm: clean(profile.targetFirm, 80), targetSector: clean(profile.targetSector, 80), targetDivision: clean(profile.targetDivision, 80), programme: clean(profile.programme, 80) },
        readiness: now ? { score: now.score, band: band(now.score), change: first ? now.score - first.score : 0, timeline: timeline.slice(-6).reverse() } : null,
        report: latest ? { url: reportUrl, paid: !!paidRow, assessmentId: (paidRow || latest).id, breakdown: latest.breakdown || null, rechecks: s.assessments.filter(a => a.rootId).length } : null,
        tests: { last: lastTest ? { at: lastTest.createdAt, commercial: lastTest.data.commercialCorrect, numerical: lastTest.data.numericalCorrect } : null, count: tests.length, freeEveryDays: paid ? null : TEST_FREE_DAYS },
        interview: { recent: scores.slice(0, 6).reverse(), count: practice.length, leftToday: left, perDay: paid ? PAID_PER_DAY : FREE_PER_DAY },
        applications, stages: STAGES, news, actions: actions.slice(0, 3), practitioners,
        prices: { membership: '£89 a year' }
      });
    }

    if (req.method !== 'POST') return res.status(405).end();
    if (!sameOrigin(req, res)) return;
    const b = req.body || {};

    if (b.action === 'test') {
      if (!/^\d{1,18}$/.test(String(b.attemptId || ''))) return res.status(400).json({ error: 'Start a new test.' });
      const pend = (await sql().query(`SELECT id::text, data, created_at FROM desk_value_items WHERE id=$1 AND principal=$2 AND kind='test-pending'`, [String(b.attemptId), p]))[0];
      if (!pend || Date.now() - new Date(pend.created_at).getTime() > 3 * 3600000) return res.status(400).json({ error: 'This test has expired. Start a new one.' });
      const out = { commercialCorrect: 0, numericalCorrect: 0, ids: pend.data.ids, route: pend.data.route, review: [] };
      for (const g of ['commercial', 'numerical']) {
        const ans = b.answers?.[g];
        if (!Array.isArray(ans) || ans.length !== 5 || ans.some(x => !Number.isInteger(x) || x < 0 || x > 3)) return res.status(400).json({ error: 'Answer all ten questions.' });
        pend.data.ids[g].forEach((id, i) => {
          const q = findQ(g, id); if (!q) return;
          const right = ans[i] === q.answer; if (right) out[g + 'Correct']++;
          out.review.push({ section: g, topic: q.topic, question: q.question, options: q.options, chosen: ans[i], answer: q.answer, right, working: q.working?.length ? q.working : [], explanation: q.concept || q.explanation || '', trap: q.trap || '' });
        });
      }
      await sql().query(`UPDATE desk_value_items SET kind='test', data=$3::jsonb, created_at=now() WHERE id=$1 AND principal=$2`, [pend.id, p, JSON.stringify({ commercialCorrect: out.commercialCorrect, numericalCorrect: out.numericalCorrect, ids: out.ids, route: out.route })]);
      const s = await A.ownerSummary(p);
      const assessments = s.assessments.filter(a => !a.refundedAt);
      const bd = assessments.length ? (await sql().query(`SELECT id, result->'breakdown' AS breakdown FROM desk_assessments WHERE id = ANY($1)`, [assessments.map(a => a.id)])) : [];
      const map = Object.fromEntries(bd.map(r => [r.id, r.breakdown]));
      const timeline = readinessTimeline(assessments.map(a => ({ ...a, breakdown: map[a.id] })), await items(p, ['test'], 50));
      const now = timeline[timeline.length - 1], before = timeline[timeline.length - 2];
      return res.json({ success: true, commercialCorrect: out.commercialCorrect, numericalCorrect: out.numericalCorrect, review: out.review, readiness: now ? { score: now.score, band: band(now.score), previous: before?.score ?? null } : null });
    }

    if (b.action === 'tracker-sync') {
      const list = cleanShortlist(b.list), cur = await getShortlist(p);
      if (cur.id) await sql().query(`UPDATE desk_value_items SET data=$3::jsonb, created_at=now() WHERE id=$1 AND principal=$2`, [cur.id, p, JSON.stringify({ list })]);
      else await A.saveItem(p, 'shortlist', { list });
      return res.json({ success: true, count: Object.keys(list).length });
    }
    if (b.action === 'app-stage' && String(b.id || '').startsWith('t:')) {
      const cur = await getShortlist(p), k = String(b.id).slice(2);
      if (!cur.list[k] || !STAGES.includes(b.stage)) return res.status(400).json({ error: 'Unknown application.' });
      cur.list[k] = { stage: b.stage };
      await sql().query(`UPDATE desk_value_items SET data=$3::jsonb WHERE id=$1 AND principal=$2`, [cur.id, p, JSON.stringify({ list: cur.list })]);
      return res.json({ success: true });
    }
    if (b.action === 'app-save') {
      const firm = clean(b.firm, 80);
      if (!firm) return res.status(400).json({ error: 'Enter the firm.' });
      const data = { firm, programme: clean(b.programme, 80), stage: STAGES.includes(b.stage) ? b.stage : 'Shortlisted', deadline: /^\d{4}-\d{2}-\d{2}$/.test(b.deadline || '') ? b.deadline : '', url: /^https:\/\/[^\s]{3,300}$/.test(b.url || '') ? b.url : '', notes: clean(b.notes, 500) };
      if (b.id) {
        if (!/^\d{1,18}$/.test(String(b.id))) return res.status(400).json({ error: 'Unknown application.' });
        const r = await sql().query(`UPDATE desk_value_items SET data=$3::jsonb WHERE id=$1 AND principal=$2 AND kind='application' RETURNING id::text`, [String(b.id), p, JSON.stringify(data)]);
        if (!r.length) return res.status(404).json({ error: 'Unknown application.' });
        return res.json({ success: true, id: r[0].id });
      }
      const n = (await sql().query(`SELECT count(*)::int AS n FROM desk_value_items WHERE principal=$1 AND kind='application'`, [p]))[0].n;
      if (n >= 100) return res.status(400).json({ error: 'That’s 100 applications. Remove some old ones first.' });
      return res.json({ success: true, id: await A.saveItem(p, 'application', data) });
    }
    if (b.action === 'app-delete' && String(b.id || '').startsWith('t:')) {
      const cur = await getShortlist(p); delete cur.list[String(b.id).slice(2)];
      if (cur.id) await sql().query(`UPDATE desk_value_items SET data=$3::jsonb WHERE id=$1 AND principal=$2`, [cur.id, p, JSON.stringify({ list: cur.list })]);
      return res.json({ success: true });
    }
    if (b.action === 'app-delete') return res.json({ success: (await sql().query(`DELETE FROM desk_value_items WHERE id=$1 AND principal=$2 AND kind='application' RETURNING id`, [String(b.id || '').replace(/\D/g, '') || '0', p])).length > 0 });
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}
