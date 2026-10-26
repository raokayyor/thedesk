// The Desk · usage analytics storage and reports.
// Visitors are identified by a hash of IP + browser + a salt that changes every day, computed on the server.
// Nothing is stored on the device, so no cookie banner is needed for this. A visitor can't be followed across days,
// except paying students, whose events carry a hash of their own assessment id.
import { sql, hash } from './report-store.mjs';
import { cleanBatch, parseAgent, isBot } from './analytics-core.mjs';

let ready;
export function initEvents() {
  return ready ??= (async () => {
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_events (
      id bigserial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), visitor text NOT NULL, account text,
      session text NOT NULL, event text NOT NULL, page text NOT NULL, props jsonb NOT NULL DEFAULT '{}',
      device text, os text, browser text)`);
    await sql().query('CREATE INDEX IF NOT EXISTS desk_events_ts ON desk_events (ts)');
    await sql().query('CREATE INDEX IF NOT EXISTS desk_events_event_ts ON desk_events (event, ts)');
    await sql().query('CREATE TABLE IF NOT EXISTS desk_event_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, n integer NOT NULL)');
  })().catch(e => { ready = null; throw e; });
}

const daySalt = () => hash((process.env.ANALYTICS_SALT || process.env.DATABASE_URL || 'the-desk') + ':' + new Date().toISOString().slice(0, 10));
export const RETENTION_DAYS = 400; // about 13 months

export async function recordEvents(req, body) {
  const ua = String(req.headers['user-agent'] || '');
  if (isBot(ua)) return 0;
  const rows = cleanBatch(body); if (!rows.length) return 0;
  await initEvents();
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const visitor = hash(daySalt() + ip + ua).slice(0, 20);
  // At most 400 events per visitor per hour.
  const ok = await sql().query(`INSERT INTO desk_event_limits(key, window_start, n) VALUES($1, date_trunc('hour', now()), $2)
    ON CONFLICT(key) DO UPDATE SET window_start=EXCLUDED.window_start, n=CASE WHEN desk_event_limits.window_start=EXCLUDED.window_start THEN desk_event_limits.n+$2 ELSE $2 END
    WHERE desk_event_limits.window_start<>EXCLUDED.window_start OR desk_event_limits.n < 400 RETURNING n`, [visitor, rows.length]);
  if (!ok.length) return 0;
  const account = /^[a-f0-9]{48}$/.test(body.aid || '') ? hash('acct:' + body.aid).slice(0, 20) : null;
  const { device, os, browser } = parseAgent(ua, body.touch === true);
  const params = [], values = [];
  rows.forEach((r, i) => {
    const b = i * 9;
    values.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6}::jsonb,$${b + 7},$${b + 8},$${b + 9})`);
    params.push(visitor, account, r.session, r.event, r.page, JSON.stringify(r.props), device, os, browser);
  });
  await sql().query(`INSERT INTO desk_events(visitor, account, session, event, page, props, device, os, browser) VALUES ${values.join(',')}`, params);
  // Occasionally clear out old events and stale rate-limit rows.
  if (Math.random() < 0.01) {
    await sql().query(`DELETE FROM desk_events WHERE ts < now() - interval '${RETENTION_DAYS} days'`);
    await sql().query(`DELETE FROM desk_event_limits WHERE window_start < now() - interval '1 day'`);
  }
  return rows.length;
}

// ---------- Reports for the admin page ----------
const safe = async q => { try { return await q(); } catch (e) { console.warn('analytics report part failed', e.message); return null; } };
const by = (key, event, days, limit = 15) => sql().query(
  `SELECT COALESCE(props->>'${key}', '(none)') AS k, count(*)::int AS n FROM desk_events WHERE event=$1 AND ts > now() - $2::int * interval '1 day' GROUP BY 1 ORDER BY 2 DESC LIMIT ${limit}`, [event, days]);

export async function report(days) {
  await initEvents();
  const D = [days];
  const W = `ts > now() - $1::int * interval '1 day'`;
  const out = { days, generatedAt: new Date().toISOString() };
  out.daily = await safe(() => sql().query(`SELECT to_char(date_trunc('day', ts), 'YYYY-MM-DD') AS d, count(DISTINCT visitor)::int AS visitors,
      count(*) FILTER (WHERE event='page_view')::int AS views, count(DISTINCT session) FILTER (WHERE event='ip_start')::int AS interviews,
      count(*) FILTER (WHERE event='ip_answer')::int AS answers FROM desk_events WHERE ${W} GROUP BY 1 ORDER BY 1`, D));
  out.totals = await safe(async () => (await sql().query(`SELECT count(DISTINCT visitor || to_char(ts, 'YYYY-MM-DD'))::int AS "visitorDays",
      count(*) FILTER (WHERE event='page_view')::int AS views, count(DISTINCT account)::int AS accounts,
      count(*) FILTER (WHERE event='ip_answer')::int AS answers FROM desk_events WHERE ${W}`, D))[0]);
  out.pages = await safe(() => sql().query(`SELECT page AS k, count(*)::int AS n, count(DISTINCT visitor)::int AS visitors FROM desk_events WHERE event='page_view' AND ${W} GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, D));
  out.referrers = await safe(() => by('ref', 'page_view', days));
  out.campaigns = await safe(() => sql().query(`SELECT COALESCE(props->>'utm_source','(none)') || ' / ' || COALESCE(props->>'utm_campaign','') AS k, count(DISTINCT visitor)::int AS n FROM desk_events WHERE event='page_view' AND props ? 'utm_source' AND ${W} GROUP BY 1 ORDER BY 2 DESC LIMIT 15`, D));
  out.devices = await safe(() => sql().query(`SELECT device || ' · ' || os || ' · ' || browser AS k, count(DISTINCT visitor)::int AS n FROM desk_events WHERE event='page_view' AND ${W} GROUP BY 1 ORDER BY 2 DESC LIMIT 15`, D));
  // Interview practice funnel: sessions (page loads) that reached each step.
  out.funnel = await safe(async () => (await sql().query(`SELECT
      count(DISTINCT session) FILTER (WHERE event='ip_view')::int AS "Opened interview practice",
      count(DISTINCT session) FILTER (WHERE event='ip_check')::int AS "Ran the device check",
      count(DISTINCT session) FILTER (WHERE event='ip_check' AND props->>'mic'='ok')::int AS "Check passed (mic heard)",
      count(DISTINCT session) FILTER (WHERE event='ip_start')::int AS "Started an interview",
      count(DISTINCT session) FILTER (WHERE event='ip_answer')::int AS "Gave an answer",
      count(DISTINCT session) FILTER (WHERE event='ip_feedback')::int AS "Viewed feedback",
      count(DISTINCT session) FILTER (WHERE event='ip_complete')::int AS "Finished all questions",
      count(DISTINCT session) FILTER (WHERE event='ip_cta')::int AS "Clicked mock interview / Full Cycle"
      FROM desk_events WHERE ${W}`, D))[0]);
  // Does the camera, mic and transcription work on each kind of device?
  out.deviceChecks = await safe(() => sql().query(`SELECT device || ' · ' || os || ' · ' || browser AS k, count(*)::int AS checks,
      count(*) FILTER (WHERE props->>'cam'='ok')::int AS cam, count(*) FILTER (WHERE props->>'mic'='ok')::int AS mic,
      count(*) FILTER (WHERE props->>'words'='true')::int AS words FROM desk_events WHERE event='ip_check' AND ${W} GROUP BY 1 ORDER BY 2 DESC LIMIT 15`, D));
  out.transcription = await safe(() => sql().query(`SELECT device || ' · ' || os || ' · ' || browser AS k, count(*)::int AS answers,
      count(*) FILTER (WHERE props->>'typed'='true')::int AS typed, count(*) FILTER (WHERE props->>'transcribed'='true')::int AS transcribed,
      round(avg((props->>'words')::numeric))::int AS "avgWords" FROM desk_events WHERE event='ip_answer' AND ${W} GROUP BY 1 ORDER BY 2 DESC LIMIT 15`, D));
  out.serverTranscription = await safe(async () => (await sql().query(`SELECT count(*)::int AS tries, count(*) FILTER (WHERE props->>'ok'='true')::int AS ok FROM desk_events WHERE event='ip_stt' AND ${W}`, D))[0]);
  out.choices = {
    mode: await safe(() => by('mode', 'ip_start', days)), firm: await safe(() => by('firm', 'ip_start', days, 20)),
    division: await safe(() => by('division', 'ip_start', days)), guide: await safe(() => by('guide', 'ip_start', days)),
    pushback: await safe(() => by('pushback', 'ip_start', days)), followupSource: await safe(() => by('source', 'ip_followup', days))
  };
  out.feedback = await safe(() => sql().query(`SELECT props->>'qtype' AS k, count(*)::int AS n, round(avg((props->>'overall')::numeric), 1)::float AS avg,
      count(*) FILTER (WHERE props->>'kind'='full')::int AS full FROM desk_events WHERE event='ip_feedback' AND ${W} GROUP BY 1 ORDER BY 2 DESC`, D));
  out.calls = await safe(() => sql().query(`SELECT props->>'where' AS k, count(*)::int AS n FROM desk_events WHERE event='call_click' AND ${W} GROUP BY 1 ORDER BY 2 DESC`, D));
  out.clicks = await safe(() => sql().query(`SELECT page || ' · ' || (props->>'id') AS k, count(*)::int AS n FROM desk_events WHERE event='click' AND ${W} GROUP BY 1 ORDER BY 2 DESC LIMIT 25`, D));
  out.errors = await safe(() => sql().query(`SELECT props->>'msg' AS k, count(*)::int AS n, string_agg(DISTINCT browser, ', ') AS browsers, to_char(max(ts), 'YYYY-MM-DD HH24:MI') AS last
      FROM desk_events WHERE event='error' AND ${W} GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, D));
  // Students who came back on another day (only known for students with an assessment).
  out.returning = await safe(async () => (await sql().query(`SELECT count(*)::int AS accounts, count(*) FILTER (WHERE days > 1)::int AS returned FROM
      (SELECT account, count(DISTINCT date_trunc('day', ts)) AS days FROM desk_events WHERE account IS NOT NULL AND ${W} GROUP BY 1) a`, D))[0]);
  // Money comes from the assessments table itself, not from tracking, so it is exact.
  out.sales = await safe(async () => {
   await sql().query('ALTER TABLE desk_assessments ADD COLUMN IF NOT EXISTS paid_amount integer, ADD COLUMN IF NOT EXISTS promo_code text');
   return {
    revenuePence: (await sql().query(`SELECT COALESCE(sum(COALESCE(paid_amount, 7900)), 0)::int AS p FROM desk_assessments WHERE paid_at > now() - $1::int * interval '1 day'`, D))[0].p,
    byCode: await sql().query(`SELECT COALESCE(promo_code, '(no code)') AS k, count(*)::int AS n, COALESCE(sum(COALESCE(paid_amount, 7900)), 0)::int AS pence FROM desk_assessments WHERE paid_at > now() - $1::int * interval '1 day' GROUP BY 1 ORDER BY 2 DESC LIMIT 30`, D),
    daily: await sql().query(`SELECT to_char(d, 'YYYY-MM-DD') AS d,
        (SELECT count(*) FROM desk_assessments WHERE root_id IS NULL AND date_trunc('day', created_at)=d)::int AS assessments,
        (SELECT count(*) FROM desk_assessments WHERE stripe_session IS NOT NULL AND date_trunc('day', created_at)=d)::int AS checkouts,
        (SELECT count(*) FROM desk_assessments WHERE date_trunc('day', paid_at)=d)::int AS paid,
        (SELECT count(*) FROM desk_assessments WHERE date_trunc('day', refunded_at)=d)::int AS refunded
        FROM generate_series(date_trunc('day', now()) - ($1::int - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') d ORDER BY d`, D),
    totals: (await sql().query(`SELECT count(*) FILTER (WHERE root_id IS NULL AND created_at > now() - $1::int * interval '1 day')::int AS assessments,
        count(*) FILTER (WHERE stripe_session IS NOT NULL AND created_at > now() - $1::int * interval '1 day')::int AS checkouts,
        count(*) FILTER (WHERE paid_at > now() - $1::int * interval '1 day')::int AS paid,
        count(*) FILTER (WHERE refunded_at > now() - $1::int * interval '1 day')::int AS refunded,
        count(*) FILTER (WHERE root_id IS NOT NULL AND created_at > now() - $1::int * interval '1 day')::int AS rechecks FROM desk_assessments`, D))[0]
  }; });
  // Email step and deadline alerts (exact, from the database).
  out.emails = await safe(async () => {
    const has = (await sql().query(`SELECT to_regclass('desk_result_unlocks') IS NOT NULL AS u, to_regclass('desk_alert_prefs') IS NOT NULL AS p`))[0];
    if (!has.u) return null;
    const r = (await sql().query(`SELECT
      (SELECT count(*) FROM desk_assessments WHERE root_id IS NULL AND created_at > now() - $1::int * interval '1 day')::int AS assessments,
      (SELECT count(*) FROM desk_result_unlocks WHERE created_at > now() - $1::int * interval '1 day')::int AS "emailsGiven",
      (SELECT count(*) FROM desk_accounts WHERE verified_at IS NOT NULL)::int AS "verifiedTotal",
      (SELECT count(*) FROM desk_accounts)::int AS "accountsTotal"`, D))[0];
    if (has.p) Object.assign(r, (await sql().query(`SELECT count(*) FILTER (WHERE p.enabled)::int AS "alertsOn", count(*) FILTER (WHERE p.enabled AND a.verified_at IS NOT NULL)::int AS "alertsLive" FROM desk_alert_prefs p JOIN desk_accounts a ON a.id=p.account_id`))[0]);
    r.gate = (await sql().query(`SELECT count(DISTINCT session) FILTER (WHERE props->>'action'='shown')::int AS shown, count(DISTINCT session) FILTER (WHERE props->>'action'='submitted')::int AS submitted, count(*) FILTER (WHERE props->>'action'='submitted' AND props->>'alerts'='true')::int AS "withAlerts" FROM desk_events WHERE event='result_gate' AND ${W}`, D))[0];
    return r;
  });
  // Accounts and saved work.
  out.accounts = await safe(async () => {
    const has = (await sql().query(`SELECT to_regclass('desk_accounts') IS NOT NULL AS a, to_regclass('desk_items') IS NOT NULL AS i`))[0];
    if (!has.a) return null;
    const a = (await sql().query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE created_at > now() - $1::int * interval '1 day')::int AS new, count(*) FILTER (WHERE last_seen_at > now() - interval '7 days')::int AS "activeWeek" FROM desk_accounts`, D))[0];
    const items = has.i ? await sql().query(`SELECT kind AS k, count(*)::int AS n, count(DISTINCT account_id)::int AS students FROM desk_items WHERE created_at > now() - $1::int * interval '1 day' GROUP BY 1 ORDER BY 1`, D) : [];
    return { ...a, items };
  });
  return out;
}
