import {validateEvidenceFairness} from './evidence-fairness.mjs';
// The first fix is deliberately extractive: no inferred outcomes or new facts.
export function firstCvFix(result, cv='') {
 const before=String(result.cvPreview?.original||result.weakLines?.[0]?.original||'').trim();
 const sentences=before.split(/(?<=[.!?])\s+/).filter(s=>! /\b(?:cannot confirm|not confirmed|no transaction|no client|did not|no .{0,45} was confirmed)\b/i.test(s));
 const ranked=sentences.map((text,i)=>({text,i,strength:(/\d/.test(text)?3:0)+(/\b(?:flagged|trained|reduced|saved|improved|reconciled)\b/i.test(text)?4:/\b(?:built|researched|analysed|presented|organised)\b/i.test(text)?2:0)})).sort((a,b)=>b.strength-a.strength||a.i-b.i);
 const lead=ranked[0];
 let after=lead?[lead,...sentences.map((text,i)=>({text,i})).filter(x=>x.i!==lead.i)].map(x=>x.text).join(' '):'';
 after=after.replace(/^[-•]\s*/,'').replace(/^Responsible for\s+/i,'').replace(/^Training\b/i,'Trained').replace(/^Researching\b/i,'Researched').replace(/^Analysing\b/i,'Analysed');
 if(after===before&&!after.includes('['))after=after.replace(/[.!?]$/,'')+'. [Add your contribution and result.]';
 if(after)after=after[0].toUpperCase()+after.slice(1);
 return {before,after:after||before,note:result.cvPreview?.issue||'Lead with your own action and keep the outcome factual.',needsResult:! /\b(?:reduced|saved|improved|increased|flagged|trained|presented|completed)\b/i.test(after)};
}
export function assessmentEntry(row, unlocked=false) {
 const r=row.result,b=r.breakdown||{},hasBreakdown=['application','ats','competency','numerical','technical'].every(key=>Number.isFinite(b[key]));
 let summary=r.deskSummary||'';if(validateEvidenceFairness({deskSummary:summary},row.input.cvText||'').length){const first=summary.split(/(?<=[.!?])\s+(?=[A-Z])/u)[0];summary=validateEvidenceFairness({deskSummary:first},row.input.cvText||'').length?'':first;}
 const quiz=row.input.quiz||{},tests=quiz.skipped?{skipped:true}:Number.isInteger(quiz.numericalCorrect)&&Number.isInteger(quiz.commercialCorrect)?{skipped:false,numerical:quiz.numericalCorrect,numericalTotal:quiz.numericalTotal||5,commercial:quiz.commercialCorrect,commercialTotal:quiz.commercialTotal||5}:null;
 return {score:r.overallScore??r.cvEvidenceScore,max:r.readinessComplete===false?65:100,band:r.band,summary,tests,...(hasBreakdown?{scoreBreakdown:{cv:b.application+b.ats+b.competency,tests:b.numerical+b.technical}}:{}),firstFix:firstCvFix(r,row.input.cvText),unlocked,fixes:unlocked?(r.priorities||[]).slice(0,3):[],...(unlocked?{detail:{breakdown:r.breakdown||{},competencies:(r.competencies||[]).map(c=>({name:c.name,score:c.score,reason:c.reason})),atsBand:r.atsReadiness?.band||null}}:{})};
}
