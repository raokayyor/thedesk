// The Desk · student accounts.
// One account per email. Buying Full Cycle creates the account from the Stripe email and signs that device in.
// Other devices sign in with a one-time email link (Resend), or a link staff generate when email isn't connected.
// Access to paid features lasts 12 months from the most recent non-refunded Full Cycle payment linked to the account.
import { randomBytes } from 'node:crypto';
import { sql, hash, initStore } from './report-store.mjs';

export const SESSION_COOKIE = 'desk_session';
export const SESSION_DAYS = 90;
export const LINK_MINUTES = 30;
export const ACCESS_DAYS = 365;
export const ITEM_KINDS = ['interview', 'answer', 'drill'];
const MAX_ITEM_BYTES = 40000;

let ready;
export function initAccounts() {
  return ready ??= (async () => {
    await initStore();
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_accounts (id text PRIMARY KEY, email text UNIQUE NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz)`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_account_assessments (account_id text NOT NULL, assessment_id text NOT NULL,
      linked_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (account_id, assessment_id))`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_login_tokens (token_hash text PRIMARY KEY, email text NOT NULL,
      expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_sessions (token_hash text PRIMARY KEY, account_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL)`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_items (id bigserial PRIMARY KEY, account_id text NOT NULL, kind text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL)`);
    await sql().query('CREATE INDEX IF NOT EXISTS desk_items_account ON desk_items (account_id, kind, created_at DESC)');
    // Email step on the free result: verified emails, links that also save a result, unlocked results, alert preferences.
    await sql().query('ALTER TABLE desk_accounts ADD COLUMN IF NOT EXISTS verified_at timestamptz');
    await sql().query('ALTER TABLE desk_login_tokens ADD COLUMN IF NOT EXISTS assessment_id text, ADD COLUMN IF NOT EXISTS purpose text');
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_result_unlocks (assessment_id text PRIMARY KEY, email text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_alert_prefs (account_id text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false,
      firms jsonb NOT NULL DEFAULT '[]', types jsonb NOT NULL DEFAULT '[]', consent_at timestamptz, consent_version text,
      unsubscribe_token text UNIQUE NOT NULL, last_sent_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now())`);
  })().catch(e => { ready = null; throw e; });
}

export const normEmail = e => typeof e === 'string' ? e.trim().toLowerCase() : '';
export const validEmail = e => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const secure = () => (process.env.VERCEL ? '; Secure' : '');
const cookieOf = (req, name) => String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1) || '';

export async function upsertAccount(email) {
  await initAccounts();
  const e = normEmail(email); if (!validEmail(e)) return null;
  const rows = await sql().query(`INSERT INTO desk_accounts(id, email) VALUES($1, $2) ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email RETURNING id, email`, [randomBytes(12).toString('hex'), e]);
  return rows[0];
}
export async function linkAssessment(accountId, assessmentId) {
  await initAccounts();
  await sql().query('INSERT INTO desk_account_assessments(account_id, assessment_id) VALUES($1, $2) ON CONFLICT DO NOTHING', [accountId, assessmentId]);
}

// ---------- sessions ----------
export async function startSession(res, accountId) {
  await initAccounts();
  const token = randomBytes(32).toString('hex');
  await sql().query(`INSERT INTO desk_sessions(token_hash, account_id, expires_at) VALUES($1, $2, now() + interval '${SESSION_DAYS} days')`, [hash(token), accountId]);
  appendCookie(res, `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure()}`);
}
export async function endSession(req, res) {
  const token = cookieOf(req, SESSION_COOKIE);
  if (/^[a-f0-9]{64}$/.test(token)) { await initAccounts(); await sql().query('DELETE FROM desk_sessions WHERE token_hash=$1', [hash(token)]); }
  appendCookie(res, `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure()}`);
}
function appendCookie(res, c) {
  const prev = res.getHeader && res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : c);
}
// The signed-in account for this request, or null.
export async function currentAccount(req) {
  const token = cookieOf(req, SESSION_COOKIE);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  await initAccounts();
  const rows = await sql().query(`SELECT a.id, a.email FROM desk_sessions s JOIN desk_accounts a ON a.id=s.account_id
    WHERE s.token_hash=$1 AND s.expires_at > now()`, [hash(token)]);
  if (!rows[0]) return null;
  sql().query('UPDATE desk_accounts SET last_seen_at=now() WHERE id=$1', [rows[0].id]).catch(() => { });
  return rows[0];
}

// ---------- access ----------
// Paid access: a linked, non-refunded Full Cycle payment in the last 12 months. Returns the newest such assessment.
export async function entitlement(accountId) {
  await initAccounts();
  const rows = await sql().query(`SELECT d.id, d.paid_at, d.paid_at + interval '${ACCESS_DAYS} days' AS until FROM desk_account_assessments l
    JOIN desk_assessments d ON d.id=l.assessment_id
    WHERE l.account_id=$1 AND d.paid_at IS NOT NULL AND d.refunded_at IS NULL AND d.paid_at > now() - interval '${ACCESS_DAYS} days'
    ORDER BY d.paid_at DESC LIMIT 1`, [accountId]);
  return rows[0] ? { active: true, assessmentId: rows[0].id, until: rows[0].until } : { active: false };
}
// Newest assessment linked to the account (paid first), used as the student's current CV and target.
export async function latestAssessment(accountId) {
  await initAccounts();
  const rows = await sql().query(`SELECT d.* FROM desk_account_assessments l JOIN desk_assessments d ON d.id=l.assessment_id
    WHERE l.account_id=$1 ORDER BY (d.paid_at IS NOT NULL AND d.refunded_at IS NULL) DESC, d.created_at DESC LIMIT 1`, [accountId]);
  return rows[0] || null;
}
export async function accountOwnsAssessment(accountId, assessmentId) {
  await initAccounts();
  return (await sql().query('SELECT 1 FROM desk_account_assessments WHERE account_id=$1 AND assessment_id=$2', [accountId, assessmentId])).length > 0;
}

// ---------- sign-in links ----------
// Confirmation links from the result page last 7 days; plain sign-in links 30 minutes.
export async function createLoginLink(email, origin, { assessmentId = null, purpose = 'signin' } = {}) {
  await initAccounts();
  const token = randomBytes(24).toString('hex');
  const minutes = purpose === 'signin' ? LINK_MINUTES : 7 * 24 * 60;
  await sql().query(`INSERT INTO desk_login_tokens(token_hash, email, expires_at, assessment_id, purpose) VALUES($1, $2, now() + interval '${minutes} minutes', $3, $4)`, [hash(token), normEmail(email), assessmentId, purpose]);
  return `${origin}/signin.html?token=${token}`;
}
// Single use. Creates the account if it doesn't exist (a free account), marks the email verified,
// saves the result the link was sent for, and confirms deadline alerts if they were asked for.
export async function redeemLoginToken(token) {
  if (!/^[a-f0-9]{48}$/.test(token || '')) return null;
  await initAccounts();
  const rows = await sql().query('UPDATE desk_login_tokens SET used_at=now() WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now() RETURNING email, assessment_id, purpose', [hash(token)]);
  if (!rows[0]) return null;
  const account = await upsertAccount(rows[0].email);
  if (!account) return null;
  await markVerified(account.id);
  if (rows[0].assessment_id) await linkAssessment(account.id, rows[0].assessment_id);
  // The student ticked "send me deadline alerts" on a result saved to an existing account: switch them on now they've confirmed.
  if (String(rows[0].purpose || '').endsWith('+alerts')) await enableDefaultAlerts(account.id, rows[0].assessment_id);
  return account;
}
export async function markVerified(accountId) {
  await initAccounts();
  await sql().query('UPDATE desk_accounts SET verified_at=COALESCE(verified_at, now()) WHERE id=$1', [accountId]);
}
export async function accountByEmail(email) {
  await initAccounts();
  return (await sql().query('SELECT id, email, verified_at FROM desk_accounts WHERE email=$1', [normEmail(email)]))[0] || null;
}
export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
const LINK_COPY = {
  signin: { subject: 'Your sign-in link for The Desk', lead: 'Sign in to The Desk:', button: 'Sign in', expiry: `The link works once and expires in ${LINK_MINUTES} minutes.` },
  confirm: { subject: 'Confirm your email to keep your result', lead: 'Thanks for taking The Desk assessment. Confirm your email to keep your result in your free account and open it on any device.', button: 'Confirm my email', expiry: 'The link works once and expires in 7 days.' },
  claim: { subject: 'Add your new result to your account', lead: 'You took The Desk assessment again with this email. Click to add the new result to your account.', button: 'Add it to my account', expiry: 'The link works once and expires in 7 days.' }
};
export async function sendLoginEmail(email, link, purpose = 'signin') {
  const c = LINK_COPY[String(purpose).replace('+alerts', '')] || LINK_COPY.signin;
  const { sendEmail, emailLayout } = await import('./email.mjs');
  await sendEmail({ to: email, subject: c.subject,
    text: `${c.lead}\n\n${link}\n\n${c.expiry} If you didn't ask for this, ignore this email.`,
    html: emailLayout(`<p>${c.lead}</p><p><a href="${link}" style="display:inline-block;background:#d9480f;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">${c.button}</a></p><p style="color:#6b7682;font-size:14px">${c.expiry} If you didn't ask for this, ignore this email.</p>`) });
}
// Simple fixed-window limit (per hour).
export async function allow(key, limit) {
  await sql().query('CREATE TABLE IF NOT EXISTS desk_rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL)');
  const rows = await sql().query(`INSERT INTO desk_rate_limits(key, window_start, attempts) VALUES($1, date_trunc('hour', now()), 1)
    ON CONFLICT(key) DO UPDATE SET window_start=EXCLUDED.window_start, attempts=CASE WHEN desk_rate_limits.window_start=EXCLUDED.window_start THEN desk_rate_limits.attempts+1 ELSE 1 END
    WHERE desk_rate_limits.window_start<>EXCLUDED.window_start OR desk_rate_limits.attempts < $2 RETURNING attempts`, [hash(key), limit]);
  return rows.length > 0;
}

// ---------- saved work ----------
export async function saveItem(accountId, kind, data) {
  if (!ITEM_KINDS.includes(kind)) throw new Error('Invalid item');
  const json = JSON.stringify(data || {});
  if (json.length > MAX_ITEM_BYTES) throw new Error('Item too large');
  await initAccounts();
  // Keep at most 2,000 items per account.
  const rows = await sql().query('INSERT INTO desk_items(account_id, kind, data) VALUES($1, $2, $3::jsonb) RETURNING id, created_at', [accountId, kind, json]);
  if (Math.random() < 0.05) await sql().query(`DELETE FROM desk_items WHERE account_id=$1 AND id NOT IN (SELECT id FROM desk_items WHERE account_id=$1 ORDER BY created_at DESC LIMIT 2000)`, [accountId]);
  return rows[0];
}
export async function listItems(accountId, kind, limit = 200) {
  await initAccounts();
  return sql().query(`SELECT id, kind, created_at AS "createdAt", data FROM desk_items WHERE account_id=$1 AND ($2::text IS NULL OR kind=$2) ORDER BY created_at DESC LIMIT ${Math.max(1, Math.min(500, limit | 0))}`, [accountId, kind || null]);
}
export async function deleteItem(accountId, id) {
  await initAccounts();
  return (await sql().query('DELETE FROM desk_items WHERE account_id=$1 AND id=$2 RETURNING id', [accountId, id])).length > 0;
}

// Daily fair-use limit per account and feature (resets at midnight UTC).
export async function useQuota(accountId, feature, limit) {
  await sql().query('CREATE TABLE IF NOT EXISTS desk_daily_usage (key text NOT NULL, day date NOT NULL, n integer NOT NULL, PRIMARY KEY (key, day))');
  const rows = await sql().query(`INSERT INTO desk_daily_usage(key, day, n) VALUES($1, current_date, 1)
    ON CONFLICT(key, day) DO UPDATE SET n=desk_daily_usage.n+1 WHERE desk_daily_usage.n < $2 RETURNING n`, [feature + ':' + accountId, limit]);
  return rows.length > 0;
}
// The context the AI features work from: the student's current paid assessment (CV, competencies, target).
export async function paidContext(req) {
  const account = await currentAccount(req);
  if (!account) return { error: 401 };
  const access = await entitlement(account.id);
  if (!access.active) return { error: 402, account };
  const row = (await sql().query('SELECT * FROM desk_assessments WHERE id=$1', [access.assessmentId]))[0];
  if (!row) return { error: 402, account };
  const { contextFromReport } = await import('../interview-practice-core.mjs');
  return { account, row, ctx: contextFromReport({ profile: row.input?.profile, result: row.result, report: row.report }, row.input?.cvText) };
}

// ---------- Email step on the free result ----------
export async function resultUnlocked(row) {
  await initAccounts();
  if (row.paid_at) return true;
  const r = await sql().query(`SELECT 1 FROM desk_result_unlocks WHERE assessment_id=$1 UNION ALL SELECT 1 FROM desk_account_assessments WHERE assessment_id=$1 LIMIT 1`, [row.id]);
  return r.length > 0;
}
// Alerts on for the firm and programme type from the student's assessment (they ticked the box).
export async function enableDefaultAlerts(accountId, assessmentId) {
  const { loadProgrammes } = await import('./programmes.mjs');
  const { setPrefs, getPrefs, typeFromProgramme, matchFirm } = await import('./alerts.mjs');
  const data = await loadProgrammes(); const all = [...new Set(data.programmes.map(p => p.firm))];
  const existing = await getPrefs(accountId);
  let firms = existing ? existing.firms : [], types = existing ? existing.types : [];
  if (assessmentId) {
    const row = (await sql().query('SELECT input FROM desk_assessments WHERE id=$1', [assessmentId]))[0];
    const profile = row?.input?.profile || {};
    const f = matchFirm(profile.targetFirm, all); if (f && !firms.includes(f)) firms = [...firms, f];
    if (!types.length) types = typeFromProgramme(profile.programmeType || profile.programme);
  }
  return setPrefs(accountId, { enabled: true, firms, types }, all);
}
// The student gives an email to see their full free result.
// New email → free account, result saved, confirmation email sent; sign-in starts after verification (alerts only start once confirmed).
// Email already has an account → nothing about that account is opened here; we email a link that adds the result to it.
export async function claimResult(req, res, body) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!await allow('claim-ip:' + ip, 20)) return { status: 429, error: 'Too many attempts. Try again in an hour.' };
  if (!emailConfigured()) return { status: 503, error: 'Email sign-in is not available yet. Your assessment remains available in this browser.' };
  const email = normEmail(body.email);
  if (!validEmail(email)) return { status: 400, error: 'Enter a valid email address.' };
  if(!await allow('claim-email:'+email,3))return {status:429,error:'Please check your inbox or retry in an hour.'};
  const { ownedRecord } = await import('./report-store.mjs');
  const row = await ownedRecord(req, res, body.assessmentId);
  if (!row) return { status: 404, error: 'Result not found in this browser.' };
  await initAccounts();
  await sql().query('INSERT INTO desk_result_unlocks(assessment_id, email) VALUES($1, $2) ON CONFLICT(assessment_id) DO UPDATE SET email=EXCLUDED.email', [row.id, email]);
  const alerts = body.alerts === true;
  const origin = new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN || `https://${req.headers.host}`).origin;
  const session = await currentAccount(req).catch(() => null);
  const existing = await accountByEmail(email);
  let created = false, emailSent = false, existingAccount = false;
  if (session && session.email === email) {
    await linkAssessment(session.id, row.id);
    if (alerts) await enableDefaultAlerts(session.id, row.id);
  } else if (!existing) {
    const account = await upsertAccount(email); created = true;
    await linkAssessment(account.id, row.id);
    // A typed email is not proof of ownership. Start a session only after token redemption.
    if (alerts) await enableDefaultAlerts(account.id, row.id);   // only sent once the email is confirmed
    if (emailConfigured()) { await sendLoginEmail(email, await createLoginLink(email, origin, { assessmentId: row.id, purpose: 'confirm' }), 'confirm'); emailSent = true; }
  } else {
    existingAccount = true;
    if (emailConfigured()) { await sendLoginEmail(email, await createLoginLink(email, origin, { assessmentId: row.id, purpose: alerts ? 'claim+alerts' : 'claim' }), 'claim'); emailSent = true; }
  }
  return { success: true, unlocked: true, created, existingAccount, emailSent, alerts };
}
