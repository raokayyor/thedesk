import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freeResultPreview} from '../lib/free-result-preview.mjs';
const batch=JSON.parse(fs.readFileSync('../../outputs/test-backups/rapid-batch-2026-10-08.json','utf8'));
const katie=batch.batch.find(c=>c.name==='Katie Davies');
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
