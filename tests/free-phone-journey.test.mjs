import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {freeTryContext,contentWin,quizWin,LEADERSHIP_QUESTION,BALANCING_QUESTION} from '../lib/free-try-content.mjs';
import {evidenceSources,buildInterviewGuide} from '../lib/interview-evidence-guide.mjs';
import {sampleFreeStudent} from '../lib/interview-taster-context.mjs';
import {upgradedReturn} from '../lib/tier-journey.mjs';
const sample=await sampleFreeStudent,ctx={account:{id:'one-student'},cv:sample.originalCvText,profile:sample.profile,sample:true,row:{input:{},result:sample.result},question:LEADERSHIP_QUESTION,saved:{state:{}}};
test('leadership selects the training story, with decision and response gaps; balancing names both commitments',()=>{
 const sources=evidenceSources(ctx.cv),lead=buildInterviewGuide(sources,LEADERSHIP_QUESTION,{kind:'competency'}).examples[0];
 assert.match(lead.source,/Pho House/);assert.match(lead.beats[2].text,/train.*(?:3|three)/i);assert.deepEqual(lead.beats.filter(b=>b.gap).map(b=>b.text),['What did you decide?','How did they respond?']);
 const balance=buildInterviewGuide(sources,BALANCING_QUESTION,{kind:'competency'}).examples[0];assert.match(balance.source,/Pho House/);assert.match(balance.beats[0].text,/Pho House/);assert.match(balance.beats[0].text,/stud|degree/i);assert.match(balance.beats[1].text,/prioritis/i);
});
test('a CV fix uses the submitted line and own detail, not a sample achievement',()=>{
 const own={...ctx,cv:'Alex\nEDUCATION\nBSc Finance University of Nottingham\nEXPERIENCE\nShop — Team member\n- Served customers at weekends.',sample:false};
 const win=contentWin(own,'cv',{text:'I served customers at weekends.',detail:'I trained two new colleagues.'});assert.equal(win.before,'I served customers at weekends.');assert.match(win.after,/Served customers.*trained two/);assert.doesNotMatch(win.after,/12|Redcliffe|Pho House/);
});
test('why-firm opening uses only the chosen firm pack, evidence and the student reason',()=>{
 const win=contentWin(ctx,'application',{firm:'barclays',text:'I want to understand how financing and advice fit together.'});assert.equal(win.parts.length,3);assert.match(win.hook,/UK-headquartered/);assert.match(win.after,/financing and advice/);assert.doesNotMatch(win.after,/great reputation/);
 const noReason=contentWin(ctx,'application',{firm:'rothschild'});assert.ok(noReason.parts[1].gap);
});
test('test context contains five public questions without answer keys, and gives a worked result',()=>{
 for(const tool of ['sjt','verbal']){const data=freeTryContext(ctx,tool);assert.equal(data.quiz.length,5);for(const q of data.quiz)for(const secret of ['answer','best','worst','why'])assert.equal(q[secret],undefined);}
 const result=quizWin('sjt',Array.from({length:5},()=>({most:1,least:3})));assert.equal(result.total,5);assert.match(result.tag,/\/5/);assert.ok(result.after);assert.ok(result.note);
});
test('upgrade keeps the exact free-tool route so its saved result can reopen',()=>assert.equal(upgradedReturn('/free-try.html?tool=cv'),'/free-try.html?tool=cv&upgraded=1'));
test('the API returns the original saved result even if a repeat submits different text',async()=>{
 const win={before:'Original',after:'Kept forever',score:71};
 let generations=0;const scope=vm.createContext({Object,Error,String,FREE_TOOLS:{cv:'CV line'},sameOrigin:()=>true,isPaidOwner:async()=>false,startTaster:async()=>({...ctx,saved:{state:{win:{result:win}},completed_at:new Date().toISOString()}}),freeTryContext:()=>({tool:'cv'}),tasterRun:()=>{generations++;},tasterError:(r,e)=>r.status(500).json({error:e.message})});
 const source=readFileSync(new URL('../api/free-try.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export const maxDuration','const maxDuration').replace('export default async function handler','async function handler');vm.runInContext(source+';globalThis.handler=handler;',scope);
 let data;const response={setHeader(){},status(){return this;},json(d){data=d;}};await scope.handler({method:'POST',body:{tool:'cv',text:'A different attempted second answer'}},response);assert.equal(data.win.after,'Kept forever');assert.equal(generations,0);
});
