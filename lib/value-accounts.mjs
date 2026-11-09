// Value-pack adapter: retain the site's existing account/session/payment schema.
import { sql, hash, owner, initStore } from './report-store.mjs';
import * as accounts from './accounts.mjs';
export const currentAccount = accounts.currentAccount;
export const clientKey = req => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
let ready;
async function init() {
  return ready ??= (async()=>{
    await initStore();
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_value_items (id bigserial PRIMARY KEY, principal text NOT NULL, kind text NOT NULL, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);
    await sql().query(`CREATE INDEX IF NOT EXISTS desk_value_items_principal ON desk_value_items(principal, created_at DESC)`);
    await sql().query(`CREATE TABLE IF NOT EXISTS desk_value_quota (key text NOT NULL, day date NOT NULL, n integer NOT NULL, PRIMARY KEY(key,day))`);
  })().catch(e=>{ready=null;throw e});
}
export async function principal(req,res) {
  const account=await currentAccount(req);
  const guest=owner(req,res,true);
  if(!account)return 'guest:'+guest;
  await init();
  await accounts.initAccounts();
  const saved=await sql().query('SELECT id FROM desk_assessments WHERE owner_hash=$1',[guest]);
  for(const assessment of saved)await accounts.linkAssessment(account.id,assessment.id);
  // A browser can attach its anonymous practice to the authenticated account.
  await sql().query('UPDATE desk_value_items SET principal=$1 WHERE principal=$2',['account:'+account.id,'guest:'+guest]);
  return 'account:'+account.id;
}
export async function useQuota(key,limit) {
  await init();
  return (await sql().query(`INSERT INTO desk_value_quota(key,day,n) VALUES($1,current_date,1) ON CONFLICT(key,day) DO UPDATE SET n=desk_value_quota.n+1 WHERE desk_value_quota.n<$2 RETURNING n`,[hash(key),limit])).length>0;
}
export async function quotaLeft(key,limit) {
  await init();const r=await sql().query('SELECT n FROM desk_value_quota WHERE key=$1 AND day=current_date',[hash(key)]);
  return Math.max(0,limit-(r[0]?.n||0));
}
export async function isPaidOwner(p) {
  if(!p)return false;
  if(p.startsWith('account:'))return (await accounts.entitlement(p.slice(8))).active;
  await initStore();
  return !!(await sql().query(`SELECT 1 FROM desk_assessments WHERE owner_hash=$1 AND paid_at>now()-interval '365 days' AND refunded_at IS NULL LIMIT 1`,[p.slice(6)]))[0];
}
export async function ownerSummary(p) {
  await init();
  const accountId=p?.startsWith('account:')?p.slice(8):null;
  if(accountId)await accounts.initAccounts();
  const assessments=accountId
    ?await sql().query(`SELECT d.id,d.created_at AS "createdAt",d.paid_at AS "paidAt",d.refunded_at AS "refundedAt",d.root_id AS "rootId",d.result->>'targetFirm' AS firm,d.result->>'overallScore' AS overall,d.input->'profile'->>'targetSector' AS route FROM desk_assessments d JOIN desk_account_assessments a ON a.assessment_id=d.id WHERE a.account_id=$1 ORDER BY d.created_at DESC LIMIT 30`,[accountId])
    :await sql().query(`SELECT id,created_at AS "createdAt",paid_at AS "paidAt",refunded_at AS "refundedAt",root_id AS "rootId",result->>'targetFirm' AS firm,result->>'overallScore' AS overall,input->'profile'->>'targetSector' AS route FROM desk_assessments WHERE owner_hash=$1 ORDER BY created_at DESC LIMIT 30`,[p?.slice(6)||'']);
  const items=await sql().query(`SELECT id::text,kind,data,created_at AS "createdAt" FROM desk_value_items WHERE principal=$1 ORDER BY created_at DESC LIMIT 60`,[p]);
  return {assessments,items,paid:await isPaidOwner(p)};
}
export async function countItems(p,kind,days) {
  if(!p)return 0;await init();
  return (await sql().query(`SELECT count(*)::int AS n FROM desk_value_items WHERE principal=$1 AND kind=$2 AND created_at>now()-($3::int*interval '1 day')`,[p,kind,days]))[0].n;
}
export async function saveItem(p,kind,data) {
  if(!p)return null;await init();
  return String((await sql().query('INSERT INTO desk_value_items(principal,kind,data) VALUES($1,$2,$3::jsonb) RETURNING id',[p,kind,JSON.stringify(data)]))[0].id);
}
export async function deleteItem(p,id) {
  if(!p||!/^\d{1,18}$/.test(String(id)))return false;await init();
  return (await sql().query('DELETE FROM desk_value_items WHERE principal=$1 AND id=$2 RETURNING id',[p,String(id)])).length>0;
}
