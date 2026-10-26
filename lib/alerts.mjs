// The Desk · weekly deadline alerts for students who asked for them (double opt-in: only verified emails get them).
import { randomBytes } from 'node:crypto';
import { sql } from './report-store.mjs';
import { initAccounts } from './accounts.mjs';
import { TYPES } from './programmes.mjs';
import { CONSENT_VERSION,validateAlertPrefs } from './alerts-core.mjs';
export { CONSENT_VERSION, typeFromProgramme, matchFirm, buildDigest, digestEmail } from './alerts-core.mjs';

export async function getPrefs(accountId) {
  await initAccounts();
  return (await sql().query('SELECT enabled, firms, types, consent_at AS "consentAt", last_sent_at AS "lastSentAt", unsubscribe_token AS "unsubscribeToken" FROM desk_alert_prefs WHERE account_id=$1', [accountId]))[0] || null;
}
// Saves preferences. Turning alerts on records consent; firms and types are checked against the tracker.
export async function setPrefs(accountId, { enabled, firms, types }, allFirms) {
  await initAccounts();
  ({enabled,firms,types}=validateAlertPrefs({enabled,firms,types},allFirms,TYPES));
  const cleanFirms = [...new Set((Array.isArray(firms) ? firms : []).map(f => allFirms.includes(f) ? f : null).filter(Boolean))].slice(0, 60);
  const cleanTypes = [...new Set((Array.isArray(types) ? types : []).filter(t => TYPES.includes(t)))];
  const rows = await sql().query(`INSERT INTO desk_alert_prefs(account_id, enabled, firms, types, consent_at, consent_version, unsubscribe_token)
    VALUES($1, $2, $3::jsonb, $4::jsonb, CASE WHEN $2 THEN now() END, CASE WHEN $2 THEN $5 END, $6)
    ON CONFLICT(account_id) DO UPDATE SET enabled=EXCLUDED.enabled, firms=EXCLUDED.firms, types=EXCLUDED.types, updated_at=now(),
      consent_at=CASE WHEN EXCLUDED.enabled AND NOT desk_alert_prefs.enabled THEN now() ELSE desk_alert_prefs.consent_at END,
      consent_version=CASE WHEN EXCLUDED.enabled AND NOT desk_alert_prefs.enabled THEN $5 ELSE desk_alert_prefs.consent_version END
    RETURNING enabled, firms, types`, [accountId, enabled === true, JSON.stringify(cleanFirms), JSON.stringify(cleanTypes), CONSENT_VERSION, randomBytes(24).toString('hex')]);
  return rows[0];
}
export async function unsubscribe(token) {
  if (!/^[a-f0-9]{48}$/.test(token || '')) return false;
  await initAccounts();
  return (await sql().query('UPDATE desk_alert_prefs SET enabled=false, updated_at=now() WHERE unsubscribe_token=$1 RETURNING account_id', [token])).length > 0;
}

