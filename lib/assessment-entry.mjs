import {validateFreeLineRewrite,rewritePrefix} from './free-line-rewrite.mjs';
import {evidenceForDetail} from './evidence-fairness.mjs';
import {frameworkResult} from './cv-framework-result.mjs';
import {validateEvidenceFairness} from './evidence-fairness.mjs';
import {resultTeaser,universityFromCv} from './free-result-teaser.mjs';
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
 const r=frameworkResult(row.result,row.input.cvText,row.input.profile,row.input.quiz),b=r.breakdown||{},hasBreakdown=['application','ats','competency','numerical','technical'].every(key=>Number.isFinite(b[key]));
 let summary=r.deskSummary||'';if(validateEvidenceFairness({deskSummary:summary},row.input.cvText||'').length){const first=summary.split(/(?<=[.!?])\s+(?=[A-Z])/u)[0];summary=validateEvidenceFairness({deskSummary:first},row.input.cvText||'').length?'':first;}
 const quiz=row.input.quiz||{},tests=quiz.skipped?{skipped:true}:Number.isInteger(quiz.numericalCorrect)&&Number.isInteger(quiz.commercialCorrect)?{skipped:false,numerical:quiz.numericalCorrect,numericalTotal:quiz.numericalTotal||5,commercial:quiz.commercialCorrect,commercialTotal:quiz.commercialTotal||5,missedCount:Array.isArray(quiz.missed)?quiz.missed.length:undefined,...(unlocked?{missedTopics:(quiz.missed||[]).map(m=>m.topic)}:{})}:null;
 const topics=[...new Set((quiz.missed||[]).map(m=>String(m.topic||'').trim()).filter(Boolean))];if(tests&&!tests.skipped){const wrong=Math.max(0,tests.numericalTotal+tests.commercialTotal-tests.numerical-tests.commercial);tests.missedCount=wrong;tests.topicCount=topics.length||wrong;tests.topicCountKind=topics.length?'topics':'questions';if(unlocked)tests.topics=topics;}
 const cvUniversity=universityFromCv(row.input.cvText),academic=r.cvFramework.course,courseTeaser=(academic.label||'Your course')+(cvUniversity?' at '+cvUniversity:'')+' · '+academic.gradeLabel+' · '+r.cvFramework.courseTeaser+' →';
 const hiddenPlaceholder='Your personalised reason and the next step appear here. '.repeat(4).slice(0,Math.max(36,r.cvFramework.reasons[2].text.length));
 const {lines,...teaser}=resultTeaser({...row,result:r});
 if(teaser.teaser&&row.report?.freeLineFixes?.version===2){const draft=row.report.freeLineFixes.lines?.find(line=>line.original===teaser.teaser.original);if(draft){try{const evidence=evidenceForDetail(row.input.cvText,lines[0]?.role||'');const checked=validateFreeLineRewrite(draft,draft.original,evidence.includes(draft.original)?evidence:draft.original);teaser.teaser.preview=rewritePrefix(checked.line);}catch{}}}
 return {score:r.overallScore??r.cvEvidenceScore,max:r.readinessComplete===false?80:100,band:r.band,summary,tests,verdict:r.frameworkVerdict,reasons:r.cvFramework.reasons.slice(0,unlocked?3:2),hiddenReason:unlocked?null:{placeholder:hiddenPlaceholder},courseTeaser,course:unlocked?r.cvFramework.course:null,...teaser,...(hasBreakdown?{scoreBreakdown:{cv:b.application+b.ats+b.competency,tests:b.numerical+b.technical,cvMax:80,testMax:20}}:{}),unlocked,fixes:unlocked?r.priorities:[],...(unlocked?{flaggedLines:lines.slice(0,3).map(({original,issue})=>({original,issue})),detail:{breakdown:r.breakdown||{},competencies:(r.competencies||[]).map(c=>({name:c.name,score:c.score,reason:c.quotes?.length?'Supporting evidence: “'+c.quotes[0]+'”':'No supporting quotes recorded for this competency.'})),atsBand:r.atsReadiness?.band||null}}:{})};
}
