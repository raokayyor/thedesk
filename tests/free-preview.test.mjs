import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freeResultPreview} from '../lib/free-result-preview.mjs';
// Self-contained fictional fixture; never depend on a private machine backup.
const katie={result:{overallScore:74,breakdown:{application:24,ats:8,competency:18,numerical:12,technical:12},deskSummary:'Your buyer research shows relevant analysis. '+('The source needs a clearer supported finding. '.repeat(12)),priorities:Array.from({length:3},()=>({title:'Clarify your buyer research finding',description:'Your buyer research names the task but does not state a supported conclusion.'})),competencies:['Analytical ability','Teamwork','Communication','Leadership','Resilience','Commercial awareness','Technical readiness'].map(name=>({name,score:65,reason:'Your buyer research provides a relevant activity but the output needs detail.',nextStep:'Describe a supported output.',quotes:['Researched prospective buyers'],detail:'buyer research'})),applicationCriteria:[],atsReadiness:{score:80,missingKeywords:['valuation']},cvPreview:{original:'Researched prospective buyers',structure:'Completed buyer research using [method] and identified [supported conclusion].',issue:'The research output is not stated.'}}};
test('saved Katie preview has fixed disclosure limits without changing scores or source',()=>{
 const source=katie.result,original=JSON.stringify(source),r=freeResultPreview(source),words=t=>String(t||'').trim().split(/\s+/).length;
 assert.equal(r.overallScore,74);assert.deepEqual(r.breakdown,source.breakdown);assert.equal(JSON.stringify(source),original);
 assert(words(r.deskSummary)<=65);assert.equal(r.priorities.length,3);
 for(const p of r.priorities){assert(words(p.title)<=10);assert(words(p.description)<=24);assert(!/STAR|Use the worked|Before applications/i.test(p.description));}
 for(const c of r.competencies)assert(words(c.reason)<=32);
 assert.equal(r.competencies.filter(c=>c.nextStep).length,1);
 assert.equal(r.applicationCriteria,undefined);assert.equal(r.atsReadiness.missingKeywords,undefined);
 assert(r.cvPreview.structure.includes('buyer research'));assert.equal(r.cvPreview.original,source.cvPreview.original);
 assert.deepEqual(freeResultPreview(r),r);
});
