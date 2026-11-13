import test from 'node:test';
import assert from 'node:assert/strict';
import {prepProgress} from '../lib/prep-progress.mjs';
const plan={sevenDayActionPlan:[{focus:'Clarify your contribution'},{focus:'Recheck your improved CV'}],finalSubmissionChecklist:['Check dates']};
test('completed tasks leave the next-action list and undo restores them',()=>{
 const p=prepProgress(plan,{done:{d0:true,d1:false,c0:true,invented:true}});
 assert.equal(p.completed,2);assert.equal(p.total,3);assert.equal(p.next,'Recheck your improved CV');assert.deepEqual(p.remaining.map(x=>x.id),['d1']);
 assert.equal(prepProgress(plan,{done:{}}).next,'Clarify your contribution');assert.equal(p.score,undefined);
});
test('finishing the plan leaves no recycled plan actions',()=>{
 const p=prepProgress(plan,{done:{d0:true,d1:true,c0:true}});assert.equal(p.next,'Plan complete');assert.equal(p.remaining.length,0);
});
