import test from 'node:test';
import assert from 'node:assert/strict';
import {repairAssessmentReasons} from '../lib/assessment-reason-repair.mjs';
const draft={competencies:[{name:'Teamwork',score:45,detail:'Campus Cafe',reason:'Campus Cafe gives no personal contribution.',quotes:['Trained two new colleagues on tills.']}],applicationCriteria:[{name:'outputs',points:3}],priorities:[]};
test('targeted explanation repair retains all scores, quotes and unrelated assessment data',async()=>{
 let request;const client={messages:{create:async body=>{request=body;return {stop_reason:'tool_use',content:[{type:'tool_use',name:'correct_reasons',input:{corrections:[{name:'Teamwork',reason:'Campus Cafe training shows personal contribution, but the impact on new colleagues is not stated.'}]}}]}}}};
 const repaired=await repairAssessmentReasons(draft,['Teamwork reason: the cited CV entry already describes personal actions/decisions.'],client,{model:'test'});
 assert.equal(repaired.competencies[0].score,45);assert.deepEqual(repaired.competencies[0].quotes,draft.competencies[0].quotes);assert.deepEqual(repaired.applicationCriteria,draft.applicationCriteria);assert.match(draft.competencies[0].reason,/no personal/);assert.equal(request.max_tokens,700);
});
test('scoring and evidence failures cannot be repaired by changing explanations',async()=>{
 let called=false;const client={messages:{create:async()=>{called=true;}}};
 assert.equal(await repairAssessmentReasons(draft,['Invalid competency evidence'],client),null);assert.equal(called,false);
});
test('unexpected competency patches are rejected',async()=>{
 const client={messages:{create:async()=>({stop_reason:'tool_use',content:[{type:'tool_use',name:'correct_reasons',input:{corrections:[{name:'Resilience',reason:'Not the requested field.'}]}}]})}};
 assert.equal(await repairAssessmentReasons(draft,['Teamwork reason: invalid'],client,{model:'test'}),null);
});
