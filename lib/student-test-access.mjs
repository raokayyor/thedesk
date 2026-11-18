import {createHash,timingSafeEqual} from 'node:crypto';
import {sql} from './report-store.mjs';
import {initMemberships} from './account-memberships.mjs';
import * as invites from './student-test-config.mjs';
const {STUDENT_TEST_INVITE}=invites;
const configurations=()=>[STUDENT_TEST_INVITE,invites.CYDNEY_INVITE].filter(Boolean);
export function studentTestDigest(code,now=Date.now()){if(typeof code!=='string'||code.length>80)return null;const digest=createHash('sha256').update(code.trim().toUpperCase()).digest('hex');return configurations().some(c=>now<Date.parse(c.expires)&&timingSafeEqual(Buffer.from(digest,'hex'),Buffer.from(c.hash,'hex')))?digest:null;}
export async function grantStudentTest(accountId,digest){const config=configurations().find(c=>c.hash===digest);if(!config||Date.now()>=Date.parse(config.expires))return false;await initMemberships();
 const verified=await sql().query('SELECT 1 FROM desk_accounts WHERE id=$1 AND verified_at IS NOT NULL',[accountId]);if(!verified.length)return false;
 const source='student-test:'+digest+':'+accountId;
 const prior=await sql().query('SELECT 1 FROM desk_account_memberships WHERE source=$1 AND revoked_at IS NULL AND until>now()',[source]);if(prior.length)return true;
 await sql().query('INSERT INTO desk_member_codes(code_hash,expires_at,max_uses) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[digest,config.expires,config.maxUses]);
 const rows=await sql().query(`WITH slot AS (UPDATE desk_member_codes SET used=used+1 WHERE code_hash=$1 AND expires_at>now() AND used<max_uses AND NOT EXISTS(SELECT 1 FROM desk_account_memberships WHERE source=$3) RETURNING code_hash) INSERT INTO desk_account_memberships(source,account_id,kind,until) SELECT $3,$2,'student-test',now()+($4::integer*interval '1 day') FROM slot ON CONFLICT DO NOTHING RETURNING source`,[digest,accountId,source,config.days]);return rows.length>0;
}
