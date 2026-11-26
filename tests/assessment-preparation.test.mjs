import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assessment-submit.js',import.meta.url),'utf8').split('// Share background preparation')[1].split('for(const button of document.querySelectorAll')[0];
function setup(request){
 const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='name'?'':id==='preparationGoal'?'':id==='cvText'?'Synthetic CV evidence '.repeat(20):'student',checked:true,disabled:false,setAttribute(){}});return nodes.get(id)};
 let calls=0,shown=0;
 const context={document:{getElementById:el,querySelector:()=>({value:'1'})},window:{routeQuizReady:true,assessmentLoading:{show(){shown++},complete(){},hide(){},fail(){}}},cvMethod:'paste',score:()=>3,commercial:[],numerical:[],selectedBankId:'bank',location:{search:'',href:''},crypto:globalThis.crypto,DOMException,AbortController,AbortSignal,URLSearchParams,setTimeout,clearTimeout,fetch:async(url,options)=>{if(url==='/api/membership')return{ok:true,json:async()=>({member:false})};calls++;return request(options,calls)}};
 vm.createContext(context);vm.runInContext('// Share background preparation'+source,context);
 return{context,el,calls:()=>calls,shown:()=>shown};
}
const success=()=>({ok:true,json:async()=>({success:true,id:'abc'})});
test('background preparation starts before Build and Build reuses the pending request',async()=>{
 let finish;const s=setup(()=>new Promise(resolve=>finish=resolve));
 const task=s.context.prepareAssessment();await Promise.resolve();assert.equal(s.calls(),1);assert.equal(s.shown(),0);assert.equal(s.context.location.href,'');
 s.el('preparationGoal').value='tests';assert.equal(s.context.prepareAssessment(),task);
 const submitted=s.context.submitAssessment();await Promise.resolve();assert.equal(s.calls(),1);finish(success());await submitted;
 assert.equal(s.context.location.href,'/result-final-design.html?id=abc');assert.equal(s.shown(),1);
});
test('completed background result opens without generating again',async()=>{const s=setup(success);await s.context.prepareAssessment().promise;await s.context.submitAssessment();assert.equal(s.calls(),1);assert.equal(s.context.location.href,'/result-final-design.html?id=abc')});
test('failed preparation retries and changed CV does not reuse stale inputs',async()=>{
 const s=setup((_,n)=>n===1?{ok:false,json:async()=>({error:'temporary failure'})}:success());
 assert.ok((await s.context.prepareAssessment().promise).error);await s.context.submitAssessment();assert.equal(s.calls(),2);
 s.el('cvText').value+=' New evidence';await s.context.prepareAssessment().promise;assert.equal(s.calls(),3);
});
test('missing consent never starts generation and leaving review aborts the request',async()=>{
 const s=setup(success);s.el('processingConsent').checked=false;assert.equal(s.context.prepareAssessment(),null);assert.equal(s.calls(),0);
 s.el('processingConsent').checked=true;const task=s.context.prepareAssessment();s.context.cancelAssessmentPreparation();assert.equal(task.controller.signal.aborted,true);assert.ok((await task.promise).error);assert.equal(s.calls(),0);
});
