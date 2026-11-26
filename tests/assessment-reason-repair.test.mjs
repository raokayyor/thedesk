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

test('missing numeric facts are routed to the targeted CV rewrite repair',async()=>{let called=false;const input={...draft,cvPreview:{original:'Built a model in 2026 and presented findings to 4 classmates.',structure:'Built a model.'}};const client={messages:{create:async()=>{called=true;return{stop_reason:'tool_use',content:[{type:'tool_use',name:'correct_reasons',input:{corrections:[{name:'CV placeholder',reason:'Built a model in 2026 and presented findings to 4 classmates. [Confirm: the conclusion.]'}]}}]}}}};const r=await repairAssessmentReasons(input,['CV placeholder drops confirmed number 2026.','CV placeholder drops confirmed number 4.'],client,{model:'test'});assert.equal(called,true);assert.match(r.cvPreview.structure,/2026/);assert.deepEqual(r.competencies,input.competencies)});
test('unexpected competency patches are rejected',async()=>{
 const client={messages:{create:async()=>({stop_reason:'tool_use',content:[{type:'tool_use',name:'correct_reasons',input:{corrections:[{name:'Resilience',reason:'Not the requested field.'}]}}]})}};
 assert.equal(await repairAssessmentReasons(draft,['Teamwork reason: invalid'],client,{model:'test'}),null);
});

test('a rejected CV explanation can be corrected without regenerating scores',async()=>{const input={...draft,cvPreview:{original:'Compared suppliers using selection criteria.',issue:'Assessment criteria unclear.',structure:'Compared suppliers using [criteria].'}};const client={messages:{create:async()=>({stop_reason:'tool_use',content:[{type:'tool_use',name:'correct_reasons',input:{corrections:[{name:'CV issue',reason:'Your supplier comparison does not explain which option you recommended.'}]}}]})}};const r=await repairAssessmentReasons(input,['CV issue: remove rubric phrase'],client,{model:'test'});assert.equal(r.cvPreview.issue,'Your supplier comparison does not explain which option you recommended.');assert.deepEqual(r.competencies,input.competencies);assert.equal(r.cvPreview.original,input.cvPreview.original);assert.equal(input.cvPreview.issue,'Assessment criteria unclear.');});
