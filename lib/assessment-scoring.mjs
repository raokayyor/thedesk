import {resilienceEvidenceError} from './resilience-evidence.mjs';
import {questionsForRoute} from './question-banks.mjs';
import {freeResultPreview} from './free-result-preview.mjs';
export const SCORING_VERSION='desk-readiness-v4-80-20';
export const WEIGHTS={application:37,ats:12,competency:31,numerical:10,technical:10};
export const COMPETENCIES=['Analytical ability','Teamwork','Communication','Leadership','Resilience','Commercial awareness','Technical readiness'];
export {GENERAL_BANK as QUESTIONS} from './question-banks.mjs';
import {GENERAL_BANK} from './question-banks.mjs';
export function gradeAnswers(answers,route){
 if(answers?.skipped===true){if(['commercial','numerical'].some(k=>answers[k]!=null))throw Error('Skipped tests must not contain answers.');return {skipped:true,status:'not_taken',commercialCorrect:null,commercialTotal:5,numericalCorrect:null,numericalTotal:5,missed:[],missedConcepts:[],workedAnswers:[]};}
 const bank=route?questionsForRoute(route):GENERAL_BANK;
 const quiz={missed:[],missedConcepts:[],workedAnswers:[]};
 for(const group of ['commercial','numerical']){
  if(!Array.isArray(answers?.[group])||answers[group].length!==5||answers[group].some(x=>!Number.isInteger(x)||x<0||x>3))throw new Error('Answer all ten test questions.');
  quiz[group+'Correct']=0;quiz[group+'Total']=5;
  bank[group].forEach((q,i)=>{if(answers[group][i]===q.answer)quiz[group+'Correct']++;else{quiz.missed.push({section:group,topic:q.topic,...(q.id?{questionId:q.id}:{})});quiz.missedConcepts.push(q.topic);quiz.workedAnswers.push({concept:q.topic,question:q.question,answer:q.explanation,steps:q.working?.length?q.working:[q.explanation],trap:q.trap||'Check the definition and units before choosing an answer.',drill:q.drill||'Explain the calculation or definition aloud without looking at the worked answer.',drillAnswer:q.drillAnswer||q.explanation});}});
 }
 return quiz;
}
export function calculateScores(analysis,ats,quiz,cvText){
 if(!Number.isFinite(ats.score))throw new Error('Choose a supported target route.');

 if(!Array.isArray(analysis.competencies)||analysis.competencies.length!==7)throw new Error('Incomplete competency assessment');
 const resilienceError=resilienceEvidenceError(analysis.competencies,cvText);if(resilienceError)throw new Error(resilienceError);
 const seen=new Set();
 for(const c of analysis.competencies){
  if(!COMPETENCIES.includes(c.name)||seen.has(c.name)||!Number.isInteger(c.score)||c.score<0||c.score>100||typeof c.reason!=='string'||!Array.isArray(c.quotes)||c.quotes.some(q=>typeof q!=='string'||!q.trim()||!cvText.includes(q)))throw new Error('Invalid competency evidence');
  if(c.score>0&&!c.quotes.length)throw new Error(`${c.name}: no supporting quotes were supplied. Set score to 0 if the CV has no evidence; otherwise cite a supporting catalogue ID.`);
  seen.add(c.name);
 }
 // Each CV criterion has an observable anchor, not an arbitrary holistic mark.
 const criteria=['contribution','analysis','outputs','roleRelevance','specificity','clarity'];
 if(!Array.isArray(analysis.applicationCriteria)||analysis.applicationCriteria.length!==6)throw new Error('Incomplete application assessment');
 const criterionSeen=new Set();
 for(const c of analysis.applicationCriteria){
  if(!criteria.includes(c.name)||criterionSeen.has(c.name)||!Number.isInteger(c.points)||c.points<0||c.points>5||!Array.isArray(c.quotes)||c.quotes.some(q=>typeof q!=='string'||!q.trim()||!cvText.includes(q))||(c.points>0&&!c.quotes.length))throw new Error('Invalid application evidence');
  criterionSeen.add(c.name);
 }
 const breakdown={application:Math.round(analysis.applicationCriteria.reduce((s,c)=>s+c.points,0)/30*WEIGHTS.application),ats:Math.round(ats.score/100*WEIGHTS.ats),competency:Math.round(analysis.competencies.reduce((s,c)=>s+c.score,0)/700*WEIGHTS.competency),numerical:quiz.skipped?null:quiz.numericalCorrect*2,technical:quiz.skipped?null:quiz.commercialCorrect*2};
 const cvEvidenceScore=breakdown.application+breakdown.ats+breakdown.competency;const overallScore=quiz.skipped?null:Object.values(breakdown).reduce((s,x)=>s+x,0);
 return {...analysis,overallScore,cvEvidenceScore,cvEvidenceMax:80,readinessComplete:!quiz.skipped,band:quiz.skipped?'Tests not taken':overallScore>=75?'Competitive':overallScore>=65?'Borderline':'Developing',breakdown,weights:WEIGHTS,scoringVersion:SCORING_VERSION,atsReadiness:{...ats,weightedContribution:{component:'ats',score:ats.score,max:WEIGHTS.ats,earned:breakdown.ats,appliedToOverall:true}}};
}
export function publicAssessment(result,quiz,cvText){
 return {result:freeResultPreview(result,cvText),quiz:{skipped:quiz.skipped===true,status:quiz.skipped?'not_taken':'completed',commercialCorrect:quiz.commercialCorrect,commercialTotal:5,numericalCorrect:quiz.numericalCorrect,numericalTotal:5,missed:quiz.missed}};
}
// Reopened assessments use the current published weights without another model verdict.
export function currentAssessmentScore(result,quiz,cvText=''){
 if(!result||result.scoringVersion===SCORING_VERSION)return result;
 if(quiz&&Array.isArray(result.applicationCriteria)&&result.atsReadiness){try{return calculateScores(result,result.atsReadiness,quiz,cvText)}catch{}}
 const b=result.breakdown;if(!b||!['application','ats','competency'].every(k=>Number.isFinite(b[k])))return result;
 const old=result.weights||{application:30,ats:10,competency:25,numerical:15,technical:20};
 const hasTestMarks=Number.isInteger(quiz?.numericalCorrect)&&Number.isInteger(quiz?.commercialCorrect),skipped=quiz?.skipped===true||(!hasTestMarks&&result.readinessComplete===false);
 if(!skipped&&!hasTestMarks&&!['numerical','technical'].every(k=>Number.isFinite(b[k])))return result;
 const breakdown=Object.fromEntries(Object.keys(WEIGHTS).map(k=>[k,skipped&&['numerical','technical'].includes(k)?null:Math.round(b[k]/old[k]*WEIGHTS[k])]));
 if(result.applicationCriteria?.length===6&&result.applicationCriteria.every(c=>Number.isInteger(c.points)&&c.points>=0&&c.points<=5))breakdown.application=Math.round(result.applicationCriteria.reduce((n,c)=>n+c.points,0)/30*WEIGHTS.application);
 if(result.competencies?.length===7&&result.competencies.every(c=>Number.isInteger(c.score)&&c.score>=0&&c.score<=100))breakdown.competency=Math.round(result.competencies.reduce((n,c)=>n+c.score,0)/700*WEIGHTS.competency);
 if(Number.isFinite(result.atsReadiness?.score))breakdown.ats=Math.round(result.atsReadiness.score/100*WEIGHTS.ats);
 if(!skipped&&Number.isInteger(quiz?.numericalCorrect)&&Number.isInteger(quiz?.commercialCorrect)){breakdown.numerical=quiz.numericalCorrect*2;breakdown.technical=quiz.commercialCorrect*2;}
 const cvEvidenceScore=breakdown.application+breakdown.ats+breakdown.competency,overallScore=skipped?null:Object.values(breakdown).reduce((a,b)=>a+b,0);
 return {...result,breakdown,cvEvidenceScore,cvEvidenceMax:80,overallScore,readinessComplete:!skipped,band:skipped?'Tests not taken':overallScore>=75?'Competitive':overallScore>=65?'Borderline':'Developing',weights:WEIGHTS,scoringVersion:SCORING_VERSION};
}
