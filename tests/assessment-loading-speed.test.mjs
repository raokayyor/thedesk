import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../api/analyse-mot.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export const maxDuration=300;','').replace('export default async function handler','async function handler');
test('identical first assessment reuses only the owner-scoped saved result without another model request',async()=>{
 let lookup,linked;
 const context={verifiedCvUpload:async()=>({kind:"paste",readabilityPassed:false}),stableScoreCache:{freeze:async r=>r},sameOrigin:()=>true,recordMembershipAccess:async()=>true,questionsForRoute:()=>({id:'bank'}),gradeAnswers:()=>({}),assessAtsReadiness:()=>({score:8}),initStore:async()=>{},currentAccount:async()=>({id:'account'}),owner:()=> 'browser-owner',assessmentFingerprint:()=> 'fingerprint',sql:()=>({query:async(query,args)=>{lookup={query,args};return [{id:'saved',input:{quiz:{},cvText:'CV',cvUpload:{kind:'paste',readabilityPassed:false}},result:{overallScore:58,weakLines:[]}}]}}),linkAssessment:async(...args)=>{linked=args},publicAssessment:r=>r,assessmentEntry:r=>r,apiFailure:(_,e)=>{throw e}};
 vm.createContext(context);vm.runInContext(source+';this.handler=handler',context);
 let result;const response={json:x=>{result=x},status:()=>response};
 await context.handler({method:'POST',body:{consent:true,profile:{name:'Student',targetSector:'Banking'},cv:{text:'Relevant CV experience and supported personal achievements. '.repeat(3)},answers:{}}},response);
 assert.equal(result.cached,true);assert.equal(result.next,'/deep-assessment.html?id=saved');assert.equal(result.id,'saved');
 assert.match(lookup.query,/owner_hash=\$1/);assert.match(lookup.query,/root_id IS NULL/);
 assert.deepEqual(Array.from(lookup.args),['browser-owner','fingerprint']);assert.deepEqual(Array.from(linked),['account','saved']);
});
test('advancing to the next visual step ticks every preceding step and never moves backwards',()=>{
 const loading=readFileSync(new URL('../assessment-loading.js',import.meta.url),'utf8');
 const code=loading.slice(loading.indexOf('function setStep('),loading.indexOf('\nwindow.assessmentLoading='));
 const items=Array.from({length:6},()=>({className:'',symbol:{textContent:''},querySelector(){return this.symbol}}));let now=0,tick;
 const context={resultReady:false,serverStage:'checking',el:{classList:{remove(){}},querySelectorAll:()=>items,querySelector:()=>({style:{}})},Date:{now:()=>now},clearInterval(){},setInterval:fn=>{tick=fn;return 1},foot:{},showStat(){}};
 vm.createContext(context);vm.runInContext('let tipTimer,started,motionTimer,visualProgress=8,visualStep=2;'+code+';this.reset=reset;this.updateStage=updateStage',context);context.reset();
 assert.deepEqual(items.map(x=>x.className),['done','done','active','pending','pending','pending']);
 now=23000;context.updateStage();assert.equal(items[2].className,'done');assert.equal(items[3].className,'active');
 now=45000;context.updateStage();assert.equal(items[3].symbol.textContent,'✓');assert.equal(items[4].className,'active');
 now=90000;context.updateStage();assert.equal(items[5].className,'active');assert.equal(items.filter(x=>x.className==='done').length,5);
 context.serverStage='validating';context.updateStage();assert.equal(items[5].className,'active');assert.equal(items[3].symbol.textContent,'✓');
 now=180000;context.updateStage();assert.equal(items[5].className,'active');assert.equal(items.filter(x=>x.className==='done').length,5);
 context.serverStage='saving';context.updateStage();assert.equal(items[5].className,'active');
 context.serverStage='complete';context.updateStage();assert.ok(items.every(x=>x.className==='done'));
 assert.match(loading,/loading-sweep/);assert.match(loading,/Still processing/);
 assert.doesNotMatch(loading,/Elapsed:|role.*timer|loading-elapsed/);
 assert.match(loading,/Applying The Desk’s practitioner framework/);
});

test('a ready result still shows the progress walkthrough for ten seconds, without delaying a slow result further',()=>{const s=readFileSync(new URL('../assessment-loading.js',import.meta.url),'utf8');const code=s.slice(s.indexOf('function minimumLoadingWait('),s.indexOf('function updateStage('));const box={};vm.runInNewContext(code+';this.wait=minimumLoadingWait',box);assert.equal(box.wait(1000,1000),10000);assert.equal(box.wait(1000,2000),9000);assert.equal(box.wait(1000,11000),0);assert.equal(box.wait(1000,61000),0);assert.match(s,/async complete\(\)[\s\S]*await new Promise[\s\S]*minimumLoadingWait/);assert.match(s,/Automated assessment using our practitioners’ review criteria/);assert.doesNotMatch(s,/a practitioner is reviewing|human review in progress/i);});

 test('a fast result walks each checklist stage rather than jumping straight to done',()=>{const s=readFileSync(new URL('../assessment-loading.js',import.meta.url),'utf8');const code=s.slice(s.indexOf('function minimumLoadingWait('),s.indexOf('function updateStage('));const box={};vm.runInNewContext(code+';this.step=loadingVisualStep',box);assert.deepEqual([0,1000,2500,5000,7500,9999].map(ms=>box.step(5,0,ms)),[2,2,3,4,5,5]);assert.equal(box.step(6,0,10000),6);assert.match(s,/loading-human-copy\{display:block!important/);});
