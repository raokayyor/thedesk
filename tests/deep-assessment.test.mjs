import test from 'node:test';import assert from 'node:assert/strict';
import {deepQuestions,validateDeepAnswers,evidenceText,scoreDeep,initialDeepAnswers} from '../lib/deep-assessment.mjs';
import {COMPETENCIES} from '../lib/assessment-scoring.mjs';
const cv='Jamie Patel\nEXPERIENCE\nCafe — Team Member, 2025\n- Served customers and checked daily till totals alongside colleagues on the weekend shift.\nPROJECTS\n- Compared public annual reports for three companies and presented the findings in a university seminar.';
const row={id:'a'.repeat(48),input:{cvText:cv,profile:{targetFirm:'HSBC'},quiz:{numericalCorrect:3,commercialCorrect:2}},result:{cvPreview:{original:'- Served customers and checked daily till totals alongside colleagues on the weekend shift.'},priorities:[],atsReadiness:{score:70}}};
test('follow-ups are anchored to actual CV, not invented experience',()=>{const q=deepQuestions(row);assert.equal(q.length,7);assert.ok(q.filter(x=>x.id!=='motivation').every(x=>cv.includes(x.source)));assert.equal(q[0].source,row.result.cvPreview.original);});
test('completion requires every response or explicit unknown and factual confirmation',()=>{const q=deepQuestions(row);assert.throws(()=>validateDeepAnswers(q,{testChoice:'skip',answers:{},confirm:true},true));const answers=Object.fromEntries(q.map(x=>[x.id,{unknown:true,text:'Invented number 10000'}]));assert.throws(()=>validateDeepAnswers(q,{testChoice:'skip',answers},true));const d=validateDeepAnswers(q,{testChoice:'skip',answers,confirm:true},true);assert.ok(Object.values(d.answers).every(x=>!x.text));assert.equal(d.testChoice,'skip');assert.ok(!evidenceText(row,d).includes('10000'));});
test('deep evidence score excludes test scores, validates quotes and has no paid uplift',()=>{const analysis={summary:'Evidence remains limited.',applicationCriteria:['contribution','analysis','outputs','roleRelevance','specificity','clarity'].map(name=>({name,points:0,quotes:[]})),competencies:COMPETENCIES.map(name=>({name,score:0,reason:'Not evidenced.',quotes:[]}))};assert.equal(scoreDeep(analysis,row,cv).score,0);const highTests={...row,input:{...row.input,quiz:{numericalCorrect:5,commercialCorrect:5}}};assert.equal(scoreDeep(analysis,highTests,cv).score,0);analysis.applicationCriteria[0]={name:'contribution',points:4,quotes:['not in the CV']};assert.throws(()=>scoreDeep(analysis,row,cv));});

test('free line fix answer is carried into its matching evidence question',()=>{
 const prepared={...row,input:{...row.input,freeLineFix:{answer:'I checked till totals against receipts and flagged discrepancies to the supervisor.'}}};
 const seeded=initialDeepAnswers(prepared);assert.equal(seeded['experience-0-finding'].text,prepared.input.freeLineFix.answer);assert.equal(seeded['experience-0-finding'].fromFreeFix,true);
});
test('probing questions differ between analytical and people evidence',()=>{
 const q=deepQuestions(row);assert.match(q[0].label,/trusted/);assert.match(q[3].label,/analyse/);assert.ok(q.every(x=>x.hint));
});
test('unanchored weak lines are not turned into experiences',()=>{
 const prepared={...row,result:{...row.result,weakLines:[{original:'Invented investment banking internship with £8 million revenue',issue:'Needs detail'}]}};
 assert.ok(deepQuestions(prepared).filter(q=>q.id!=='motivation').every(q=>cv.includes(q.source)));
});
test('question wording is not submitted as evidence for scoring or repairs',()=>{
 const q=deepQuestions(row),answer='I checked the till totals against receipts and asked a colleague to verify the discrepancy.';
 const data={answers:{[q[0].id]:{text:answer,unknown:false}}};const text=evidenceText(row,data);
 assert.ok(text.includes(answer));assert.ok(!text.includes(q[0].label));assert.ok(!text.includes(q[0].hint));
});
