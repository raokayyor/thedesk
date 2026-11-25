import {AMELIA_APPLICATION_SAMPLE} from '../data/amelia-application-answer.mjs';
import {analysisGuide,TRIAL_QUESTION,TRIAL_TIP} from './trial-analysis-guide.mjs';
import {WHY_FIRM} from '../data/why-firm.mjs';
import {BANK_LOGOS} from '../data/bank-logos.mjs';
import {evidenceSources,buildInterviewGuide} from './interview-evidence-guide.mjs';
import {freeTryContext,contentWin,quizWin,FREE_TOOLS} from './free-try-content.mjs';
import {questionsForRoute} from './question-banks.mjs';
import {CASES,INBOX,INBOX_CATS} from './assessment-centre-exercises.mjs';
import {dailyQuestion,londonDay} from './interview-daily.mjs';
export const TRIAL_TOOLS={...FREE_TOOLS,tests:'Numerical & commercial tests',case:'Case study',inbox:'Inbox exercise',answers:'Your answer library',story:'Story bank',library:'Preparation library',practitioners:'Practitioner panel'};
function bankFor(ctx){try{return questionsForRoute(ctx.profile?.targetSector||'General Finance')}catch{return questionsForRoute('General Finance')}}
export function trialContext(ctx,tool,{daily=false,section='numerical'}={}){
 const base=freeTryContext(ctx,tool),bank=tool==='tests'?bankFor(ctx):null;
 if(tool==='interview'){base.question=TRIAL_QUESTION;base.guide=analysisGuide(ctx.cv);}

 return {...base,...(tool==='crib'?{trialFirm:ctx.sample?'KPMG':base.firm,firms:Object.entries(WHY_FIRM).map(([key,p])=>({key,label:p.label}))}:{}),profile:{name:ctx.profile?.name||'',targetFirm:ctx.profile?.targetFirm||'',targetSector:ctx.profile?.targetSector||'',programme:ctx.profile?.programme||'',course:ctx.profile?.course||'',university:ctx.profile?.university||''},assessmentId:ctx.row.id,tip:TRIAL_TIP,firmLogo:BANK_LOGOS[base.firm]||null,sampleCrib:tool==='crib'&&ctx.sample?contentWin(ctx,'crib',{}):undefined,title:TRIAL_TOOLS[tool],isGuest:ctx.isGuest,name:ctx.profile?.name||'',sampleLabel:'Sample · Amelia Chen, Economics, Bristol → Barclays',
 ...(bank?{section,quiz:bank[section==='commercial'?'commercial':'numerical'].map(({question,options,topic})=>({question,options,topic}))}:{}),
 ...(tool==='case'?{content:{title:CASES.fenwick.title,brief:CASES.fenwick.summary}}:{}),
 ...(tool==='inbox'?{content:{title:INBOX.emails[0].subject,brief:INBOX.emails[0].body,options:INBOX_CATS}}:{}),
 ...(['answers','story','library','practitioners'].includes(tool)?{content:{title:tool==='answers'?'Keep your strongest answer':tool==='story'?'One true detail improves your answers':tool==='library'?'Understand the method':'What the interviewer is really asking',brief:tool==='library'?bankFor(ctx).commercial[0].question:base.guide?.beats.filter(b=>!b.gap).map(b=>b.text).join(' ')||'Start with one example from your CV.'}}:{})};
}
export function trialWin(ctx,tool,input={}){
 if(tool==='application'&&ctx.sample&&(!input.firm||/^(?:barclays|Barclays)$/.test(input.firm))){const sample=structuredClone(AMELIA_APPLICATION_SAMPLE);if(String(input.text||'').trim())sample.parts[1]={text:String(input.text).trim(),studentAnswer:true};sample.after=sample.parts.map(p=>p.gap?'['+p.text+']':p.text).join(' ');return sample;}
 if(tool==='crib'){const firm=ctx.sample?'KPMG':ctx.profile?.targetFirm||'General';if(input.firm&&input.firm!==firm)throw Object.assign(Error('Membership unlocks other firms.'),{status:403});return {...contentWin({...ctx,profile:{...ctx.profile,targetFirm:firm}},'crib',input),firm};}
 if(['sjt','verbal'].includes(tool))return quizWin(tool,input.answers);
 if(tool==='tests'){const section=input.section==='commercial'?'commercial':'numerical',items=bankFor(ctx)[section];if(!Array.isArray(input.answers)||input.answers.length!==5||input.answers.some(a=>!Number.isInteger(a)||a<0||a>3))throw Object.assign(Error('Answer all five questions.'),{status:400});const score=items.filter((q,i)=>q.answer===input.answers[i]).length,index=items.findIndex((q,i)=>q.answer!==input.answers[i]),q=items[Math.max(0,index)];return {title:'Your '+section+' result',score,total:5,tag:score+'/5 · worked answer',before:q.options[input.answers[Math.max(0,index)]],after:q.options[q.answer],note:q.explanation,question:q.question,review:items.map((q,i)=>({question:q.question,correct:q.answer===input.answers[i],answer:q.options[q.answer],why:q.explanation}))};}
 if(tool==='case')return {title:'Your case recommendation',tag:'One case, a clearer decision',before:String(input.text||''),after:'I would test the 320p offer against the turnaround plan before recommending acceptance. Revenue is rising, but forecast EBITDA falls to £55m and net debt rises to £130m. That leaves limited headroom under the 2.5x covenant. I would compare a negotiated offer with the funding and execution risks of the £40m automation plan.',note:'Worked example from the fictional Fenwick case. Distinguish the offer value from the risks of staying independent.'};
 if(tool==='inbox'){const q=INBOX.emails[0],choice=INBOX_CATS[Number(input.choice)];if(!choice)throw Object.assign(Error('Choose a priority.'),{status:400});return {title:'Your inbox decision',tag:choice===q.model?'Priority correct':'Revisit the deadline',before:choice,after:q.model+': '+q.body,note:q.why};}
 if(tool==='story'){const text=String(input.text||'').trim();if(text.length<5||text.length>1200)throw Object.assign(Error('Add a short, true detail from your experience.'),{status:400});return {title:'Your story detail, saved',tag:'Your own words',before:'A result or decision the CV did not explain',after:text,note:'Saved as a detail you supplied. Check it is accurate before using it in an answer.'};}
 if(tool==='library'){const q=bankFor(ctx).commercial[0];return {title:q.topic,tag:'One worked concept',before:q.question,after:q.options[q.answer],note:q.explanation};}
 if(tool==='practitioners'){const view=freeTryContext(ctx,'firm');return {title:'What they are really asking',tag:'Practitioner framework · preview',before:'What should I make clearer?',after:view.content.tip,note:'Kayyor Rao · practitioner-developed guidance. This preview is not a personal review or a live reply.'};}
 if(tool==='answers'){const g=freeTryContext(ctx,'interview').guide;return {title:'Your answer guide, kept',tag:'Saved practice guide',before:'Your CV evidence',parts:g.beats.map(b=>({label:b.label,text:b.text,gap:b.gap})),after:g.beats.map(b=>b.text).join(' '),note:'A guide built from your CV. Add the missing details and say it in your own words.'};}
 return contentWin(ctx,tool,input);
}
