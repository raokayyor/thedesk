import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../api/analyse-mot.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export const maxDuration=300;','').replace('export default async function handler','async function handler');
test('identical first assessment reuses only the owner-scoped saved result without another model request',async()=>{
 let lookup,linked;
 const context={sameOrigin:()=>true,questionsForRoute:()=>({id:'bank'}),gradeAnswers:()=>({}),assessAtsReadiness:()=>({score:8}),initStore:async()=>{},currentAccount:async()=>({id:'account'}),owner:()=> 'browser-owner',assessmentFingerprint:()=> 'fingerprint',sql:()=>({query:async(query,args)=>{lookup={query,args};return [{id:'saved',input:{quiz:{},cvText:'CV'},result:{overallScore:58,weakLines:[]}}]}}),linkAssessment:async(...args)=>{linked=args},publicAssessment:r=>r,apiFailure:(_,e)=>{throw e}};
 vm.createContext(context);vm.runInContext(source+';this.handler=handler',context);
 let result;const response={json:x=>{result=x},status:()=>response};
 await context.handler({method:'POST',body:{consent:true,profile:{name:'Student',targetSector:'Banking'},cv:{text:'Relevant CV experience and supported personal achievements. '.repeat(3)},answers:{}}},response);
 assert.equal(result.cached,true);assert.equal(result.id,'saved');
 assert.match(lookup.query,/owner_hash=\$1/);assert.match(lookup.query,/root_id IS NULL/);
 assert.deepEqual(Array.from(lookup.args),['browser-owner','fingerprint']);assert.deepEqual(Array.from(linked),['account','saved']);
});
test('loading steps confirm receipt quickly and remain on analysis until completion',()=>{
 const loading=readFileSync(new URL('../assessment-loading.js',import.meta.url),'utf8');
 const code=loading.slice(loading.indexOf('function setStep('),loading.indexOf('\nwindow.assessmentLoading='));
 const items=Array.from({length:4},()=>({className:'',symbol:{textContent:''},querySelector(){return this.symbol}}));let now=0,tick;
 const context={el:{querySelectorAll:()=>items},Date:{now:()=>now},clearInterval(){},setInterval:fn=>{tick=fn;return 1},foot:{},elapsed:{},showStat(){}};
 vm.createContext(context);vm.runInContext('let elapsedTimer,started;'+code+';this.reset=reset',context);context.reset();
 assert.equal(items[0].className,'active');now=1400;tick();assert.equal(items[1].className,'active');
 now=3000;tick();assert.equal(items[2].className,'active');now=45000;tick();assert.equal(items[2].className,'active');assert.equal(items[3].className,'pending');
});
