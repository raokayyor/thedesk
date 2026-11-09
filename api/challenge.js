// The Desk · weekly market challenge (no live market data).
// Each week staff post a scenario and a handful of instruments. Members split a virtual £100,000 across them
// (and cash) with a one-line rationale. When the week ends, staff enter each instrument's actual move for the
// week from public sources, plus a short practitioner commentary; entries are scored and ranked.
//
// GET                                   -> this week's challenge, my entry, last results with leaderboard, season league
// POST {action:'enter', challengeId, weights:{key:pct}, rationale, displayName}   members only, until it closes
// Staff (Authorization: Bearer PRACTITIONER_SUPPORT_KEY):
// GET  ?view=staff                       -> all challenges with entry counts
// POST {action:'staff-save', id?, title, scenario, instruments:[{key,name,hint}], opensAt, closesAt}
// POST {action:'staff-score', id, results:{key:pct}, commentary, commentaryBy}
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { sql, sameOrigin, apiFailure, initStore } from '../lib/report-store.mjs';
import * as A from '../lib/value-accounts.mjs';
import { PRACTITIONERS } from '../lib/practitioner-questions.mjs';

export const STAKE = 100000;
const staffOk = req => { const e = process.env.PRACTITIONER_SUPPORT_KEY || ''; const a = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), b = Buffer.from(e); return !!e && a.length === b.length && timingSafeEqual(a, b); };
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const num = v => { const x = Number(v); return Number.isFinite(x) ? x : null; };

let ready;
function init() {
  return ready ??= (async () => {
    await initStore();
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_challenges (id text PRIMARY KEY, title text NOT NULL, scenario text NOT NULL,
      instruments jsonb NOT NULL, opens_at timestamptz NOT NULL, closes_at timestamptz NOT NULL, results jsonb, commentary text NOT NULL DEFAULT '',
      commentary_by text NOT NULL DEFAULT '', scored_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_challenge_entries (challenge_id text NOT NULL, principal text NOT NULL, display_name text NOT NULL,
      university text NOT NULL DEFAULT '', weights jsonb NOT NULL, rationale text NOT NULL DEFAULT '', return_pct numeric, submitted_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (challenge_id, principal))`);
  })().catch(e => { ready = null; throw e; });
}

// Pure: validate a split of 100% across the instruments and cash. Long-only, whole percentages, 0–100 each.
export function validWeights(weights, instruments) {
  const keys = instruments.map(i => i.key), out = {};
  let total = 0;
  for (const k of [...keys, 'cash']) {
    const v = weights?.[k] == null || weights[k] === '' ? 0 : Number(weights[k]);
    if (!Number.isInteger(v) || v < 0 || v > 100) return { error: 'Use whole percentages between 0 and 100.' };
    if (v) out[k] = v; total += v;
  }
  if (total !== 100) return { error: `Your split adds up to ${total}%. It needs to be exactly 100%.` };
  return { weights: out };
}
// Pure: portfolio return in % for a split, given each instrument's weekly move in %. Cash earns 0.
export const portfolioReturn = (weights, results) => Math.round(Object.entries(weights).reduce((s, [k, w]) => s + (k === 'cash' ? 0 : w / 100 * (Number(results[k]) || 0)), 0) * 100) / 100;

const publicChallenge = c => c && ({ id: c.id, title: c.title, scenario: c.scenario, instruments: c.instruments, opensAt: c.opens_at, closesAt: c.closes_at, results: c.results || null, commentary: c.commentary, commentaryBy: c.commentary_by, scoredAt: c.scored_at });
const nameOf = r => r.display_name + (r.university ? ' · ' + r.university : '');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await init();
    const q = req.query || {};
    if (q.view === 'staff') {
      if (!staffOk(req)) return res.status(401).json({ error: 'Staff key required.' });
      const rows = await sql().query(`SELECT c.*, (SELECT count(*)::int FROM desk_challenge_entries e WHERE e.challenge_id=c.id) AS entries FROM desk_challenges c ORDER BY opens_at DESC LIMIT 60`);
      return res.json({ challenges: rows.map(r => ({ ...publicChallenge(r), entries: r.entries })), practitioners: PRACTITIONERS });
    }
    const p = await A.principal(req, res);
    const member = await A.isPaidOwner(p);

    if (req.method === 'GET') {
      const current = (await sql().query(`SELECT * FROM desk_challenges WHERE opens_at <= now() AND scored_at IS NULL ORDER BY opens_at DESC LIMIT 1`))[0] || null;
      const mine = current ? (await sql().query('SELECT weights, rationale, display_name AS "displayName", submitted_at AS "submittedAt" FROM desk_challenge_entries WHERE challenge_id=$1 AND principal=$2', [current.id, p]))[0] || null : null;
      const last = (await sql().query(`SELECT * FROM desk_challenges WHERE scored_at IS NOT NULL ORDER BY closes_at DESC LIMIT 1`))[0] || null;
      let results = null;
      if (last) {
        const rows = await sql().query(`SELECT principal, display_name, university, return_pct, rationale, RANK() OVER (ORDER BY return_pct DESC) AS rank FROM desk_challenge_entries WHERE challenge_id=$1 ORDER BY return_pct DESC`, [last.id]);
        const me = rows.find(r => r.principal === p);
        results = { ...publicChallenge(last), entries: rows.length, top: rows.slice(0, 10).map(r => ({ rank: +r.rank, name: nameOf(r), returnPct: +r.return_pct, rationale: r.rationale, you: r.principal === p })),
          me: me ? { rank: +me.rank, returnPct: +me.return_pct } : null };
      }
      // Season league: total return over the scored weeks since 1 September (UK recruiting season).
      const now = new Date(), season = new Date(Date.UTC(now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1, 8, 1));
      const league = await sql().query(`SELECT e.principal, max(e.display_name) AS display_name, max(e.university) AS university, round(sum(e.return_pct), 2) AS total, count(*)::int AS weeks
        FROM desk_challenge_entries e JOIN desk_challenges c ON c.id=e.challenge_id WHERE c.scored_at IS NOT NULL AND c.closes_at >= $1 GROUP BY e.principal ORDER BY total DESC LIMIT 200`, [season.toISOString()]);
      const myLeague = league.findIndex(r => r.principal === p);
      return res.json({ member, stake: STAKE, current: publicChallenge(current), open: !!current && new Date(current.closes_at) > new Date(), mine, results,
        league: { top: league.slice(0, 10).map((r, i) => ({ rank: i + 1, name: nameOf(r), totalPct: +r.total, weeks: r.weeks, you: r.principal === p })), me: myLeague >= 0 ? { rank: myLeague + 1, totalPct: +league[myLeague].total, weeks: league[myLeague].weeks } : null, since: season.toISOString() } });
    }

    if (req.method !== 'POST') return res.status(405).end();
    if (!sameOrigin(req, res)) return;
    const b = req.body || {};

    if (b.action === 'enter') {
      if (!member) return res.status(402).json({ error: 'The weekly challenge is part of membership.' });
      const c = (await sql().query('SELECT * FROM desk_challenges WHERE id=$1', [String(b.challengeId || '')]))[0];
      if (!c || new Date(c.opens_at) > new Date() || c.scored_at) return res.status(404).json({ error: 'That challenge isn’t open.' });
      if (new Date(c.closes_at) <= new Date()) return res.status(409).json({ error: 'Entries for this week have closed.' });
      const v = validWeights(b.weights, c.instruments); if (v.error) return res.status(400).json(v);
      const displayName = clean(b.displayName, 40); if (displayName.length < 2) return res.status(400).json({ error: 'Choose the name to show on the leaderboard.' });
      const university = clean(b.university, 60), rationale = clean(b.rationale, 280);
      await sql().query(`INSERT INTO desk_challenge_entries(challenge_id, principal, display_name, university, weights, rationale) VALUES($1,$2,$3,$4,$5::jsonb,$6)
        ON CONFLICT (challenge_id, principal) DO UPDATE SET display_name=$3, university=$4, weights=$5::jsonb, rationale=$6, submitted_at=now()`, [c.id, p, displayName, university, JSON.stringify(v.weights), rationale]);
      return res.json({ success: true });
    }

    if (String(b.action || '').startsWith('staff-')) {
      if (!staffOk(req)) return res.status(401).json({ error: 'Staff key required.' });
      if (b.action === 'staff-save') {
        const title = clean(b.title, 120), scenario = String(b.scenario || '').replace(/\r/g, '').trim().slice(0, 3000);
        const instruments = (Array.isArray(b.instruments) ? b.instruments : []).map(i => ({ key: clean(i.key || i.name, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name: clean(i.name, 60), hint: clean(i.hint, 160) })).filter(i => i.key && i.name && i.key !== 'cash');
        if (!title || scenario.length < 20) return res.status(400).json({ error: 'Add a title and a scenario.' });
        if (instruments.length < 2 || instruments.length > 8 || new Set(instruments.map(i => i.key)).size !== instruments.length) return res.status(400).json({ error: 'Add 2 to 8 instruments with different names.' });
        const opensAt = new Date(b.opensAt), closesAt = new Date(b.closesAt);
        if (isNaN(opensAt) || isNaN(closesAt) || closesAt <= opensAt) return res.status(400).json({ error: 'Set when entries open and close.' });
        if (b.id) {
          const has = (await sql().query('SELECT count(*)::int AS n FROM desk_challenge_entries WHERE challenge_id=$1', [b.id]))[0].n;
          const old = (await sql().query('SELECT instruments FROM desk_challenges WHERE id=$1', [b.id]))[0];
          if (!old) return res.status(404).json({ error: 'Not found.' });
          if (has && JSON.stringify(old.instruments.map(i => i.key)) !== JSON.stringify(instruments.map(i => i.key))) return res.status(409).json({ error: 'Students have entered already, so the instruments can’t change. You can still edit the wording and dates.' });
          await sql().query('UPDATE desk_challenges SET title=$2, scenario=$3, instruments=$4::jsonb, opens_at=$5, closes_at=$6 WHERE id=$1', [b.id, title, scenario, JSON.stringify(instruments), opensAt.toISOString(), closesAt.toISOString()]);
          return res.json({ success: true, id: b.id });
        }
        const id = randomBytes(8).toString('hex');
        await sql().query('INSERT INTO desk_challenges(id, title, scenario, instruments, opens_at, closes_at) VALUES($1,$2,$3,$4::jsonb,$5,$6)', [id, title, scenario, JSON.stringify(instruments), opensAt.toISOString(), closesAt.toISOString()]);
        return res.json({ success: true, id });
      }
      if (b.action === 'staff-score') {
        const c = (await sql().query('SELECT * FROM desk_challenges WHERE id=$1', [String(b.id || '')]))[0];
        if (!c) return res.status(404).json({ error: 'Not found.' });
        const results = {};
        for (const i of c.instruments) { const v = num(b.results?.[i.key]); if (v === null || Math.abs(v) > 100) return res.status(400).json({ error: `Enter the week’s move for ${i.name} as a percentage.` }); results[i.key] = v; }
        const commentary = String(b.commentary || '').replace(/\r/g, '').trim().slice(0, 3000);
        if (commentary.length < 20) return res.status(400).json({ error: 'Add a short commentary: what happened and why.' });
        const by = PRACTITIONERS.includes(b.commentaryBy) ? b.commentaryBy : '';
        const entries = await sql().query('SELECT principal, weights FROM desk_challenge_entries WHERE challenge_id=$1', [c.id]);
        for (const e of entries) await sql().query('UPDATE desk_challenge_entries SET return_pct=$3 WHERE challenge_id=$1 AND principal=$2', [c.id, e.principal, portfolioReturn(e.weights, results)]);
        await sql().query('UPDATE desk_challenges SET results=$2::jsonb, commentary=$3, commentary_by=$4, scored_at=now() WHERE id=$1', [c.id, JSON.stringify(results), commentary, by]);
        return res.json({ success: true, scored: entries.length });
      }
      return res.status(400).json({ error: 'Unknown action.' });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}
