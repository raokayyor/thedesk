import assert from 'node:assert/strict';
import {applyEvidenceReview,reviewItems} from '../lib/evidence-review.mjs';
import {buildRepairedCv} from '../lib/repaired-cv.mjs';
import {buildContext,getPartSchema,buildPartPrompt} from '../lib/full-cycle-contract.mjs';
const report=()=>({bulletRepair:[{originalBullet:'Compared venue prices.',exampleBullet:'Saved the committee £500.',questionsToConfirm:[]}],competencyRepair:[{draftAnswer:'The team cleared the backlog.',sampleAnswer:'Unsafe fallback'},{draftAnswer:null,nextAction:'Give an example.'}]});
const r=report();assert.equal(reviewItems(r).length,2);
assert.throws(()=>applyEvidenceReview(r,[]),/Incomplete/);
assert.throws(()=>applyEvidenceReview(r,[{id:'bullet-0',supported:true,reason:'',question:''},{id:'bullet-0',supported:true,reason:'',question:''}]),/Invalid/);
applyEvidenceReview(r,[{id:'bullet-0',supported:false,reason:'No savings confirmed',question:'What prices did you record?'},{id:'competency-0',supported:false,reason:'No clearance confirmed',question:'What happened to the outstanding orders?'}]);
assert.equal(r.bulletRepair[0].exampleBullet,'Compared venue prices.');assert.equal(r.bulletRepair[0].rewriteStatus,'needs_details');assert.equal(r.competencyRepair[0].draftAnswer,null);assert.equal(r.competencyRepair[0].sampleAnswer,'');assert.match(r.competencyRepair[0].nextAction,/outstanding orders/);
const ctx=buildContext({overallScore:58},'Candidate\nEXPERIENCE\n'+'Compared supplier prices and presented options to the committee. '.repeat(3));const schema=getPartSchema('repair',ctx);assert(schema.properties.competencyRepair.items.properties.draftAnswer.type.includes('null'));assert.match(buildPartPrompt('repair',ctx),/Do not force all seven/);
console.log('PASS complete review coverage, duplicate rejection, unsupported outcomes withheld, explicit CV status and optional competency drafts');

const original="Compared supplier prices and presented options to the committee.";const cv="Candidate\nEXPERIENCE\nSociety — Volunteer, 2026\n"+original+"\nRecorded the prices in a spreadsheet.\nSKILLS\nExcel and research.";const unchanged={bulletRepair:[{originalBullet:original,exampleBullet:original,factsUsed:[original,"Recorded the prices in a spreadsheet."],questionsToConfirm:["Which criteria did you use?"]}],competencyRepair:Array.from({length:7},()=>({draftAnswer:null,evidenceSourceIds:[]})),interviewRiskMap:[{},{},{}]};const built=buildRepairedCv({cvText:cv,paid:unchanged});assert.equal(built.whatChangedAndWhy.length,0);assert(!built.sections.flatMap(s=>s.items.flatMap(i=>i.bullets)).some(b=>b.rewritten));console.log("PASS unchanged bullets are not counted as CV improvements; missing examples remain optional");
