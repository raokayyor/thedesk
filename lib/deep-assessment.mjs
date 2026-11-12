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
 const lines=[...new Set([first,...ranked.map(x=>x.quote)].filter(x=>typeof x==='string'&&cv.includes(x)))].slice(0,2);
 const qs=[];lines.forEach((source,i)=>{for(const [key,label] of [['action','What did you personally do, and how did you approach it?'],['finding','What did your work show, change or produce?'],['outcome','Who used the work, or what happened next? Give figures only if you can explain them.']])qs.push({id:`experience-${i}-${key}`,group:`Experience ${i+1}`,source,label});});
 qs.push({id:'motivation',group:'Your direction',source:row.input.profile?.targetFirm||row.input.profile?.targetSector||'Your target role',label:'Why does this work interest you, and which experience helped you decide?'});return qs;
}
export function validateDeepAnswers(questions,body,complete=false){
 if(!['carry','skip'].includes(body.testChoice))throw Error('Choose whether to carry forward your test results or leave tests out.');
 const answers={};for(const q of questions){const a=body.answers?.[q.id];if(!a){if(complete)throw Error('Answer each question, or choose “I don’t know / not applicable”.');continue;}if(a.unknown===true){answers[q.id]={unknown:true,text:''};continue;}if(typeof a.text!=='string'||a.text.trim().length>1500||(complete&&a.text.trim().length<15))throw Error('Add a little more detail, or choose “I don’t know / not applicable”.');answers[q.id]={unknown:false,text:a.text.trim()};}
 if(complete&&body.confirm!==true)throw Error('Confirm that your answers reflect your actual experience.');return {answers,testChoice:body.testChoice};
}
export function evidenceText(row,d){const questions=deepQuestions(row);return row.input.cvText+'\n\nADDITIONAL STUDENT-CONFIRMED EVIDENCE (self-reported, not independently verified):\n'+questions.map(q=>{const a=d.answers?.[q.id];return a&&!a.unknown&&a.text?`${q.source}\n${q.label}\n${a.text}`:''}).filter(Boolean).join('\n\n');}
export function scoreDeep(analysis,row,text){const checked=calculateScores(analysis,row.result.atsReadiness||{score:row.result.breakdown.ats*10},row.input.quiz,text);return {score:Math.round((checked.breakdown.application+checked.breakdown.competency)/55*100),application:checked.breakdown.application,competency:checked.breakdown.competency,competencies:checked.competencies,applicationCriteria:checked.applicationCriteria,summary:analysis.summary,scope:'CV and competency evidence only; numerical, commercial and ATS scores are excluded.',version:'deep-evidence-v1'};}
export function deepSchema(ids){return {type:'object',properties:{summary:{type:'string'},applicationCriteria:{type:'array',minItems:6,maxItems:6,items:{type:'object',properties:{name:{type:'string',enum:['contribution','analysis','outputs','roleRelevance','specificity','clarity']},points:{type:'integer',minimum:0,maximum:5},quotes:{type:'array',items:{type:'string',enum:ids}}},required:['name','points','quotes'],additionalProperties:false}},competencies:{type:'array',minItems:7,maxItems:7,items:{type:'object',properties:{name:{type:'string',enum:COMPETENCIES},score:{type:'integer',minimum:0,maximum:100},reason:{type:'string'},quotes:{type:'array',items:{type:'string',enum:ids}}},required:['name','score','reason','quotes'],additionalProperties:false}}},required:['summary','applicationCriteria','competencies'],additionalProperties:false};}
