import {freeResultPreview} from './free-result-preview.mjs';
export const SCORING_VERSION='desk-readiness-v2';
export const WEIGHTS={application:30,ats:10,competency:25,numerical:15,technical:20};
export const COMPETENCIES=['Analytical ability','Teamwork','Communication','Leadership','Resilience','Commercial awareness','Technical readiness'];
export const QUESTIONS={
 commercial:[
 {topic:'Rate impact on borrowing costs',answer:0,explanation:'Higher policy rates tend to raise borrowing costs. They do not instantly eliminate inflation.'},
 {topic:'Equity dilution',answer:0,explanation:'Issuing additional shares can reduce an existing shareholder’s percentage ownership unless they participate.'},
 {topic:'EBITDA definition',answer:0,explanation:'EBITDA is earnings before interest, tax, depreciation and amortisation. It is not cash flow.'},
 {topic:'Strategic buyer in M&A',answer:0,explanation:'A strategic buyer is an operating business buying another business, often for operational fit or synergies.'},
 {topic:'Credit spreads and credit risk',answer:0,explanation:'A wider credit spread generally reflects greater perceived credit risk or weaker market liquidity.'}],
 numerical:[
 {topic:'Percentage growth',answer:1,explanation:'(100 − 80) / 80 × 100 = 25%. Divide by the original revenue, not the new revenue.'},
 {topic:'Percentage fall',answer:2,explanation:'£200 × (1 − 0.15) = £170. A 15% fall is £30.'},
 {topic:'EV / EBITDA valuation',answer:2,explanation:'Enterprise value = £30m EBITDA × 8 = £240m. This is enterprise value, not equity value.'},
 {topic:'Net debt',answer:1,explanation:'Net debt = £120m debt − £20m cash = £100m.'},
 {topic:'Margin change in percentage points',answer:1,explanation:'12% − 10% = 2 percentage points. The relative percentage increase is 20%.'}]
};
export function gradeAnswers(answers){
 const quiz={missed:[],missedConcepts:[],workedAnswers:[]};
 for(const group of ['commercial','numerical']){
  if(!Array.isArray(answers?.[group])||answers[group].length!==5||answers[group].some(x=>!Number.isInteger(x)||x<0||x>3))throw new Error('Answer all ten test questions.');
  quiz[group+'Correct']=0;quiz[group+'Total']=5;
  QUESTIONS[group].forEach((q,i)=>{if(answers[group][i]===q.answer)quiz[group+'Correct']++;else{quiz.missed.push({section:group,topic:q.topic});quiz.missedConcepts.push(q.topic);quiz.workedAnswers.push({concept:q.topic,question:q.topic,answer:q.explanation,steps:[q.explanation],trap:'Check the definition and units before choosing an answer.',drill:'Explain the calculation or definition aloud without looking at the worked answer.',drillAnswer:q.explanation});}});
 }
 return quiz;
}
export function calculateScores(analysis,ats,quiz,cvText){
 if(!Number.isFinite(ats.score))throw new Error('Choose a supported target route.');
 const levels=new Map([[0,0],[1,25],[2,50],[3,75],[4,100]]);
 if(!Array.isArray(analysis.competencies)||analysis.competencies.length!==7)throw new Error('Incomplete competency assessment');
 const seen=new Set();
 for(const c of analysis.competencies){
  if(!COMPETENCIES.includes(c.name)||seen.has(c.name)||!levels.has(c.level)||typeof c.reason!=='string'||!Array.isArray(c.quotes)||c.quotes.some(q=>typeof q!=='string'||!q.trim()||!cvText.includes(q)))throw new Error('Invalid competency evidence');
  if(c.level>0&&!c.quotes.length)throw new Error('Evidence required for scored competency');
  c.score=levels.get(c.level);seen.add(c.name);
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
export function publicAssessment(result,quiz){
 return {result:freeResultPreview(result),quiz:{commercialCorrect:quiz.commercialCorrect,commercialTotal:5,numericalCorrect:quiz.numericalCorrect,numericalTotal:5,missed:quiz.missed}};
}
