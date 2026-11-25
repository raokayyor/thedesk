import test from 'node:test';
import assert from 'node:assert/strict';
import {publicPractice,markPractice,practiceItems} from '../lib/aptitude-practice.mjs';
import {firmKey,FIRM_PRACTICE} from '../data/firm-practice.mjs';
test('free payload contains five SJT/verbal and four reasoning items and no answers or explanations',()=>{
 const data=publicPractice(false);for(const type of ['sjt','verbal','inductive','deductive'])assert.equal(practiceItems(type,false).length,['sjt','verbal'].includes(type)?5:4);
 function check(o){if(!o||typeof o!=='object')return;for(const [k,v]of Object.entries(o)){assert.ok(!['answer','best','worst','why'].includes(k),'private key '+k);check(v);}}check(data);
});
test('full member tests have complete, distinct keys and score perfect answers correctly',()=>{
 for(const type of ['sjt','verbal','inductive','deductive']){const items=practiceItems(type,true);assert.equal(new Set(items.map(x=>x.id)).size,items.length);const answers=items.map(q=>{if(type==='sjt'){assert.notEqual(q.best,q.worst);assert.equal(q.why.length,4);return {most:q.best,least:q.worst};}if(q.options)assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.why);return q.answer;});assert.equal(markPractice(type,answers,true).percent,100);}
});
test('server rejects full-test submissions by free users and invalid SJT choices',()=>{
 assert.throws(()=>markPractice('sjt',practiceItems('sjt',true).map(q=>({most:q.best,least:q.worst})),false));
 assert.throws(()=>markPractice('sjt',Array(4).fill({most:1,least:1}),false));
 assert.throws(()=>markPractice('verbal',['T','F','made up',null],false));
});
test('unanswered items score zero and some does not establish all in verbal reasoning',()=>{
 assert.equal(markPractice('verbal',Array(5).fill(null),false).score,0);
 assert.equal(practiceItems('verbal',true).find(q=>q.id==='v1-13').answer,'C');
});
test('firm labels and RBS aliases map to the source-checked practice mix',()=>{
 assert.equal(firmKey('RBS'),'natwest');assert.equal(firmKey('J.P. Morgan'),'jpm');assert.equal(firmKey('UBS'),'ubs');assert.ok(FIRM_PRACTICE.ubs.types.includes('inductive'));assert.ok(FIRM_PRACTICE.pwc.types.includes('deductive'));
});

test('expanded stock exposes accurate counts while free trials keep their format-specific limits',()=>{
 const counts={sjt:24,verbal:32,inductive:24,deductive:16};
 for(const [type,count]of Object.entries(counts)){
  const items=practiceItems(type,true);assert.equal(items.length,count);assert.equal(practiceItems(type,false).length,['sjt','verbal'].includes(type)?5:4);
  for(const q of items){assert.ok((q.scenario||q.passage?.text||q.passage||q.sequence));if(q.options)assert.ok(q.options[q.answer??q.best]);}
 }
 const full=publicPractice(true),free=publicPractice(false);
 assert.equal(full.SJT.fullCount,24);assert.equal(free.VERBAL.fullCount,32);
 assert.equal(full.REASONING.inductive.fullCount,24);assert.equal(full.REASONING.deductive.fullCount,16);
});

import {quizWin} from '../lib/free-try-content.mjs';
import {trialContext} from '../lib/trial-content.mjs';
test('reasoning trial exposes and marks exactly one question without shortening member tests',()=>{const ctx={profile:{targetFirm:'Barclays',targetSector:'General Finance'},row:{id:'sample:amelia',result:{}},cv:'Education: Economics at Bristol. Work experience: researched companies in Excel.',sample:true,isGuest:true};for(const type of ['sjt','verbal']){const view=trialContext(ctx,type);assert.equal(view.quiz.length,1);const q=practiceItems(type,false)[0],answers=[type==='sjt'?{most:q.best,least:q.worst}:q.answer],result=quizWin(type,answers,1);assert.equal(result.score,1);assert.equal(result.total,1);assert.match(result.tag,/1\/1/);assert.ok(result.note);assert.throws(()=>quizWin(type,[...answers,...answers],1));assert.ok(practiceItems(type,true).length>1);}});
