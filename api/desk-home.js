import {deepFor} from '../lib/deep-assessment.mjs';
import {sharedEvent} from '../lib/community-store.mjs';
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
import { FREE_PER_WEEK, PAID_PER_DAY } from '../lib/interview-feedback.mjs';
import { loadProgrammes, SECTOR_LABELS, TYPES } from '../lib/programmes.mjs';

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
const TEST_FREE_DAYS = 30, TEST_PAID_PER_DAY = 10;
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

// Readiness timeline from assessments and tests, oldest first.
// Section scores as rates (0-1). Older tests stored commercialCorrect/numericalCorrect out of 5.
export function testRates(d) {
  const r = {};
  if (d.numerical) r.numerical = d.numerical.correct / d.numerical.total; else if (Number.isFinite(d.numericalCorrect)) r.numerical = d.numericalCorrect / 5;
  if (d.commercial) r.commercial = d.commercial.correct / d.commercial.total; else if (Number.isFinite(d.commercialCorrect)) r.commercial = d.commercialCorrect / 5;
  return r;
}
const testNote = d => ['commercial', 'numerical'].map(g => { const x = d[g] || (Number.isFinite(d[g + 'Correct']) ? { correct: d[g + 'Correct'], total: 5 } : null); return x ? `${g === 'commercial' ? 'commercial' : 'numerical'} ${x.correct}/${x.total}` : ''; }).filter(Boolean).join(', ');
export function readinessTimeline(assessments, tests) {
  const ev = [...assessments.map(a => ({ type: 'assessment', at: new Date(a.createdAt), a })), ...tests.map(t => ({ type: 'test', at: new Date(t.createdAt), t }))].sort((x, y) => x.at - y.at);
  const out = []; let base = null, recent = { numerical: [], commercial: [] };
  for (const e of ev) {
    if (e.type === 'assessment') {
      if (!Number.isFinite(+e.a.overall)) continue;
      base = e.a;
      // The assessment's own questions count as its first test in each section.
      recent = { numerical: [], commercial: [] };
      if (e.a.breakdown) { recent.numerical.push((+e.a.breakdown.numerical || 0) / 15); recent.commercial.push((+e.a.breakdown.technical || 0) / 20); }
      out.push({ at: e.at.toISOString(), kind: e.a.rootId ? 'Recheck' : 'Assessment', score: +e.a.overall, note: e.a.rootId ? 'Recheck of your updated CV' : 'Assessment' });
    } else if (base?.breakdown) {
      // Each section counts your best of the last 3 results: rewards improvement, limits one lucky or unlucky test.
      const r = testRates(e.t.data);
      for (const g of ['numerical', 'commercial']) if (Number.isFinite(r[g])) { recent[g].push(r[g]); if (recent[g].length > 3) recent[g].shift(); }
      const best = g => Math.max(...recent[g]);
      const b = base.breakdown;
      const score = Object.values(b).reduce((s, x) => s + (+x || 0), 0) - (+b.numerical || 0) - (+b.technical || 0) + Math.round(best('numerical') * 15) + Math.round(best('commercial') * 20);
      out.push({ at: e.at.toISOString(), kind: 'Test', score, note: 'Test: ' + testNote(e.t.data) });
    }
  }
  return out;
}

// section: 'numerical' or 'commercial' (10 questions), or 'both' (5 + 5).
function pickTest(route, seen, section = 'both') {
  const code = ROUTE_CODE[route] || 'commercial_general';
  const draw = (list, n) => { const a = [...list], out = []; while (out.length < n && a.length) out.push(a.splice(randomInt(a.length), 1)[0]); return out; };
  const pool = (list, n) => { const fresh = list.filter(q => !seen.has(q.id)); return fresh.length >= n ? fresh : list; };
  // Mix of difficulties: mostly level 2, some 1 and 3.
  const mix = (list, n) => { const by = d => list.filter(q => q.difficulty === d); const k = Math.max(1, Math.round(n / 5)); const picked = [...draw(by(1), k), ...draw(by(2), n - 2 * k), ...draw(by(3), k)]; return picked.length === n ? picked : draw(list, n); };
  const n = section === 'both' ? 5 : 10;
  const t = pool(bank().technical.filter(q => q.route === code || q.route === 'commercial_general'), n);
  const u = pool(bank().numerical, n);
  return { commercial: section === 'numerical' ? [] : mix(t, n), numerical: section === 'commercial' ? [] : mix(u, n) };
}
const publicQ = q => ({ id: q.id, topic: q.topic, question: q.question, options: q.options, timeSec: q.timeSec });
const findQ = (group, id) => bank()[group === 'commercial' ? 'technical' : 'numerical'].find(q => q.id === id);

// The practitioner panel, as presented across the site (fullcycle.html).
export const PANEL = [
  { init: 'KR', name: 'Kayyor Rao', role: 'Banking · MD · 20 years', firms: 'UBS · Commerzbank · BGC · Knight · Stifel', routes: ['Investment Banking / IBD', 'Sales & Trading / Markets', 'General Finance'] },
  { init: 'PC', name: 'Peter Cheley', role: 'Banking & Asset Management · MD · 30 years', firms: 'SocGen · Commerzbank · JPM IM · BGC', routes: ['Asset Management / Investing'] },
  { init: 'NR', name: 'Neil Robertson', role: 'Banking · MD · 30 years', firms: 'UBS · Knight · Stifel · BGC', routes: ['Sales & Trading / Markets'] },
  { init: 'JS', name: 'Jim Staples', role: 'Banking · MD · 30 years', firms: 'Barclays · SocGen · BGC', routes: ['Investment Banking / IBD'] },
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

    // Programmes students can add from the tracker: everything not yet closed, grouped by sector.
    if (req.method === 'GET' && req.query?.view === 'programmes') {
      const today = new Date().toISOString().slice(0, 10);
      const list = (await loadProgrammes()).programmes.filter(x => x.status !== 'closed' && !(x.closes && x.closes < today))
        .map(x => ({ key: x.firm + '|' + x.name, firm: x.firm, name: x.name, sector: x.sector, type: x.type, closes: x.closes, status: x.status }));
      const sectors = Object.entries(SECTOR_LABELS).map(([key, label]) => ({ key, label, count: list.filter(x => x.sector === key).length })).filter(x => x.count);
      return res.json({ sectors, types: TYPES.filter(t => list.some(x => x.type === t)), programmes: list });
    }
    if (req.method === 'GET' && req.query?.view === 'shortlist') return res.json({ list: (await getShortlist(p)).list });

    if (req.method === 'GET' && req.query?.view === 'test') {
      const s = await A.ownerSummary(p);
      const route = s.assessments[0]?.route || 'General Finance';
      const recent = await items(p, ['test'], 20);
      if (!paid) return res.status(402).json({ error: 'Fresh tests are part of membership: unlimited 10-question tests from a bank of over 2,000, and your best of the last 3 counts towards your readiness.', member: false });
      if (false)
        return res.status(429).json({ error: 'Free accounts get one fresh test a month. Members get unlimited tests.', nextAt: new Date(new Date(recent[0].createdAt).getTime() + TEST_FREE_DAYS * 86400000).toISOString(), member: false });
      if (paid && !await A.useQuota('test:' + p, TEST_PAID_PER_DAY)) return res.status(429).json({ error: 'That’s ten tests today. Come back tomorrow.' });
      const section = ['numerical', 'commercial'].includes(req.query.section) ? req.query.section : 'both';
      const seen = new Set(recent.flatMap(r => [...(r.data.ids?.commercial || []), ...(r.data.ids?.numerical || [])]));
      const set = pickTest(route, seen, section);
      const ids = { commercial: set.commercial.map(q => q.id), numerical: set.numerical.map(q => q.id) };
      const attemptId = await A.saveItem(p, 'test-pending', { ids, route, section });
      return res.json({ attemptId, route, section, commercial: set.commercial.map(publicQ), numerical: set.numerical.map(publicQ) });
    }

    if (req.method === 'GET') {
      const s = await A.ownerSummary(p);
      const account = await A.currentAccount(req);
      const ids = s.assessments.map(a => a.id);
      const full = ids.length ? await sql().query(`SELECT id, result->'breakdown' AS breakdown, result->'priorities' AS priorities, result->>'band' AS band, input->'profile' AS profile, report->'plan' AS plan FROM desk_assessments WHERE id = ANY($1)`, [ids]) : [];
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
      if(now&&first&&now.score>first.score)await sharedEvent(p,'readiness',{from:first.score,to:now.score},'readiness:'+p+':'+now.score);
      const scores = practice.map(x => x.data?.feedback?.overall).filter(Number.isFinite);
      const left = paid ? await A.quotaLeft('fb:' + p, PAID_PER_DAY).catch(() => null) : Math.max(0, FREE_PER_WEEK - await A.countItems(p, 'interview', 7));
      const short = await getShortlist(p);
      const progs = (await loadProgrammes().catch(() => ({ programmes: [] }))).programmes;
      const byKey = Object.fromEntries(progs.map(x => [x.firm + '|' + x.name, x]));
      const fromTracker = Object.entries(short.list).map(([k, v]) => { const x = byKey[k]; const [firm, ...rest] = k.split('|'); return { id: 't:' + k, source: 'tracker', firm: x?.firm || firm, programme: x?.name || rest.join('|'), stage: v.stage, deadline: x?.closes || '', rolling: !!x?.rolling, url: x?.url || '' }; });
      const applications = [...fromTracker, ...apps.map(a => {const live=byKey[a.data.firm+'|'+a.data.programme];return {id:a.id,source:'manual',...a.data,...(live?{deadline:live.closes||'',rolling:!!live.rolling,url:live.url||a.data.url}:{}),createdAt:a.createdAt};})].sort((x, y) => String(x.deadline || '9999').localeCompare(String(y.deadline || '9999')));
      const signupSaved=account?(await sql().query('SELECT data FROM desk_account_profiles WHERE account_id=$1',[account.id]))[0]?.data:null;
      const profile = {...(signupSaved||{}),...(latest?.profile||{})};
      const firms = [...new Set([profile.targetFirm, ...applications.map(a => a.firm)].filter(Boolean))];
      const news = [...new Set(firms.map(newsKeyFor).filter(Boolean))].slice(0, 3).map(key => ({ key, firm: firms.find(f => newsKeyFor(f) === key) }));
      const deepRow=paid&&latest?(await sql().query('SELECT id,input,result FROM desk_assessments WHERE id=$1',[(paidRow||latest).id]))[0]:null;
      const deep=deepRow?await deepFor(deepRow):null;
      const deepReady=deep?.status==='complete';
      const reportUrl = paid && latest ? (deepReady?'/fullcycle.html?id=':'/deep-assessment.html?id=') + (paidRow||latest).id : latest ? '/result-final-design.html?id=' + latest.id : null;
      // The interview coach loads the student's CV and target from their (paid, else latest) assessment.
      const interviewUrl = latest ? '/interview-start.html?id=' + (paidRow || latest).id : '/interview-start.html';

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
      if (!lastPractice || Date.now() - new Date(lastPractice.createdAt).getTime() > 3 * 86400000) actions.push({ tag: 'Practise · Interview', title: target ? `Practise an interview question for ${target}` : 'Practise an interview question', detail: 'On camera, timed like the real thing', href: interviewUrl });
      else { const weak = practice.filter(x => Number.isFinite(x.data?.feedback?.overall)).sort((a, b) => a.data.feedback.overall - b.data.feedback.overall)[0]; if (weak) actions.push({ tag: 'Practise · Interview', title: 'Retry your weakest answer', detail: `“${clean(weak.data.question, 90)}” scored ${weak.data.feedback.overall}`, href: interviewUrl }); }
      if (!applications.length) actions.push({ tag: 'Applications', title: 'Pick the programmes you’re applying for', detail: 'Live deadlines from the tracker, in one list with your prep', href: '/tracker.html' });

      const practitioners = await practitionerLayer(req, res, profile, paid);
      let challenge = null;
      try {
        const c = (await sql().query(`SELECT id, title, closes_at FROM desk_challenges WHERE opens_at <= now() AND scored_at IS NULL ORDER BY opens_at DESC LIMIT 1`))[0];
        const last = (await sql().query(`SELECT e.return_pct, (SELECT count(*) FROM desk_challenge_entries x WHERE x.challenge_id=e.challenge_id AND x.return_pct > e.return_pct)::int + 1 AS rank, (SELECT count(*)::int FROM desk_challenge_entries x WHERE x.challenge_id=e.challenge_id) AS n FROM desk_challenge_entries e JOIN desk_challenges c ON c.id=e.challenge_id WHERE e.principal=$1 AND c.scored_at IS NOT NULL ORDER BY c.closes_at DESC LIMIT 1`, [p]))[0];
        const entered = c ? !!(await sql().query('SELECT 1 FROM desk_challenge_entries WHERE challenge_id=$1 AND principal=$2', [c.id, p]))[0] : false;
        challenge = { current: c ? { title: c.title, closesAt: c.closes_at, open: new Date(c.closes_at) > new Date(), entered } : null, last: last ? { rank: last.rank, of: last.n, returnPct: +last.return_pct } : null };
      } catch (e) { challenge = null; }   // tables appear once the first challenge is posted
      let game = null;
      try {
        if (paid) {
        const g = (await sql().query(`SELECT id, name, day FROM desk_game WHERE status='live' ORDER BY created_at DESC LIMIT 1`))[0];
        if (g) {
          const px = Object.fromEntries((await sql().query('SELECT ticker, price FROM desk_game_prices WHERE game_id=$1', [g.id])).map(r => [r.ticker, +r.price]));
          const accts = await sql().query('SELECT principal, cash, positions FROM desk_game_accounts WHERE game_id=$1', [g.id]);
          const val = a => +a.cash + Object.entries(a.positions || {}).reduce((s, [t, q]) => s + q * (px[t] || 0), 0);
          const ranked = accts.map(a => ({ p: a.principal, v: val(a) })).sort((x, y) => y.v - x.v), i = ranked.findIndex(r => r.p === p);
          const head = (await sql().query('SELECT headline FROM desk_game_events WHERE game_id=$1 AND day=$2 ORDER BY id LIMIT 1', [g.id, g.day]))[0];
          game = { name: g.name, day: g.day, headline: head?.headline || '', me: i >= 0 ? { value: Math.round(ranked[i].v), rank: i + 1, players: ranked.length } : null };
        }
      } } catch (e) { game = null; }   // tables appear once the first game starts
      if (!paid && practitioners.myth) practitioners.myth = { locked: true, by: practitioners.myth.by, init: practitioners.myth.init };
      if (!paid) {
        // Free accounts: the assessment, a look at what members get, and the 30-second interview check.
        actions.length = 0;
        if (!latest) actions.push({ tag: 'Start here', title: 'Take the free assessment', detail: 'Your CV read against your target route: a readiness score and your top 3 fixes. About 10 minutes.', href: '/assessment.html' });
        else actions.push({ tag: 'Your result', title: latest.priorities?.[0] ? clean(latest.priorities[0].title, 90) : 'See your result', detail: latest.priorities?.[0] ? clean(latest.priorities[0].description, 160) : 'Your score and top 3 priorities', href: reportUrl });
        actions.push({ tag: 'Free · 30 seconds', title: target ? `Answer “Why ${target}?” in 30 seconds` : 'Try the 30-second interview check', detail: 'One question, marked on your opening. One free check a week.', href: '/interview-teaser.html' });
        actions.push({ tag: 'Membership', title: 'See what a member’s report looks like', detail: 'A full sample: CV rewrites, model answers, interview prep and a 30-day plan', href: '/fullcycle.html?sample=amelia' });
      }
      const usedNotes = new Set();
      for (const a of actions.slice(0, 3)) {
        const key = /Interview/.test(a.tag) ? 'interview' : /Test/.test(a.tag) ? 'test' : /Deadline|Applications/.test(a.tag) ? 'application' : 'report';
        const n = practitioners.notes[key];
        if (n && !usedNotes.has(n.text)) { a.note = paid ? n : { locked: true, by: n.by, init: n.init }; usedNotes.add(n.text); }   // one note per action, never twice; free accounts see who has a note, not the note
      }
      return res.json({
        testFixture:signupSaved?.testFixture===true,signedIn: !!account, email: signupSaved?.pilotAccess?'':account?.email || '', emailReady: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
        deep:paid&&latest?{status:deepReady?'complete':'draft',score:deepReady?deep.evaluation.score:null,scope:deepReady?deep.evaluation.scope:null,testChoice:deep?.testChoice}:null,member: paid, accountType:paid?'member':account?'free':'guest',needsAssessment:paid&&!latest,until, profile: { name: clean(profile.name, 80), firstName: clean(profile.name, 80).split(' ')[0], targetFirm: clean(profile.targetFirm, 80), targetSector: clean(profile.targetSector, 80), targetDivision: clean(profile.targetDivision, 80), programme: clean(profile.programme, 80) },
        prep:paid?{total:(byId[latest?.id]?.plan?.sevenDayActionPlan?.length||0)+(byId[latest?.id]?.plan?.finalSubmissionChecklist?.length||0),next:byId[latest?.id]?.plan?.sevenDayActionPlan?.[0]?.focus||'Open your report to build your plan'}:null,
        readiness: now ? { score: now.score, band: band(now.score), change: first ? now.score - first.score : 0, timeline: timeline.slice(-6).reverse() } : null,
        interviewUrl, report: latest ? { url: reportUrl, paid: paid, assessmentId: (paidRow || latest).id, breakdown: paid ? latest.breakdown || null : null, rechecks: s.assessments.filter(a => a.rootId).length } : null,
        tests: { last: lastTest ? { at: lastTest.createdAt, ...(() => { const r = testRates(lastTest.data); return { commercial: Number.isFinite(r.commercial) ? Math.round(r.commercial * 100) : null, numerical: Number.isFinite(r.numerical) ? Math.round(r.numerical * 100) : null }; })() } : null, count: tests.length, freeEveryDays: paid ? null : TEST_FREE_DAYS },
        interview: { recent: scores.slice(0, 6).reverse(), count: practice.length, left, per: paid ? 'today' : 'this week' },
        applications, stages: STAGES, news, actions: actions.slice(0, 3), practitioners, challenge, game,
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
      const out = { ids: pend.data.ids, route: pend.data.route, section: pend.data.section || 'both', review: [] };
      for (const g of ['commercial', 'numerical']) {
        const ids = pend.data.ids[g] || [], ans = b.answers?.[g] || [];
        if (!Array.isArray(ans) || ans.length !== ids.length || ans.some(x => !Number.isInteger(x) || x < 0 || x > 3)) return res.status(400).json({ error: 'Answer every question.' });
        if (!ids.length) continue;
        out[g] = { correct: 0, total: ids.length };
        ids.forEach((id, i) => {
          const q = findQ(g, id); if (!q) return;
          const right = ans[i] === q.answer; if (right) out[g].correct++;
          out.review.push({ section: g, topic: q.topic, question: q.question, options: q.options, chosen: ans[i], answer: q.answer, right, working: q.working?.length ? q.working : [], explanation: q.concept || q.explanation || '', trap: q.trap || '' });
        });
      }
      const { review, ...stored } = out;
      const testScore=['commercial','numerical'].reduce((s,k)=>s+(out[k]?.correct||0),0),testOf=['commercial','numerical'].reduce((s,k)=>s+(out[k]?.total||0),0);
      const previousTests=await items(p,['test'],100),pastRates=previousTests.filter(x=>x.data?.section===out.section).map(x=>{const parts=['commercial','numerical'].map(k=>x.data[k]).filter(Boolean);return parts.reduce((s,x)=>s+x.correct,0)/Math.max(1,parts.reduce((s,x)=>s+x.total,0));});
      await sharedEvent(p,'test',{section:out.section,score:testScore,of:testOf,bestYet:testOf>0&&testScore/testOf>Math.max(0,...pastRates)},'test:'+pend.id);
      await sql().query(`UPDATE desk_value_items SET kind='test', data=$3::jsonb, created_at=now() WHERE id=$1 AND principal=$2`, [pend.id, p, JSON.stringify(stored)]);
      const s = await A.ownerSummary(p);
      const assessments = s.assessments.filter(a => !a.refundedAt);
      const bd = assessments.length ? (await sql().query(`SELECT id, result->'breakdown' AS breakdown FROM desk_assessments WHERE id = ANY($1)`, [assessments.map(a => a.id)])) : [];
      const map = Object.fromEntries(bd.map(r => [r.id, r.breakdown]));
      const timeline = readinessTimeline(assessments.map(a => ({ ...a, breakdown: map[a.id] })), await items(p, ['test'], 50));
      const now = timeline[timeline.length - 1], before = timeline[timeline.length - 2];
      return res.json({ success: true, section: out.section, commercial: out.commercial || null, numerical: out.numerical || null, review: out.review, readiness: now ? { score: now.score, band: band(now.score), previous: before?.score ?? null } : null });
    }

    if (b.action === 'tracker-sync') {
      const list = cleanShortlist(b.list), cur = await getShortlist(p);
      if (cur.id) await sql().query(`UPDATE desk_value_items SET data=$3::jsonb, created_at=now() WHERE id=$1 AND principal=$2`, [cur.id, p, JSON.stringify({ list })]);
      else await A.saveItem(p, 'shortlist', { list });
      return res.json({ success: true, count: Object.keys(list).length });
    }
    if (b.action === 'tracker-add') {
      const valid = new Set((await loadProgrammes()).programmes.map(x => x.firm + '|' + x.name));
      const keys = (Array.isArray(b.keys) ? b.keys : []).filter(k => typeof k === 'string' && valid.has(k)).slice(0, 200);
      const cur = await getShortlist(p), list = { ...cur.list };
      let added = 0;
      for (const k of keys) if (!list[k] && Object.keys(list).length < 200) { list[k] = { stage: 'Shortlisted' }; added++; }
      if (cur.id) await sql().query(`UPDATE desk_value_items SET data=$3::jsonb WHERE id=$1 AND principal=$2`, [cur.id, p, JSON.stringify({ list })]);
      else await A.saveItem(p, 'shortlist', { list });
      return res.json({ success: true, added, list });
    }
    if (b.action === 'app-stage' && String(b.id || '').startsWith('t:')) {
      const cur = await getShortlist(p), k = String(b.id).slice(2);
      if (!cur.list[k] || !STAGES.includes(b.stage)) return res.status(400).json({ error: 'Unknown application.' });
      cur.list[k] = { stage: b.stage };
      await sharedEvent(p,'stage',{firm:k.split('|')[0],stage:b.stage},'stage:'+p+':'+k+':'+b.stage);
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
        await sharedEvent(p,'stage',{firm:data.firm,stage:data.stage},'stage:'+p+':'+r[0].id+':'+data.stage);
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
