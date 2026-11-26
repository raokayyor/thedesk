import {sql} from './report-store.mjs';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
import {getEvidenceCatalog} from './full-cycle-contract.mjs';
import {COMPETENCIES,calculateScores} from './assessment-scoring.mjs';
let ready;
export function initDeep(){return ready??=sql().query(`CREATE TABLE IF NOT EXISTS desk_deep_assessments(assessment_id text PRIMARY KEY,data jsonb NOT NULL DEFAULT '{}',lease_until timestamptz,updated_at timestamptz NOT NULL DEFAULT now())`).catch(e=>{ready=null;throw e})}
export async function deepFor(row){await initDeep();const d=(await sql().query('SELECT data FROM desk_deep_assessments WHERE assessment_id=$1',[row.id]))[0]?.data;return d?.cvHash===hash(row.input.cvText)?d:null;}
export function deepQuestions(row){
 const cv=row.input.cvText,catalog=getEvidenceCatalog(cv),first=row.result?.cvPreview?.original;
 const usable=catalog.filter(x=>x.quote.split(/\s+/).length>=9&&!/@|https?:/.test(x.quote));
 const ranked=usable.map(x=>({quote:x.quote,rank:(x.quote===first?100:0)+(/^[\s•-]/.test(x.quote)?5:0)+(row.result?.priorities||[]).filter(p=>x.quote.includes(p.detail)).length*8})).sort((a,b)=>b.rank-a.rank);
 const weak=(row.result?.weakLines||[]).filter(w=>typeof w.original==='string'&&cv.includes(w.original));
 const lines=[...new Set([...weak.map(w=>w.original),first,...ranked.map(x=>x.quote)].filter(x=>typeof x==='string'&&cv.includes(x)))].slice(0,3);
 const qs=[];lines.forEach((source,i)=>{
  const issue=weak.find(w=>w.original===source)?.issue||row.result?.cvPreview?.issue||'Make your personal contribution and the result clearer.';
  const text=source+' '+issue;
  const analytical=/analys|compar|valuation|DCF|model|research|margin|dissertation|project|finding|conclusion/i.test(text);
  const people=/train|team|lead|society|captain|colleagues|volunteer|customer|barista/i.test(text);
  const labels=analytical?[
   ['action','What did you personally analyse, and how did you do it?','Name the information, tools or comparison you used. Explain one assumption or decision you made yourself.'],
   ['finding','What was your actual finding or conclusion?','What did you learn from the analysis? Explain the comparison or reasoning. Include figures only if you remember and can support them.'],
   ['outcome','How was your work used, and what happened next?','Who saw the output? What decision, feedback or next step followed? If you do not know, say so.']
  ]:people?[
   ['action','What were you personally trusted to do?','Separate your responsibilities from the team’s. Describe a specific shift, task or situation and the judgement you used.'],
   ['finding','Tell us about one challenge and what you did about it.','What made it difficult? What did you decide or change? A concrete example is more useful than a list of skills.'],
   ['outcome','What happened as a result, and what did you learn?','Describe an observable result or feedback. It need not be a financial figure. Do not claim an outcome you cannot verify.']
  ]:[
   ['action','What did you personally do, and how did you approach it?','Explain your own part, the method you used and one decision you made. Avoid describing only what the whole team did.'],
   ['finding','What did this work show, change or produce?','Give the actual finding, output or problem you solved. What would be missing if you had not done your part?'],
   ['outcome','Who used the work, or what happened next?','Describe feedback, a decision or a result you can support. If the later outcome is unknown, tell us that.']
  ];
  labels.push(analytical?
   ['decision','Which assumption or conclusion would you defend if a recruiter challenged it?','Explain why you chose that approach, one alternative you considered, and what would change your conclusion. If you did not make that decision, say who did.']:
   ['decision','What decision did you make yourself, rather than follow an instruction?','Describe your options, why you chose one, and the trade-off. Be clear about what your manager or teammates decided instead.']);
  labels.push(['verification','What could you honestly prove about this claim, and what would you do differently?','Explain how any figure or result was measured, who could confirm your contribution, and one limitation or lesson. If you cannot support a number, say so. Do not add a result just to make the CV sound stronger.']);
  for(const [key,label,hint]of labels)qs.push({id:`experience-${i}-${key}`,group:`CV line ${i+1}`,source,issue,label,hint});
 });
 qs.push({id:'motivation',group:'Your direction',source:row.input.profile?.targetFirm||row.input.profile?.targetSector||'Your target role',label:'Why this kind of work, and what in your experience convinced you?',hint:'Connect a specific experience to the work you want to do. If you named a firm, explain what you have learned about it; a generic reputation claim is not enough.'});return qs;
}
export function initialDeepAnswers(row){
 const original=row.result?.weakLines?.[0]?.original||row.result?.cvPreview?.original;
 const q=deepQuestions(row).find(q=>q.source===original&&q.id.endsWith('-finding'));
 const text=row.input?.freeLineFix?.answer;
 return q&&typeof text==='string'&&text.trim().length>=15&&text.length<=1500?{[q.id]:{text:text.trim(),unknown:false,fromFreeFix:true}}:{};
}

export function validateDeepAnswers(questions,body,complete=false){
 if(!['carry','skip'].includes(body.testChoice))throw Error('Choose whether to carry forward your test results or leave tests out.');
 const answers={};for(const q of questions){const a=body.answers?.[q.id];if(!a){if(complete)throw Error('Answer each question, or choose “I don’t know / not applicable”.');continue;}if(a.unknown===true){answers[q.id]={unknown:true,text:''};continue;}if(typeof a.text!=='string'||a.text.trim().length>1500||(complete&&a.text.trim().length<15))throw Error('Add a little more detail, or choose “I don’t know / not applicable”.');answers[q.id]={unknown:false,text:a.text.trim()};}
 if(complete&&body.confirm!==true)throw Error('Confirm that your answers reflect your actual experience.');return {answers,testChoice:body.testChoice};
}
export function evidenceText(row,d){const questions=deepQuestions(row);return row.input.cvText+'\n\nADDITIONAL STUDENT-CONFIRMED EVIDENCE (self-reported, not independently verified):\n'+questions.map(q=>{const a=d.answers?.[q.id];return a&&!a.unknown&&a.text?`${q.source}\nStudent-confirmed detail (${q.id}):\n${a.text}`:''}).filter(Boolean).join('\n\n');}
export function scoreDeep(analysis,row,text){const checked=calculateScores(analysis,row.result.atsReadiness||{score:row.result.breakdown.ats*10},row.input.quiz,text);const score=Math.round((checked.breakdown.application+checked.breakdown.competency)/(checked.weights.application+checked.weights.competency)*100),initial=row.result.breakdown,initialEvidenceScore=Number.isFinite(initial?.application)&&Number.isFinite(initial?.competency)?Math.round((initial.application+initial.competency)/((row.result.weights?.application||30)+(row.result.weights?.competency||25))*100):null;return {score,initialEvidenceScore,change:initialEvidenceScore===null?null:score-initialEvidenceScore,application:checked.breakdown.application,competency:checked.breakdown.competency,competencies:checked.competencies,applicationCriteria:checked.applicationCriteria,summary:analysis.summary,...(analysis.read?{read:analysis.read}:{}),scope:'CV and competency evidence only; numerical, commercial and ATS scores are excluded.',version:'deep-evidence-v2'};}
export function deepSchema(ids){return {type:'object',properties:{summary:{type:'string',maxLength:700,description:'Two short sentences, no markdown, headings or evidence IDs.'},read:{type:'object',properties:{verdict:{type:'string',maxLength:280},strengths:{type:'array',minItems:1,maxItems:2,items:{type:'string',maxLength:240}},gaps:{type:'array',minItems:1,maxItems:2,items:{type:'string',maxLength:240}},nextStep:{type:'string',maxLength:200}},required:['verdict','strengths','gaps','nextStep'],additionalProperties:false},applicationCriteria:{type:'array',minItems:6,maxItems:6,items:{type:'object',properties:{name:{type:'string',enum:['contribution','analysis','outputs','roleRelevance','specificity','clarity']},points:{type:'integer',minimum:0,maximum:5},quotes:{type:'array',items:{type:'string',enum:ids}}},required:['name','points','quotes'],additionalProperties:false}},competencies:{type:'array',minItems:7,maxItems:7,items:{type:'object',properties:{name:{type:'string',enum:COMPETENCIES},score:{type:'integer',minimum:0,maximum:100},reason:{type:'string'},quotes:{type:'array',items:{type:'string',enum:ids}}},required:['name','score','reason','quotes'],additionalProperties:false}}},required:['summary','read','applicationCriteria','competencies'],additionalProperties:false};}
