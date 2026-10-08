import {questionsForRoute} from './question-banks.mjs';
import {freeResultPreview} from './free-result-preview.mjs';
export const SCORING_VERSION='desk-readiness-v3';
export const WEIGHTS={application:30,ats:10,competency:25,numerical:15,technical:20};
export const COMPETENCIES=['Analytical ability','Teamwork','Communication','Leadership','Resilience','Commercial awareness','Technical readiness'];
export {GENERAL_BANK as QUESTIONS} from './question-banks.mjs';
import {GENERAL_BANK} from './question-banks.mjs';
export function gradeAnswers(answers,route){
 const bank=route?questionsForRoute(route):GENERAL_BANK;
 const quiz={missed:[],missedConcepts:[],workedAnswers:[]};
 for(const group of ['commercial','numerical']){
  if(!Array.isArray(answers?.[group])||answers[group].length!==5||answers[group].some(x=>!Number.isInteger(x)||x<0||x>3))throw new Error('Answer all ten test questions.');
  quiz[group+'Correct']=0;quiz[group+'Total']=5;
  bank[group].forEach((q,i)=>{if(answers[group][i]===q.answer)quiz[group+'Correct']++;else{quiz.missed.push({section:group,topic:q.topic,...(q.id?{questionId:q.id}:{})});quiz.missedConcepts.push(q.topic);quiz.workedAnswers.push({concept:q.topic,question:q.question,answer:q.explanation,steps:q.working?.length?q.working:[q.explanation],trap:q.trap||'Check the definition and units before choosing an answer.',drill:'Explain the calculation or definition aloud without looking at the worked answer.',drillAnswer:q.explanation});}});
 }
 return quiz;
}
export function calculateScores(analysis,ats,quiz,cvText){
 if(!Number.isFinite(ats.score))throw new Error('Choose a supported target route.');

 if(!Array.isArray(analysis.competencies)||analysis.competencies.length!==7)throw new Error('Incomplete competency assessment');
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
 const breakdown={application:analysis.applicationCriteria.reduce((s,c)=>s+c.points,0),ats:Math.round(ats.score/10),competency:Math.round(analysis.competencies.reduce((s,c)=>s+c.score,0)/700*25),numerical:quiz.numericalCorrect*3,technical:quiz.commercialCorrect*4};
 const overallScore=Object.values(breakdown).reduce((s,x)=>s+x,0);
 return {...analysis,overallScore,band:overallScore>=75?'Competitive':overallScore>=65?'Borderline':'Weak',breakdown,weights:WEIGHTS,scoringVersion:SCORING_VERSION,atsReadiness:ats};
}
export function publicAssessment(result,quiz,cvText){
 return {result:freeResultPreview(result,cvText),quiz:{commercialCorrect:quiz.commercialCorrect,commercialTotal:5,numericalCorrect:quiz.numericalCorrect,numericalTotal:5,missed:quiz.missed}};
}
