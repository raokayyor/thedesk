// Staff-only test runner: runs the free assessment and the paid Full Cycle report
// for the fictional personas in samples/test-personas.json, so staff can compare
// what a student gets free against what they get for £89.
//
// Auth: Authorization: Bearer PRACTITIONER_SUPPORT_KEY (typed by staff in test-compare.html)
// GET  /api/test-run                    -> personas + saved runs for the latest batch (or ?batch=)
// POST {action:'step', batch, personaKey, step:'free'|'verdict'|'repair'|'plan'}
// POST {action:'rate', batch, personaKey, rating:1-5, notes}
//
// Test records are written to desk_assessments under a fixed test owner and marked paid
// so the real Full Cycle handler can run. They are tagged input.testRun=true.
import { createRequire } from 'node:module';
import { timingSafeEqual, createHash } from 'node:crypto';
import { sql, initStore } from '../lib/report-store.mjs';
import { questionsForRoute } from '../lib/question-banks.mjs';
import analyse from './analyse-mot.js';
import fullCycle from './full-cycle.js';

export const maxDuration = 300;
const require = createRequire(import.meta.url);
const PERSONAS = require('../samples/test-personas.json').personas;
const STEPS = ['free', 'verdict', 'repair', 'plan'];
const TEST_OWNER = createHash('sha256').update('the-desk-internal-test-runner-v1').digest('hex');

// Preview deployments are behind Vercel login (deployment protection), so no key is needed there (approved by Rao).
const staffOk = req => {
  if (process.env.VERCEL_ENV === 'preview') return true;
  const e = process.env.PRACTITIONER_SUPPORT_KEY || '';
  const a = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), b = Buffer.from(e);
  return !!e && a.length === b.length && timingSafeEqual(a, b);
};

let tableReady;
const initRuns = () => tableReady ??= initStore().then(() => sql().query(`CREATE TABLE IF NOT EXISTS desk_test_runs (
  batch text NOT NULL, persona_key text NOT NULL, assessment_id text,
  free jsonb, report jsonb NOT NULL DEFAULT '{}', timings jsonb NOT NULL DEFAULT '{}', errors jsonb NOT NULL DEFAULT '{}',
  rating integer, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (batch, persona_key))`)).catch(e => { tableReady = null; throw e; });

// Build the 10 quiz answers: first n of each group correct, the rest wrong.
function answersFor(p) {
  const bank = questionsForRoute(p.profile.targetSector), out = {};
  for (const g of ['commercial', 'numerical']) out[g] = bank[g].map((q, i) => i < (p.quiz?.[g] ?? 3) ? q.answer : (q.answer + 1) % 4);
  return { answers: out, questionBankId: bank.id };
}

// Call a real handler in-process with a fake request from the test owner.
function invoke(handler, req, body) {
  const host = req.headers.host;
  const origin = new URL(process.env.APP_ORIGIN || `https://${host}`).origin;
  const fakeReq = { method: 'POST', body, query: {}, headers: { host, origin, cookie: `desk_owner=${TEST_OWNER}`, 'x-forwarded-for': '127.0.0.1' } };
  return new Promise((resolve, reject) => {
    let code = 200;
    const res = {
      setHeader() { return res; }, getHeader() {}, status(c) { code = c; return res; },
      json(d) { resolve({ status: code, data: d }); return res; }, send(d) { resolve({ status: code, data: d }); return res; }, end() { resolve({ status: code, data: null }); return res; }
    };
    Promise.resolve(handler(fakeReq, res)).catch(reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!staffOk(req)) return res.status(401).json({ error: 'Staff key required.' });
  try {
    await initRuns();
    if (req.method === 'GET' && req.query?.view) {
      // Open the real student pages for a test record: sets this browser's desk_owner cookie
      // to the test owner (preview only) and redirects. "free" uses an unpaid copy so the page
      // shows exactly what a non-paying student sees.
      const run = (await sql().query('SELECT assessment_id FROM desk_test_runs WHERE batch=$1 AND persona_key=$2', [String(req.query.batch || ''), String(req.query.persona || '')]))[0];
      if (!run?.assessment_id) return res.status(404).send('Run this student first.');
      let id = run.assessment_id;
      if (req.query.view === 'free') {
        id = createHash('sha256').update(run.assessment_id + ':free-view').digest('hex').slice(0, 48);
        await sql().query(`INSERT INTO desk_assessments(id,owner_hash,input,result) SELECT $1,owner_hash,input,result FROM desk_assessments WHERE id=$2 ON CONFLICT (id) DO NOTHING`, [id, run.assessment_id]);
      }
      res.setHeader('Set-Cookie', `desk_owner=${TEST_OWNER}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${process.env.VERCEL ? '; Secure' : ''}`);
      res.statusCode = 302;
      res.setHeader('Location', (req.query.view === 'free' ? '/result-final-design.html?id=' : '/fullcycle.html?id=') + id);
      return res.end();
    }
    if (req.method === 'GET') {
      const latest = (await sql().query('SELECT batch FROM desk_test_runs ORDER BY created_at DESC LIMIT 1'))[0]?.batch || null;
      const batch = String(req.query?.batch || latest || '');
      const runs = batch ? await sql().query('SELECT * FROM desk_test_runs WHERE batch=$1', [batch]) : [];
      const batches = await sql().query('SELECT batch, min(created_at) AS started, count(*)::int AS personas FROM desk_test_runs GROUP BY batch ORDER BY min(created_at) DESC LIMIT 20');
      return res.json({ batch, batches, personas: PERSONAS, runs, env: { anthropic: !!process.env.ANTHROPIC_API_KEY, database: !!process.env.DATABASE_URL } });
    }
    if (req.method !== 'POST') return res.status(405).end();
    const { action, batch, personaKey } = req.body || {};
    if (!/^[\w-]{1,40}$/.test(batch || '')) return res.status(400).json({ error: 'Missing batch name.' });
    const p = PERSONAS.find(x => x.key === personaKey);
    if (!p) return res.status(400).json({ error: 'Unknown persona.' });

    if (action === 'rate') {
      const rating = Number.isInteger(req.body.rating) && req.body.rating >= 1 && req.body.rating <= 5 ? req.body.rating : null;
      const notes = String(req.body.notes || '').slice(0, 4000);
      await sql().query(`INSERT INTO desk_test_runs(batch,persona_key,rating,notes) VALUES($1,$2,$3,$4)
        ON CONFLICT (batch,persona_key) DO UPDATE SET rating=$3, notes=$4, updated_at=now()`, [batch, p.key, rating, notes]);
      return res.json({ success: true });
    }
    if (action !== 'step' || !STEPS.includes(req.body.step)) return res.status(400).json({ error: 'Unknown action.' });
    const step = req.body.step;
    await sql().query('INSERT INTO desk_test_runs(batch,persona_key) VALUES($1,$2) ON CONFLICT DO NOTHING', [batch, p.key]);
    const run = (await sql().query('SELECT * FROM desk_test_runs WHERE batch=$1 AND persona_key=$2', [batch, p.key]))[0];
    const started = Date.now();
    let out;
    if (step === 'free') {
      const { answers, questionBankId } = answersFor(p);
      out = await invoke(analyse, req, { consent: true, cv: { text: p.cv }, profile: p.profile, answers, questionBankId });
      if (out.status === 200 && out.data?.id) {
        // Mark as a paid test record so the real Full Cycle handler can run on it.
        await sql().query(`UPDATE desk_assessments SET paid_at=now(), input=input||'{"testRun":true}'::jsonb WHERE id=$1 AND owner_hash=$2`, [out.data.id, createHash('sha256').update(TEST_OWNER).digest('hex')]);
        const full = (await sql().query('SELECT result FROM desk_assessments WHERE id=$1', [out.data.id]))[0]?.result || null;
        await sql().query(`UPDATE desk_test_runs SET assessment_id=$3, free=$4::jsonb, report='{}', errors=errors-'free', timings=jsonb_set(timings,'{free}',to_jsonb($5::int)), updated_at=now() WHERE batch=$1 AND persona_key=$2`,
          [batch, p.key, out.data.id, JSON.stringify({ shown: out.data, full }), Date.now() - started]);
      }
    } else {
      if (!run.assessment_id) return res.status(409).json({ error: 'Run the free assessment first.' });
      out = await invoke(fullCycle, req, { assessmentId: run.assessment_id, part: step });
      if (out.status === 200 && out.data?.data) {
        await sql().query(`UPDATE desk_test_runs SET report=jsonb_set(report,ARRAY[$3],$4::jsonb), errors=errors-$3, timings=jsonb_set(timings,ARRAY[$3],to_jsonb($5::int)), updated_at=now() WHERE batch=$1 AND persona_key=$2`,
          [batch, p.key, step, JSON.stringify(out.data.data), Date.now() - started]);
      }
    }
    if (out.status !== 200) {
      await sql().query(`UPDATE desk_test_runs SET errors=jsonb_set(errors,ARRAY[$3],to_jsonb($4::text)), updated_at=now() WHERE batch=$1 AND persona_key=$2`,
        [batch, p.key, step, `${out.status}: ${out.data?.error || 'failed'}${out.data?.category ? ' (' + out.data.category + ')' : ''}`]);
      return res.status(502).json({ success: false, step, status: out.status, error: out.data?.error, category: out.data?.category });
    }
    return res.json({ success: true, step, ms: Date.now() - started });
  } catch (e) {
    console.error('test-run failed', e?.message);
    return res.status(500).json({ success: false, error: e?.message || 'Test run failed' });
  }
}
