import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../api/analyse-mot.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export const maxDuration=300;','').replace('export default async function handler','async function handler');
test('identical first assessment reuses only the owner-scoped saved result without another model request',async()=>{
 let lookup,linked;
 const context={sameOrigin:()=>true,recordMembershipAccess:async()=>true,questionsForRoute:()=>({id:'bank'}),gradeAnswers:()=>({}),assessAtsReadiness:()=>({score:8}),initStore:async()=>{},currentAccount:async()=>({id:'account'}),owner:()=> 'browser-owner',assessmentFingerprint:()=> 'fingerprint',sql:()=>({query:async(query,args)=>{lookup={query,args};return [{id:'saved',input:{quiz:{},cvText:'CV'},result:{overallScore:58,weakLines:[]}}]}}),linkAssessment:async(...args)=>{linked=args},publicAssessment:r=>r,apiFailure:(_,e)=>{throw e}};
 vm.createContext(context);vm.runInContext(source+';this.handler=handler',context);
 let result;const response={json:x=>{result=x},status:()=>response};
 await context.handler({method:'POST',body:{consent:true,profile:{name:'Student',targetSector:'Banking'},cv:{text:'Relevant CV experience and supported personal achievements. '.repeat(3)},answers:{}}},response);
 assert.equal(result.cached,true);assert.equal(result.next,'/deep-assessment.html?id=saved');assert.equal(result.id,'saved');
 assert.match(lookup.query,/owner_hash=\$1/);assert.match(lookup.query,/root_id IS NULL/);
 assert.deepEqual(Array.from(lookup.args),['browser-owner','fingerprint']);assert.deepEqual(Array.from(linked),['account','saved']);
});
test('five checks follow server milestones without an elapsed timer or timed completion',()=>{
 const loading=readFileSync(new URL('../assessment-loading.js',import.meta.url),'utf8');
 const code=loading.slice(loading.indexOf('function setStep('),loading.indexOf('\nwindow.assessmentLoading='));
 const items=Array.from({length:5},()=>({className:'',symbol:{textContent:''},querySelector(){return this.symbol}}));let now=0,tick;
 const context={serverStage:'checking',el:{querySelectorAll:()=>items},Date:{now:()=>now},clearInterval(){},setInterval:fn=>{tick=fn;return 1},foot:{},showStat(){}};
 vm.createContext(context);vm.runInContext('let tipTimer,started;'+code+';this.reset=reset;this.updateStage=updateStage',context);context.reset();
 assert.deepEqual(items.map(x=>x.className),['done','done','active','pending','pending']);
 now=90000;tick();assert.equal(items[2].className,'active');assert.equal(items[3].className,'pending');
 context.serverStage='validating';context.updateStage();assert.equal(items[3].className,'active');assert.equal(items[4].className,'pending');
 context.serverStage='saving';context.updateStage();assert.equal(items[4].className,'active');
 context.serverStage='complete';context.updateStage();assert.ok(items.every(x=>x.className==='done'));
 assert.doesNotMatch(loading,/Elapsed:|role.*timer|loading-elapsed/);
 assert.match(loading,/Applying The Desk’s practitioner framework/);
});
