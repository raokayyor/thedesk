import {createHash} from 'node:crypto';
import {sql} from './report-store.mjs';
import {sendEmail,emailLayout,escHtml} from './email.mjs';
export function renewalMessage(until,origin='https://thedesk.vercel.app'){
 const date=new Date(until).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'}),subject='Your Desk access ends on '+date,link=new URL('/membership-start.html?renew=1',origin).href;
 return {subject,text:subject+'.\nRenew for another year → '+link+'\n£89 for the year. One payment · 12 months’ access · no auto-renewal. Renewal is your choice; you will not be charged automatically.',html:emailLayout('<h1>'+escHtml(subject)+'</h1><p><a href="'+escHtml(link)+'">Renew for another year →</a></p><p>£89 for the year · 12 months’ access · no auto-renewal.</p><p>Renewal is your choice. You will not be charged automatically.</p>')};
}
export function membershipRenewalSender(query,send){return async function(origin){
 await query(`CREATE TABLE IF NOT EXISTS desk_membership_renewal_mail(account_id text NOT NULL,until timestamptz NOT NULL,sent_at timestamptz,lease_until timestamptz,PRIMARY KEY(account_id,until))`);
 const rows=await query(`WITH access AS (SELECT account_id,until FROM desk_account_memberships WHERE kind='payment' AND revoked_at IS NULL UNION ALL SELECT a.account_id,d.paid_at+interval '365 days' FROM desk_account_assessments a JOIN desk_assessments d ON d.id=a.assessment_id WHERE d.paid_at IS NOT NULL AND d.refunded_at IS NULL AND NOT EXISTS(SELECT 1 FROM desk_account_memberships m WHERE m.source=d.stripe_session)),latest AS (SELECT account_id,max(until) AS until FROM access GROUP BY account_id) SELECT a.id AS account_id,a.email,l.until FROM latest l JOIN desk_accounts a ON a.id=l.account_id WHERE l.until>now() AND l.until<=now()+interval '14 days' AND a.email NOT LIKE '%@access.thedesk.invalid' AND NOT EXISTS(SELECT 1 FROM desk_membership_renewal_mail j WHERE j.account_id=a.id AND j.until=l.until AND j.sent_at IS NOT NULL) ORDER BY l.until LIMIT 20`);
 let sent=0;
 for(const row of rows){
 const args=[row.account_id,row.until],claimed=await query(`INSERT INTO desk_membership_renewal_mail(account_id,until,lease_until) VALUES($1,$2,now()+interval '20 minutes') ON CONFLICT(account_id,until) DO UPDATE SET lease_until=EXCLUDED.lease_until WHERE desk_membership_renewal_mail.sent_at IS NULL AND (desk_membership_renewal_mail.lease_until IS NULL OR desk_membership_renewal_mail.lease_until<now()) RETURNING account_id`,args);if(!claimed.length)continue;
 try{const key=createHash('sha256').update(row.account_id+'|'+new Date(row.until).toISOString()).digest('hex');await send({to:row.email,...renewalMessage(row.until,origin),idempotencyKey:'membership-expiry-'+key});await query('UPDATE desk_membership_renewal_mail SET sent_at=now(),lease_until=NULL WHERE account_id=$1 AND until=$2',args);sent++;}
 catch{await query('UPDATE desk_membership_renewal_mail SET lease_until=NULL WHERE account_id=$1 AND until=$2',args);}
 }return sent;
 };}
export const sendMembershipRenewals=origin=>membershipRenewalSender(sql().query.bind(sql()),sendEmail)(origin);
