import {sql} from './report-store.mjs';
import {createHash} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
import {TESTER_CODE} from './tester-code-config.mjs';
let ready;
export function initMemberships(){return ready??=(async()=>{
 await sql().query(`CREATE TABLE IF NOT EXISTS desk_account_memberships(source text PRIMARY KEY,account_id text NOT NULL,kind text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),until timestamptz NOT NULL,stripe_intent text,revoked_at timestamptz)`);
 await sql().query(`CREATE TABLE IF NOT EXISTS desk_member_codes(code_hash text PRIMARY KEY,expires_at timestamptz NOT NULL,max_uses integer NOT NULL,used integer NOT NULL DEFAULT 0)`);
 await sql().query(`CREATE TABLE IF NOT EXISTS desk_membership_checkouts(session_id text PRIMARY KEY,account_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`);
})().catch(e=>{ready=null;throw e;});}
export async function accountMembership(accountId){await initMemberships();const rows=await sql().query(`SELECT until,kind FROM desk_account_memberships WHERE account_id=$1 AND revoked_at IS NULL AND until>now() AND (kind<>'tester' OR $2::boolean) ORDER BY until DESC LIMIT 1`,[accountId,process.env.VERCEL_ENV==='preview']);return rows[0]?{active:true,until:rows[0].until,source:rows[0].kind}:{active:false};}
export function validTesterCode(value){return process.env.VERCEL_ENV==='preview'&&typeof value==='string'&&value.length<=80&&hash(value.trim().toUpperCase())===TESTER_CODE.hash&&Date.now()<Date.parse(TESTER_CODE.expires);}
export async function redeemTesterCode(accountId,value){
 if(!validTesterCode(value))return false;await initMemberships();
 await sql().query('INSERT INTO desk_member_codes(code_hash,expires_at,max_uses) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[TESTER_CODE.hash,TESTER_CODE.expires,TESTER_CODE.maxUses]);
 const source='tester:'+TESTER_CODE.hash+':'+accountId;
 const rows=await sql().query(`WITH slot AS (UPDATE desk_member_codes SET used=used+1 WHERE code_hash=$1 AND expires_at>now() AND used<max_uses AND NOT EXISTS(SELECT 1 FROM desk_account_memberships WHERE source=$3) RETURNING code_hash) INSERT INTO desk_account_memberships(source,account_id,kind,until) SELECT $3,$2,'tester',now()+interval '365 days' FROM slot ON CONFLICT DO NOTHING RETURNING source`,[TESTER_CODE.hash,accountId,source]);
 return rows.length>0;
}
export async function recordMembershipAccess(record){
 if(!record?.id)return false;await initMemberships();
 const rows=await sql().query(`SELECT 1 FROM desk_account_memberships m JOIN desk_account_assessments a ON a.account_id=m.account_id WHERE a.assessment_id=$1 AND m.revoked_at IS NULL AND m.until>now() AND (m.kind<>'tester' OR $2::boolean) LIMIT 1`,[record.id,process.env.VERCEL_ENV==='preview']);return rows.length>0;
}
export async function grantAccountPayment(session){
 if(session.metadata?.membershipKind!=='account'||session.payment_status!=='paid'||session.status!=='complete'||session.currency!=='gbp'||session.amount_total!==8900||session.metadata?.productVersion!=='membership-89-v1'||session.client_reference_id!==session.metadata?.accountId)return false;
 await initMemberships();const rows=await sql().query(`INSERT INTO desk_account_memberships(source,account_id,kind,until,stripe_intent) SELECT $1,account_id,'payment',now()+interval '365 days',$2 FROM desk_membership_checkouts WHERE session_id=$1 AND account_id=$3 ON CONFLICT(source) DO NOTHING RETURNING source`,[session.id,typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id,session.metadata.accountId]);
 if(rows.length)return true;return !!(await sql().query('SELECT 1 FROM desk_account_memberships WHERE source=$1 AND revoked_at IS NULL',[session.id]))[0];
}
