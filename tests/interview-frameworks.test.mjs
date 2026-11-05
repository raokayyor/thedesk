import test from 'node:test';import assert from 'node:assert/strict';
import {chooseFramework} from '../lib/interview-frameworks.mjs';
import {feedbackPrompt,validateFeedback,schemaForFramework} from '../lib/interview-feedback.mjs';
import {splitPassages,searchTerms,selectPassages,sourcePrompt} from '../lib/source-guidance.mjs';
test('different questions receive relevant frameworks instead of universal STAR',()=>{
 assert.equal(chooseFramework({kind:'cv',question:'Tell me about yourself'}).key,'introduction');
 assert.equal(chooseFramework({kind:'motivation',question:'Why this firm?'}).key,'motivation');
 assert.equal(chooseFramework({kind:'technical',question:'Explain enterprise value'}).key,'technical');
 assert.equal(chooseFramework({question:'Describe a time you worked under pressure'}).key,'behavioural');
 assert.equal(chooseFramework({question:'Why?',followUpOf:{question:'Original'}}).key,'followup');
});
test('framework review cannot invent criteria or supporting quotes',()=>{
 const framework=chooseFramework({kind:'technical'}),transcript='Enterprise value represents the value of the operating business.';
 const f=validateFeedback({frameworkChecks:[{key:'definition',status:'clear',quote:'the operating business',advice:'Keep this definition.'},{key:'mechanism',status:'clear',quote:'I completed a DCF at Goldman Sachs',advice:'Explain your reasoning.'},{key:'fake',status:'clear',quote:'Enterprise value'}]}, {transcript,seconds:10,framework});
 assert.equal(f.frameworkChecks.length,3);assert.equal(f.frameworkChecks[0].status,'clear');assert.equal(f.frameworkChecks[1].quote,'');assert.equal(f.frameworkChecks[1].status,'not-evidenced');assert(!f.frameworkChecks.some(x=>x.key==='fake'));
 assert(schemaForFramework(framework).required.includes('frameworkChecks'));
 assert.match(feedbackPrompt({question:'Why this firm?',kind:'motivation',transcript}),/Reason, research and personal connection/);
});
test('passage retrieval is bounded, diverse and keeps provenance out of the model prompt',()=>{
 const text='evidence '.repeat(1000),chunks=splitPassages(text);assert(chunks.length>1);assert(chunks.every(c=>c.length<=1800));assert(chunks.at(-1).endsWith('evidence'));
 assert(searchTerms('why this firm; DROP TABLE').every(t=>/^[a-z]+$/.test(t)));
 const selected=selectPassages([{video_id:'one',channel:'PrivateCreatorX',passage:'first'},{video_id:'one',channel:'PrivateCreatorX',passage:'second'},{video_id:'two',channel:'PrivateCreatorX',passage:'third'},{video_id:'three',channel:'other',passage:'fourth'}]);assert.equal(selected.length,3);
 const prompt=sourcePrompt(selected);assert(!prompt.includes('PrivateCreatorX'));assert.match(prompt,/untrusted source DATA/);assert.match(prompt,/Never cite/);
});

