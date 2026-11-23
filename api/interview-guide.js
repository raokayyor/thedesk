import {resolveDaily} from '../lib/interview-daily.mjs';
import {sameQuestion} from '../lib/interview-question-family.mjs';
import {sameOrigin,ownedRecord,owner,hash,sql,initStore,apiFailure} from '../lib/report-store.mjs';
import {currentAccount,latestAssessment} from '../lib/accounts.mjs';
import {principal,isPaidOwner,useQuota,saveItem} from '../lib/value-accounts.mjs';
import {deepFor,deepQuestions} from '../lib/deep-assessment.mjs';
import {latestCv} from '../lib/saved-cv.mjs';
import {resolveInterviewTaster} from '../lib/interview-taster-context.mjs';
import {evidenceSources,buildInterviewGuide,applyConfirmedGuideGaps} from '../lib/interview-evidence-guide.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{const b=req.body||{};if(typeof b.question!=='string'||b.question.length<10||b.question.length>1600)return res.status(400).json({error:'Choose a question first.'});
 const p=await principal(req,res),paid=await isPaidOwner(p);if(!await useQuota('interview-guide:'+p,200))return res.status(429).json({error:'Too many guide requests. Please try later.'});
 const daily=b.dailyId?await resolveDaily(req,b.dailyId):null;if(daily){b.question=daily.data.question;b.kind=daily.data.kind;b.firm=daily.data.firm;b.assessmentId=daily.data.assessmentId;}
 if(!daily&&(b.taster===true||!paid)){const sample=await resolveInterviewTaster(req,res);return res.json({success:true,...buildInterviewGuide(evidenceSources(sample.cv.text),sample.question,{locked:true})});}
 let row;if(b.assessmentId){if(typeof b.assessmentId!=='string'||! /^[a-f0-9]{48}$/.test(b.assessmentId))return res.status(400).json({error:'Invalid assessment reference.'});row=await ownedRecord(req,res,b.assessmentId);}else{const a=await currentAccount(req);if(a)row=await latestAssessment(a.id);else{await initStore();row=(await sql().query('SELECT id,input,result,owner_hash FROM desk_assessments WHERE owner_hash=$1 ORDER BY created_at DESC LIMIT 1',[owner(req,res)]))[0];}}
 if(!row){if(b.assessmentId)return res.status(404).json({error:'Save your CV or assessment first.'});return res.json({success:true,...buildInterviewGuide([],b.question)});}
 const cv=await latestCv(row.owner_hash),text=cv.text||row.input.cvText;const deep=text===row.input.cvText?await deepFor(row):null;
 const useSaved=b.useSavedAnswers===true;
 const savedRows=b.autoSavedAnswers===true?await sql().query("SELECT id,data,created_at FROM desk_value_items WHERE principal=$1 AND kind='answer' ORDER BY created_at DESC LIMIT 100",[p]):[];
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const explicitSaved=b.savedAnswerId?savedRows.find(x=>String(x.id)===String(b.savedAnswerId)&&x.data?.source==='application-draft'&&sameQuestion(x.data,{question:b.question,kind:b.kind,firm:b.firm})):null;const autoSaved=explicitSaved||savedRows.filter(x=>Number.isFinite(x.data?.score)&&sameQuestion(x.data,{question:b.question,kind:b.kind,firm:b.firm??x.data.firm})).sort((a,b)=>b.data.score-a.data.score)[0]||null;
 const previous=useSaved||b.followUpOf?await sql().query("SELECT data->>'transcript' AS transcript, data->>'question' AS question FROM desk_value_items WHERE principal=$1 AND kind='interview' ORDER BY created_at DESC LIMIT 8",[p]):[];
 const original=typeof b.followUpOf?.question==='string'?previous.find(x=>x.question===b.followUpOf.question):null;
 const guide=buildInterviewGuide(evidenceSources(text,deep,(original?[original]:autoSaved?[{transcript:autoSaved.data.text}]:useSaved?previous:[]).map(x=>x.transcript),deep?.status==='complete'?Object.fromEntries(deepQuestions(row).map(q=>[q.id,q.source])):{}),b.question,{kind:b.kind,followUpOf:original?{question:original.question,answer:original.transcript,sourceId:b.followUpOf.sourceId}:null}),cvHash=hash(JSON.stringify({cv:text,deep:deep?.status==='complete'?deep.answers:null})),questionHash=hash(JSON.stringify({version:2,question:b.question,kind:b.kind||'',original:original?{question:original.question,answer:original.transcript,sourceId:b.followUpOf.sourceId}:null}));
 if(autoSaved&&!original){const selected=guide.examples.find(e=>e.id==='earlier-0');if(selected){selected.source='Your saved answer';if(Array.isArray(autoSaved.data.beats)&&autoSaved.data.beats.length===4)selected.beats=autoSaved.data.beats.map(b=>({label:b.label,text:b.present&&autoSaved.data.text.includes(b.quote)?b.quote:b.note||'Add this detail',gap:!(b.present&&autoSaved.data.text.includes(b.quote)),sourceId:'saved-answer'}));selected.answer=[{text:autoSaved.data.text,sourceId:'saved-answer',evidenceQuote:autoSaved.data.text,gap:false}];guide.examples=[selected,...guide.examples.filter(e=>e!==selected)].slice(0,2);}guide.savedAnswer={id:autoSaved.id,score:autoSaved.data.score};}
 if(b.confirmGap){const c=b.confirmGap;if(!guide.examples.some(e=>e.id===c.sourceId)||![0,1,2,3].includes(c.index)||typeof c.text!=='string'||c.text.trim().length<10||c.text.length>800)return res.status(400).json({error:'Add a supported detail in 10–800 characters.'});await saveItem(p,'interview-guide-gap',{assessmentId:row.id,cvHash,questionHash,sourceId:c.sourceId,index:c.index,text:c.text.trim()});}
 const saved=useSaved?await sql().query("SELECT data FROM desk_value_items WHERE principal=$1 AND kind='interview-guide-gap' AND data->>'assessmentId'=$2 AND data->>'cvHash'=$3 AND data->>'questionHash'=$4 ORDER BY created_at DESC LIMIT 30",[p,row.id,cvHash,questionHash]):[];
 const result=applyConfirmedGuideGaps(guide,b.confirmGap&&!useSaved?[b.confirmGap]:saved.map(x=>x.data));if(!paid){result.locked=true;for(const e of result.examples||[])e.answer=[];}return res.json({success:true,sourceMode:useSaved?'saved':'cv',...result});
 }catch(e){return apiFailure(res,e)}
}
