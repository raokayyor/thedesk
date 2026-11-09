// The Desk · trading game (simulated market). See lib/trading-game.mjs for the companies, news presets and maths.
// Students (open to everyone, free or member; up to MAX_HOLDINGS different investments): GET -> market, news, my portfolio, league.  POST {action:'join', displayName, university} | {action:'trade', ticker, side:'buy'|'sell', shares}
// Staff (Authorization: Bearer PRACTITIONER_SUPPORT_KEY):
//   GET ?view=staff                         -> game, prices, presets, sectors, recent news
//   POST {action:'staff-new-game', name}    -> starts a fresh game (everyone back to £100,000; the old one is kept as ended)
//   POST {action:'staff-publish', events:[{headline, body, why, practitioner, effects:{market, sectors:{}, stocks:{}}}]} -> today's news; prices move
import { timingSafeEqual, randomBytes, randomInt } from 'node:crypto';
import { sql, sameOrigin, apiFailure, initStore } from '../lib/report-store.mjs';
import * as A from '../lib/value-accounts.mjs';
import { PRACTITIONERS } from '../lib/practitioner-questions.mjs';
import { STARTING_CASH, MAX_HOLDINGS, SECTORS, UNIVERSE, PRESETS, NOISE, QTY_DP, dpOf, moveFor, applyMove, cleanEffects, portfolioValue } from '../lib/trading-game.mjs';

const staffOk = req => { const e = process.env.PRACTITIONER_SUPPORT_KEY || ''; const a = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), b = Buffer.from(e); return !!e && a.length === b.length && timingSafeEqual(a, b); };
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const text = (v, n) => String(v ?? '').replace(/\r/g, '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, n);

let ready;
function init() {
  return ready ??= (async () => {
    await initStore();
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_game (id text PRIMARY KEY, name text NOT NULL, day integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'live', created_at timestamptz NOT NULL DEFAULT now())`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_game_prices (game_id text NOT NULL, ticker text NOT NULL, name text NOT NULL, sector text NOT NULL, price numeric NOT NULL, history jsonb NOT NULL DEFAULT '[]', PRIMARY KEY (game_id, ticker))`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_game_events (id bigserial PRIMARY KEY, game_id text NOT NULL, day integer NOT NULL, headline text NOT NULL, body text NOT NULL DEFAULT '', why text NOT NULL DEFAULT '', practitioner text NOT NULL DEFAULT '', effects jsonb NOT NULL, published_at timestamptz NOT NULL DEFAULT now())`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_game_accounts (game_id text NOT NULL, principal text NOT NULL, display_name text NOT NULL, university text NOT NULL DEFAULT '', cash numeric NOT NULL, positions jsonb NOT NULL DEFAULT '{}', stops jsonb NOT NULL DEFAULT '{}', joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (game_id, principal))`);
    await sql().query(`ALTER TABLE IF EXISTS desk_game_accounts ADD COLUMN IF NOT EXISTS stops jsonb NOT NULL DEFAULT '{}'`).catch(() => {});
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_game_trades (id bigserial PRIMARY KEY, game_id text NOT NULL, principal text NOT NULL, day integer NOT NULL, ticker text NOT NULL, side text NOT NULL, shares numeric NOT NULL, price numeric NOT NULL, at timestamptz NOT NULL DEFAULT now())`);
  })().catch(e => { ready = null; throw e; });
}
// The live game. If the list of investments has grown since it started, the new ones join at their default level.
async function liveGame() {
  const g = (await sql().query(`SELECT * FROM desk_game WHERE status='live' ORDER BY created_at DESC LIMIT 1`))[0] || null;
  if (!g) return null;
  const have = new Set((await sql().query('SELECT ticker FROM desk_game_prices WHERE game_id=$1', [g.id])).map(r => r.ticker));
  for (const c of UNIVERSE) if (!have.has(c.ticker)) await sql().query('INSERT INTO desk_game_prices(game_id, ticker, name, sector, price, history) VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT DO NOTHING', [g.id, c.ticker, c.name, c.sector, c.price, JSON.stringify([[g.day, c.price]])]);
  return g;
}
async function newGame(name, levels = {}) {
  await sql().query(`UPDATE desk_game SET status='ended' WHERE status='live'`);
  const id = randomBytes(8).toString('hex');
  await sql().query('INSERT INTO desk_game(id, name) VALUES($1,$2)', [id, name]);
  for (const c of UNIVERSE) { const v = Number(levels[c.ticker]); const start = Number.isFinite(v) && v > 0 ? v : c.price; await sql().query('INSERT INTO desk_game_prices(game_id, ticker, name, sector, price, history) VALUES($1,$2,$3,$4,$5,$6::jsonb)', [id, c.ticker, c.name, c.sector, start, JSON.stringify([[0, start]])]); }
  return id;
}
async function prices(gameId) {
  const rows = await sql().query('SELECT ticker, name, sector, price, history FROM desk_game_prices WHERE game_id=$1 ORDER BY sector, ticker', [gameId]);
  const order = t => { const i = UNIVERSE.findIndex(u => u.ticker === t); return i < 0 ? 99 : i; };
  rows.sort((x, y) => order(x.ticker) - order(y.ticker));
  return rows.map(r => { const h = r.history || [], prev = h.length > 1 ? h[h.length - 2][1] : +r.price; const u = UNIVERSE.find(x => x.ticker === r.ticker) || {}; return { ticker: r.ticker, name: r.name, sector: r.sector, region: u.region || '', hint: u.hint || '', dp: u.dp ?? 2, price: +r.price, prev: +prev, change: prev ? Math.round((+r.price / prev - 1) * 10000) / 100 : 0, start: h[0]?.[1] ?? +r.price, history: h.slice(-30) }; });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await init();
    const q = req.query || {};
    if (q.view === 'staff') {
      if (!staffOk(req)) return res.status(401).json({ error: 'Staff key required.' });
      const g = await liveGame();
      const players = g ? (await sql().query('SELECT count(*)::int AS n FROM desk_game_accounts WHERE game_id=$1', [g.id]))[0].n : 0;
      return res.json({ game: g && { id: g.id, name: g.name, day: g.day, players }, prices: g ? await prices(g.id) : [], universe: UNIVERSE, presets: PRESETS, sectors: SECTORS, practitioners: PRACTITIONERS,
        news: g ? await sql().query('SELECT day, headline, effects, published_at AS "publishedAt" FROM desk_game_events WHERE game_id=$1 ORDER BY id DESC LIMIT 30', [g.id]) : [] });
    }
    const p = await A.principal(req, res);
    const member = await A.isPaidOwner(p);

    if (req.method === 'GET') {
      const g = await liveGame();
      if (!g) return res.json({ member, game: null });
      const px = await prices(g.id), map = Object.fromEntries(px.map(x => [x.ticker, x.price]));
      const news = await sql().query('SELECT day, headline, body, why, practitioner, effects, published_at AS "publishedAt" FROM desk_game_events WHERE game_id=$1 ORDER BY id DESC LIMIT 20', [g.id]);
      const accounts = await sql().query('SELECT principal, display_name, university, cash, positions, stops FROM desk_game_accounts WHERE game_id=$1', [g.id]);
      const ranked = accounts.map(a => ({ principal: a.principal, name: a.display_name + (a.university ? ' · ' + a.university : ''), value: portfolioValue(a.cash, a.positions, map) })).sort((x, y) => y.value - x.value);
      const meIdx = ranked.findIndex(r => r.principal === p), mine = accounts.find(a => a.principal === p);
      const trades = mine ? await sql().query('SELECT day, ticker, side, shares, price, at FROM desk_game_trades WHERE game_id=$1 AND principal=$2 ORDER BY id DESC LIMIT 20', [g.id, p]) : [];
      return res.json({ member, startingCash: STARTING_CASH, maxHoldings: MAX_HOLDINGS,
        game: { name: g.name, day: g.day }, prices: px, news,
        me: mine ? { displayName: mine.display_name, cash: +mine.cash, positions: mine.positions, stops: mine.stops || {}, value: ranked[meIdx].value, rank: meIdx + 1, players: ranked.length, trades: trades.map(t => ({ ...t, price: +t.price, shares: +t.shares })) } : null,
        league: ranked.slice(0, 10).map((r, i) => ({ rank: i + 1, name: r.name, value: r.value, returnPct: Math.round((r.value / STARTING_CASH - 1) * 10000) / 100, you: r.principal === p })), players: ranked.length });
    }

    if (req.method !== 'POST') return res.status(405).end();
    if (!sameOrigin(req, res)) return;
    const b = req.body || {};

    if (b.action === 'join' || b.action === 'trade' || b.action === 'stop') {
      const g = await liveGame(); if (!g) return res.status(404).json({ error: 'No game is running right now.' });
      if (b.action === 'join') {
        const dn = clean(b.displayName, 40); if (dn.length < 2) return res.status(400).json({ error: 'Choose the name to show on the leaderboard.' });
        await sql().query(`INSERT INTO desk_game_accounts(game_id, principal, display_name, university, cash) VALUES($1,$2,$3,$4,$5) ON CONFLICT (game_id, principal) DO UPDATE SET display_name=$3, university=$4`, [g.id, p, dn, clean(b.university, 60), STARTING_CASH]);
        return res.json({ success: true });
      }
      const account = async () => { const a = (await sql().query('SELECT cash, positions, stops FROM desk_game_accounts WHERE game_id=$1 AND principal=$2', [g.id, p]))[0]; return a ? { cash: +a.cash, positions: a.positions, stops: a.stops || {} } : null; };
      if (b.action === 'stop') {
        // Set or clear a stop loss on something you hold: if the price falls to this level, it's sold automatically.
        const t = String(b.ticker || ''), a = await account();
        if (!a) return res.status(400).json({ error: 'Join the game first.' });
        if (!a.positions[t]) return res.status(400).json({ error: 'You can only set a stop loss on something you hold.' });
        const px = +((await sql().query('SELECT price FROM desk_game_prices WHERE game_id=$1 AND ticker=$2', [g.id, t]))[0]?.price || 0);
        if (b.stopPrice === null || b.stopPrice === '' || b.stopPrice === undefined) await sql().query(`UPDATE desk_game_accounts SET stops=stops-$3::text WHERE game_id=$1 AND principal=$2`, [g.id, p, t]);
        else { const sp = Number(b.stopPrice); if (!(sp > 0 && sp < px)) return res.status(400).json({ error: 'A stop loss has to be below the current price.' }); await sql().query(`UPDATE desk_game_accounts SET stops=jsonb_set(stops, ARRAY[$3::text], to_jsonb($4::numeric)) WHERE game_id=$1 AND principal=$2`, [g.id, p, t, sp]); }
        return res.json({ success: true, account: await account() });
      }
      const ticker = String(b.ticker || ''), side = b.side, f = 10 ** QTY_DP, shares = Math.round(Number(b.shares) * f) / f;
      if (!['buy', 'sell'].includes(side) || !Number.isFinite(shares) || shares <= 0 || shares > 10000000) return res.status(400).json({ error: 'Enter how many units.' });
      if (side === 'buy') {
        const acct = (await sql().query('SELECT positions FROM desk_game_accounts WHERE game_id=$1 AND principal=$2', [g.id, p]))[0];
        if (acct && !acct.positions?.[ticker] && Object.keys(acct.positions || {}).length >= MAX_HOLDINGS) return res.status(400).json({ error: `You can hold up to ${MAX_HOLDINGS} different investments. Sell one before adding another.` });
      }
      const row = (await sql().query('SELECT price FROM desk_game_prices WHERE game_id=$1 AND ticker=$2', [g.id, ticker]))[0];
      if (!row) return res.status(400).json({ error: 'Unknown company.' });
      const price = +row.price, cost = Math.round(price * shares * 100) / 100;
      const updated = side === 'buy'
        ? await sql().query(`UPDATE desk_game_accounts SET cash=cash-$3, positions=jsonb_set(positions, ARRAY[$4::text], to_jsonb(COALESCE((positions->>$4::text)::numeric,0)+$5::numeric)) WHERE game_id=$1 AND principal=$2 AND cash >= $3 RETURNING cash`, [g.id, p, cost, ticker, shares])
        : await sql().query(`UPDATE desk_game_accounts SET cash=cash+$3, positions=CASE WHEN (positions->>$4::text)::numeric=$5::numeric THEN positions-$4::text ELSE jsonb_set(positions, ARRAY[$4::text], to_jsonb((positions->>$4::text)::numeric-$5::numeric)) END WHERE game_id=$1 AND principal=$2 AND COALESCE((positions->>$4::text)::numeric,0) >= $5::numeric RETURNING cash`, [g.id, p, cost, ticker, shares]);
      if (!updated.length) {
        const joined = (await sql().query('SELECT 1 FROM desk_game_accounts WHERE game_id=$1 AND principal=$2', [g.id, p]))[0];
        return res.status(400).json({ error: !joined ? 'Join the game first.' : side === 'buy' ? 'Not enough cash for that many shares.' : 'You don’t hold that many shares.' });
      }
      await sql().query('INSERT INTO desk_game_trades(game_id, principal, day, ticker, side, shares, price) VALUES($1,$2,$3,$4,$5,$6,$7)', [g.id, p, g.day, ticker, side, shares, price]);
      // Optional stop loss with a buy; selling everything clears the stop.
      const sp = Number(b.stopPrice);
      if (side === 'buy' && b.stopPrice != null && b.stopPrice !== '' && sp > 0 && sp < price) await sql().query(`UPDATE desk_game_accounts SET stops=jsonb_set(stops, ARRAY[$3::text], to_jsonb($4::numeric)) WHERE game_id=$1 AND principal=$2`, [g.id, p, ticker, sp]);
      const after = await account();
      if (side === 'sell' && !after.positions[ticker] && after.stops[ticker]) { await sql().query(`UPDATE desk_game_accounts SET stops=stops-$3::text WHERE game_id=$1 AND principal=$2`, [g.id, p, ticker]); delete after.stops[ticker]; }
      return res.json({ success: true, price, cost, cash: after.cash, account: after });
    }

    if (String(b.action || '').startsWith('staff-')) {
      if (!staffOk(req)) return res.status(401).json({ error: 'Staff key required.' });
      if (b.action === 'staff-new-game') {
        const id = await newGame(clean(b.name, 80) || 'The Desk trading game', b.levels || {});
        return res.json({ success: true, id });
      }
      if (b.action === 'staff-publish') {
        const g = await liveGame(); if (!g) return res.status(404).json({ error: 'Start a game first.' });
        const tickers = UNIVERSE.map(c => c.ticker);
        const events = (Array.isArray(b.events) ? b.events : []).slice(0, 5).map(e => ({ headline: clean(e.headline, 160), body: text(e.body, 1200), why: text(e.why, 1200), practitioner: PRACTITIONERS.includes(e.practitioner) ? e.practitioner : '', effects: cleanEffects(e.effects, tickers) })).filter(e => e.headline.length >= 6);
        if (!events.length) return res.status(400).json({ error: 'Add at least one news item with a headline.' });
        const day = g.day + 1, rows = await sql().query('SELECT ticker, sector, price, history FROM desk_game_prices WHERE game_id=$1', [g.id]);
        const moves = {};
        for (const r of rows) {
          const noise = (randomInt(2001) - 1000) / 1000 * (NOISE[r.sector] ?? 0.5);   // a little random movement, bigger for volatile assets
          const pct = moveFor({ ticker: r.ticker, sector: r.sector }, events, noise), price = applyMove(+r.price, pct, dpOf(r.ticker));
          moves[r.ticker] = Math.round(pct * 100) / 100;
          await sql().query('UPDATE desk_game_prices SET price=$3, history=history || $4::jsonb WHERE game_id=$1 AND ticker=$2', [g.id, r.ticker, price, JSON.stringify([[day, price]])]);
        }
        for (const e of events) await sql().query('INSERT INTO desk_game_events(game_id, day, headline, body, why, practitioner, effects) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)', [g.id, day, e.headline, e.body, e.why, e.practitioner, JSON.stringify(e.effects)]);
        await sql().query('UPDATE desk_game SET day=$2 WHERE id=$1', [g.id, day]);
        // Stop losses: anything that has fallen to or through its stop is sold at today's new price.
        const newPx = Object.fromEntries((await sql().query('SELECT ticker, price FROM desk_game_prices WHERE game_id=$1', [g.id])).map(r => [r.ticker, +r.price]));
        let stopped = 0;
        for (const a of await sql().query(`SELECT principal, positions, stops FROM desk_game_accounts WHERE game_id=$1 AND stops <> '{}'::jsonb`, [g.id])) {
          for (const [t, stop] of Object.entries(a.stops || {})) {
            const q = Number(a.positions?.[t] || 0), px = newPx[t];
            if (!q || !(px <= Number(stop))) continue;
            await sql().query(`UPDATE desk_game_accounts SET cash=cash+$3, positions=positions-$4::text, stops=stops-$4::text WHERE game_id=$1 AND principal=$2`, [g.id, a.principal, Math.round(q * px * 100) / 100, t]);
            await sql().query('INSERT INTO desk_game_trades(game_id, principal, day, ticker, side, shares, price) VALUES($1,$2,$3,$4,$5,$6,$7)', [g.id, a.principal, day, t, 'stop', q, px]);
            stopped++;
          }
        }
        return res.json({ success: true, day, moves, stopped });
      }
      return res.status(400).json({ error: 'Unknown action.' });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}
