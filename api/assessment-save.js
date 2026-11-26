import {localReturn} from '../lib/tier-journey.mjs';
import {claimTrialWork} from '../lib/free-tasters.mjs';
import {randomBytes} from 'node:crypto';
import {sameOrigin,ownedRecord,sql,apiFailure,owner} from '../lib/report-store.mjs';
import {validEmail,normEmail,emailConfigured,createLoginLink,sendLoginEmail,allow,initAccounts,currentAccount,linkAssessment,startSession} from '../lib/accounts.mjs';
import {funnelEvent} from '../lib/assessment-funnel.mjs';
import {subscribeResult} from '../lib/result-emails.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.json({emailReady:emailConfigured()});
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{const b=req.body||{},email=normEmail(b.email);if(!validEmail(email))return res.status(400).json({error:'Enter a valid email address.'});
 const row=await ownedRecord(req,res,b.assessmentId);if(!row)return res.status(404).json({error:'Open your assessment in the browser where you completed it.'});
 if(!emailConfigured())return res.status(503).json({error:'Email is temporarily unavailable. Your result is still here; please try again.'});
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
 if(!await allow('assessment-save:'+row.owner_hash,5)||!await allow('assessment-save-email:'+email,3)||!await allow('assessment-save-ip:'+ip,20))return res.status(429).json({error:'Please check your inbox, or try again in an hour.'});
 await initAccounts();const session=await currentAccount(req),origin=new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;
 // Send before revealing anything; a failed send leaves a retryable result.
 const subscription=await subscribeResult({row,email,origin,deadline:null,assessmentEntry:true});
 const returnTo=localReturn(b.returnTo,'/result-final-design.html?id='+row.id),guestOwner=owner(req,res),link=await createLoginLink(email,origin,{assessmentId:row.id,purpose:'assessment',signupProfile:{guestOwner,returnTo}});
 await sendLoginEmail(email,link,'assessment',origin+'/api/result-email?unsubscribe='+subscription.token);
 await sql().query('INSERT INTO desk_result_unlocks(assessment_id,email) VALUES($1,$2) ON CONFLICT(assessment_id) DO NOTHING',[row.id,email]);
 await sql().query('UPDATE desk_assessments SET input=input || $1::jsonb WHERE id=$2',[JSON.stringify({resultEmail:email,consentRecordedAt:new Date().toISOString(),resultEmailConsent:'assessment-weekly-question-v1'}),row.id]);
 let next=null,linkedAccountId=null;
 if(session?.email===email){const verified=(await sql().query('SELECT verified_at FROM desk_accounts WHERE id=$1',[session.id]))[0];if(verified?.verified_at)await sql().query('UPDATE desk_result_emails SET confirmed_at=now() WHERE id=$1',[subscription.id]);await linkAssessment(session.id,row.id);linkedAccountId=session.id;next='/my.html';}
 else if(!session){
  // Atomic insert prevents a race from signing into a pre-existing account.
  const created=(await sql().query('INSERT INTO desk_accounts(id,email) VALUES($1,$2) ON CONFLICT(email) DO NOTHING RETURNING id',[randomBytes(12).toString('hex'),email]))[0];
  if(created){await linkAssessment(created.id,row.id);await startSession(res,created.id,{days:7});linkedAccountId=created.id;next='/my.html';}
 }
 if(next){await claimTrialWork(linkedAccountId,guestOwner);next=returnTo;}
 await funnelEvent(row.owner_hash,'email_submitted',row.id).catch(()=>{});
 return res.json({success:true,unlocked:true,emailSent:true,next,message:next?'Your result is saved.':'Your fixes are ready. Open your emailed login link to continue to My Desk.'});
 }catch(e){return apiFailure(res,e)}
}
