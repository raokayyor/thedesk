import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ameliaMemberData} from '../lib/amelia-member.mjs';
import {buildRepairedCv} from '../lib/repaired-cv.mjs';
import {hash} from '../lib/report-store.mjs';
const fixture=JSON.parse(readFileSync(new URL('../samples/amelia-report-v3-preview.json',import.meta.url),'utf8'));
test('Amelia opens a completed standard member report with original CV and usable repairs',()=>{
 const d=ameliaMemberData(fixture);
 assert.equal(d.input.profile.name,'Amelia Chen');assert.equal(d.deep.status,'complete');
 assert.equal(d.deep.cvHash,hash(d.input.cvText));assert.equal(d.deep.testChoice,'carry');
 assert.equal(d.result.overallScore,54);assert.equal(d.sample,undefined);
 for(const part of ['verdict','repair','plan'])assert(Object.keys(d.report[part]).length);
 for(const b of d.report.repair.bulletRepair){assert(d.input.cvText.includes(b.originalBullet));for(const q of b.factsUsed)assert(d.input.cvText.includes(q));}
 const cv=buildRepairedCv({...d.input,paid:d.report.repair});assert.equal(cv.candidateName,'Amelia Chen');assert(cv.sourceText.includes('Applied a recurring-revenue'));
 assert.equal(fixture.cv.sourceText.includes('amelia@example.com'),true);
});
