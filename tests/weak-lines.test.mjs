import test from 'node:test';import assert from 'node:assert/strict';
import {validateWeakLines,missingWeakRepairs} from '../lib/weak-lines.mjs';
import {conversionFacts} from '../lib/result-conversion.mjs';
import {getPartSchema,buildContext} from '../lib/full-cycle-contract.mjs';
const original='Researched twelve companies and presented the findings to an associate.';
const weak=[{original,issue:'The analytical finding is missing.',severity:3}];
test('weak lines must be source exact, unique, short and bounded',()=>{
 assert.deepEqual(validateWeakLines(weak,original),weak);
 assert.throws(()=>validateWeakLines([{...weak[0],original:'Invented task'}],original));
 assert.throws(()=>validateWeakLines([...weak,...weak],original));
 assert.throws(()=>validateWeakLines([{...weak[0],issue:Array(13).fill('word').join(' ')}],original));
 assert.throws(()=>validateWeakLines([{...weak[0],severity:4}],original));
 assert.deepEqual(validateWeakLines([],original),[]);
});
test('free promise and paid coverage follow the same list up to eight',()=>{
 const list=Array.from({length:8},(_,i)=>({...weak[0],original:original+' '+i}));
 const result={overallScore:54,weakLines:list,priorities:[],competencies:[],breakdown:{competency:0},cvPreview:{original:'Old preview'}};
 const facts=conversionFacts(result);assert.equal(facts.otherLines.length,7);assert.equal(facts.cvLineCount,8);assert.equal(facts.primaryLine,list[0].original);
 const ctx=buildContext(result,original.repeat(3));assert.equal(getPartSchema('repair',ctx).properties.bulletRepair.minItems,8);
 assert.equal(missingWeakRepairs(list,list.slice(0,7).map(w=>({originalBullet:w.original}))).length,1);
 assert.equal(conversionFacts({...result,weakLines:[]}).cvLineCount,0);
});
