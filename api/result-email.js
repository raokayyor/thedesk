import {sameOrigin,ownedRecord,sql,apiFailure} from '../lib/report-store.mjs';
import {currentAccount,validEmail,normEmail,allow} from '../lib/accounts.mjs';
import {emailReady} from '../lib/email.mjs';
import {subscribeResult,sendResultJob,unsubscribeResult} from '../lib/result-emails.mjs';
import {resultDeadline} from '../lib/result-deadline.mjs';
import {resultEvent} from '../lib/result-events.mjs';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');try{
 if(req.query?.unsubscribe){if(!['GET','POST'].includes(req.method))return res.status(405).end();if(req.method==='GET'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.send('<!doctype html><title>Unsubscribe · The Desk</title><main style="max-width:500px;margin:60px auto;font:18px Arial;padding:24px"><h1>Unsubscribe from result emails</h1><form method="post"><button style="padding:12px 20px">Unsubscribe</button></form></main>');}const ok=await unsubscribeResult(req.query.unsubscribe);res.setHeader('Content-Type','text/html; charset=utf-8');return res.status(ok?200:400).send(ok?'You’re unsubscribed from result emails.':'This unsubscribe link is invalid.');}
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 const b=req.body||{},row=await ownedRecord(req,res,b.assessmentId);if(!row)return res.status(404).json({error:'Open your saved result first.'});const email=normEmail(b.email);if(!validEmail(email)||b.consent!==true)return res.status(400).json({error:'Enter your email and tick the result and follow-up consent box.'});
 if(!emailReady())return res.status(503).json({error:'Email delivery is not switched on yet. Your result is saved in this browser.'});
 if(!await allow('result-email:'+row.owner_hash,3)||!await allow('result-email-address:'+email,3)||!await allow('result-email-ip:'+String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0],10))return res.status(429).json({error:'Please wait before requesting another result email.'});
 const account=await currentAccount(req),deadline=await resultDeadline(row,account).catch(()=>null),origin=new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;
 const subscription=await subscribeResult({row,email,origin,deadline});await sql().query("UPDATE desk_assessments SET input=jsonb_set(input,'{resultEmail}',to_jsonb($1::text)) WHERE id=$2",[email,row.id]);
 await sendResultJob(subscription,'result',row);await resultEvent(row.id,'email_captured',{},'email:'+subscription.id);return res.json({success:true,message:'Your result is on its way. You can unsubscribe from every email.'});
 }catch(e){return apiFailure(res,e)}}
