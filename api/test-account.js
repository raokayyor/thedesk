// Synthetic review accounts only. Never available on production; never sends email or charges a card.
import {randomBytes} from 'node:crypto';
import {sql,hash,apiFailure} from '../lib/report-store.mjs';
import {initAccounts,upsertAccount,markVerified,startSession,linkAssessment} from '../lib/accounts.mjs';
import {initMemberships} from '../lib/account-memberships.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');if(process.env.VERCEL_ENV!=='preview')return res.status(404).end();if(req.method!=='GET')return res.status(405).end();
 try{await initAccounts();const member=req.query.tier==='member',assessed=req.query.state==='assessed';const account=await upsertAccount('review-'+randomBytes(10).toString('hex')+'@sample.thedesk.invalid');await markVerified(account.id);
 const token=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`desk_owner=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`);
 await sql().query('INSERT INTO desk_account_profiles(account_id,data) VALUES($1,$2::jsonb)',[account.id,JSON.stringify({name:'Student Preview',university:'University of Bristol',course:'Economics',year:'Second year',sectors:['Banking'],testFixture:true})]);
 if(member){await initMemberships();await sql().query("INSERT INTO desk_account_memberships(source,account_id,kind,until) VALUES($1,$2,'tester',now()+interval '30 days')",['fixture:'+account.id,account.id]);}
 if(assessed){const rows=await sql().query("SELECT d.* FROM desk_test_runs t JOIN desk_assessments d ON d.id=t.assessment_id WHERE t.batch='mydesk-nov9-review' AND t.persona_key='p01-strong-ib' LIMIT 1");if(rows[0]){const id=randomBytes(24).toString('hex'),row=rows[0];await sql().query('INSERT INTO desk_assessments(id,owner_hash,input,result,report) VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb)',[id,hash(token),JSON.stringify(row.input),JSON.stringify(row.result),JSON.stringify(row.report)]);await linkAssessment(account.id,id);}}
 await startSession(res,account.id);res.setHeader('Location','/my.html');return res.status(303).end();
 }catch(e){return apiFailure(res,e);}
}
