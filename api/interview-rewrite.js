import {sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {principal,isPaidOwner,useQuota,saveItem} from '../lib/value-accounts.mjs';
import {answerKey} from '../lib/interview-library.mjs';
import {fillRewriteGap,practiceRewriteBeats} from '../lib/interview-rewrite-beats.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{const p=await principal(req,res);if(!await isPaidOwner(p))return res.status(402).json({error:'Members get the full rewrite and can practise it.',upgrade:true});const b=req.body||{};
 if(!/^\d{1,18}$/.test(String(b.attemptId||'')))return res.status(400).json({error:'Open your answer feedback first.'});if(!await useQuota('interview-rewrite:'+p,100))return res.status(429).json({error:'Please try again later.'});
 const row=(await sql().query("SELECT data FROM desk_value_items WHERE id=$1 AND principal=$2 AND kind='interview'",[b.attemptId,p]))[0];if(!row?.data.feedback?.rewrite?.parts)return res.status(404).json({error:'Your rewrite was not found in your account.'});
 const latest=(await sql().query("SELECT data FROM desk_value_items WHERE principal=$1 AND kind='interview-rewrite-detail' AND data->>'attemptId'=$2 ORDER BY created_at DESC LIMIT 1",[p,String(b.attemptId)]))[0];
 let rewrite=latest?.data.rewrite||row.data.feedback.rewrite;const answers=Array.isArray(b.answers)?b.answers:[];if(answers.length>2)return res.status(400).json({error:'Fill up to two gaps at a time.'});
 try{for(const a of answers)rewrite=fillRewriteGap(rewrite,a.id,a.text);}catch(error){return res.status(400).json({error:error.message});}
 const beats=practiceRewriteBeats(rewrite,row.data.firm),detail={attemptId:String(b.attemptId),rewrite,script:rewrite.text,question:row.data.question,beats};
 if(answers.length)await saveItem(p,'interview-rewrite-detail',detail);
 if(b.action==='save'){const data={question:row.data.question,text:rewrite.text,firm:row.data.firm,role:row.data.role,kind:row.data.kind,source:'interview-rewrite',key:'draft:'+answerKey(row.data.question,row.data.kind,row.data.firm),beats,savedAt:new Date().toISOString()};const previous=(await sql().query("SELECT id FROM desk_value_items WHERE principal=$1 AND kind='answer' AND data->>'key'=$2 ORDER BY created_at DESC LIMIT 1",[p,data.key]))[0];if(previous)await sql().query('UPDATE desk_value_items SET data=$1::jsonb,created_at=now() WHERE id=$2 AND principal=$3',[JSON.stringify(data),previous.id,p]);else await saveItem(p,'answer',data);return res.json({success:true,saved:true,rewrite,beats,text:rewrite.text,parts:rewrite.parts});}
 return res.json({success:true,rewrite,beats,text:rewrite.text,parts:rewrite.parts,scoreUnchanged:row.data.feedback.overall});
 }catch(error){return apiFailure(res,error)}
}
