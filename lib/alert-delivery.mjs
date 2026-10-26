import {randomBytes} from 'node:crypto';
import {sql} from './report-store.mjs';
import {initAccounts} from './accounts.mjs';
import {loadProgrammes} from './programmes.mjs';
import {buildDigest,digestEmail} from './alerts-core.mjs';
import {emailReady,sendBatch} from './email.mjs';

// Persist the exact provider request before sending. A global lease prevents overlapping
// cron invocations, and stable provider keys cover a crash after delivery but before SQL acknowledgement.
export async function runWeekly(origin){
 if(process.env.EMAIL_ALERTS_ENABLED!=='true'||!emailReady())return {sent:0,skipped:'alerts not enabled or email not configured'};
 await initAccounts();
 await sql().query('CREATE TABLE IF NOT EXISTS desk_alert_job (id text PRIMARY KEY, token text, until_at timestamptz)');
 await sql().query(`CREATE TABLE IF NOT EXISTS desk_alert_outbox (id text PRIMARY KEY, week text NOT NULL, account_ids jsonb NOT NULL, messages jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, cancelled_at timestamptz)`);
 const token=randomBytes(16).toString('hex');
 const lease=await sql().query(`INSERT INTO desk_alert_job(id,token,until_at) VALUES('weekly',$1,now()+interval '8 minutes') ON CONFLICT(id) DO UPDATE SET token=$1,until_at=now()+interval '8 minutes' WHERE desk_alert_job.until_at<now() RETURNING id`,[token]);
 if(!lease.length)return {sent:0,skipped:'another run is active'};
 let sent=0,empty=0,failed=0,stale=0;
 try{
  const date=new Date();const monday=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);const week=monday.toISOString().slice(0,10);
  const deliver=async batch=>{
   // Provider keys last 24h. Older unacknowledged sends need reconciliation, not a blind retry.
   if(Date.now()-new Date(batch.created_at).getTime()>23*3600000){stale++;return;}
   const opted=await sql().query('SELECT p.account_id FROM desk_alert_prefs p JOIN desk_accounts a ON a.id=p.account_id WHERE p.account_id=ANY($1::text[]) AND p.enabled AND a.verified_at IS NOT NULL',[batch.account_ids]);
   if(opted.length!==batch.account_ids.length){await sql().query('UPDATE desk_alert_outbox SET cancelled_at=now() WHERE id=$1',[batch.id]);return;}
   try{
    const result=await sendBatch(batch.messages,'desk-alerts/'+batch.id);
    if(!Array.isArray(result.data)||result.data.length!==batch.messages.length||result.data.some(x=>!x?.id))throw Error('Incomplete provider acknowledgement');
    await sql().query(`WITH done AS (UPDATE desk_alert_outbox SET sent_at=now() WHERE id=$1 AND sent_at IS NULL RETURNING account_ids) UPDATE desk_alert_prefs SET last_sent_at=now() WHERE account_id IN (SELECT jsonb_array_elements_text(account_ids) FROM done)`,[batch.id]);
    sent+=batch.messages.length;
   }catch{failed+=batch.messages.length;}
  };
  const pending=await sql().query('SELECT * FROM desk_alert_outbox WHERE week=$1 AND sent_at IS NULL AND cancelled_at IS NULL ORDER BY created_at',[week]);
  for(const batch of pending)await deliver(batch);
  const data=await loadProgrammes();
  const rows=await sql().query(`SELECT p.account_id,p.firms,p.types,p.last_sent_at,p.unsubscribe_token,a.email FROM desk_alert_prefs p JOIN desk_accounts a ON a.id=p.account_id WHERE p.enabled AND a.verified_at IS NOT NULL AND (p.last_sent_at IS NULL OR p.last_sent_at<now()-interval '5 days') AND NOT EXISTS(SELECT 1 FROM desk_alert_outbox o WHERE o.week=$1 AND o.cancelled_at IS NULL AND o.account_ids ? p.account_id) ORDER BY p.account_id LIMIT 500`,[week]);
  for(let at=0;at<rows.length;at+=100){
   const messages=[],ids=[];
   for(const row of rows.slice(at,at+100)){
    const digest=buildDigest(row,data,{since:row.last_sent_at});if(digest.empty){empty++;continue;}
    const unsub=origin+'/unsubscribe.html?u='+row.unsubscribe_token;
    const body=digestEmail(digest,data,{origin,unsubscribeUrl:unsub,firms:row.firms});
    messages.push({to:row.email,subject:digest.subject,...body,headers:{'List-Unsubscribe':'<'+origin+'/api/alerts?u='+row.unsubscribe_token+'>','List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}});ids.push(row.account_id);
   }
   if(!messages.length)continue;
   const id=randomBytes(16).toString('hex');
   const [batch]=await sql().query('INSERT INTO desk_alert_outbox(id,week,account_ids,messages) VALUES($1,$2,$3::jsonb,$4::jsonb) RETURNING *',[id,week,JSON.stringify(ids),JSON.stringify(messages)]);
   await deliver(batch);
  }
  // Outbox contents contain email addresses; retain only a short reconciliation window.
  await sql().query("DELETE FROM desk_alert_outbox WHERE created_at<now()-interval '30 days' AND (sent_at IS NOT NULL OR cancelled_at IS NOT NULL)");
  return {sent,empty,failed,staleBatches:stale};
 }finally{await sql().query("UPDATE desk_alert_job SET until_at=now() WHERE id='weekly' AND token=$1",[token]);}
}
