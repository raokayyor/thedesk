import {sameOrigin,ownedRecord,sql,apiFailure} from '../lib/report-store.mjs';
import {validEmail,normEmail,emailConfigured,createLoginLink,sendLoginEmail,allow} from '../lib/accounts.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.json({emailReady:emailConfigured()});
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{const b=req.body||{},row=await ownedRecord(req,res,b.assessmentId);if(!row)return res.status(404).json({error:'Open your saved assessment first.'});const email=normEmail(b.email);if(!validEmail(email))return res.status(400).json({error:'Enter a valid email address.'});
 await sql().query("UPDATE desk_assessments SET input=input || $1::jsonb WHERE id=$2",[JSON.stringify({resultEmail:email,deadlineReminderConsent:b.deadlineConsent===true,consentRecordedAt:new Date().toISOString()}),row.id]);
 let sent=false;if(emailConfigured()&&await allow('assessment-link:'+row.owner_hash,3)){const purpose=b.deadlineConsent===true?'confirm+alerts':'confirm',origin=new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;await sendLoginEmail(email,await createLoginLink(email,origin,{assessmentId:row.id,purpose}),purpose);sent=true;}
 return res.json({success:true,emailSent:sent});
 }catch(e){return apiFailure(res,e)}
}
