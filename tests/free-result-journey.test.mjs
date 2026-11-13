import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('completed free assessment goes to its free result, even in a signed-in browser',async()=>{
 const source=readFileSync(new URL('../assessment-submit.js',import.meta.url),'utf8').split('async function submitAssessment(){')[1];
 const nodes=new Map(),id='b'.repeat(48);const el=k=>{if(!nodes.has(k))nodes.set(k,{value:k==='cvText'?'CV evidence supplied for testing':'student',checked:true,style:{},setAttribute(){}});return nodes.get(k)};
 const ctx={document:{getElementById:el,querySelector:()=>({value:'1'})},window:{routeQuizReady:true,assessmentLoading:{show(){},complete(){},hide(){}}},selectedBankId:'bank',location:{search:'',href:''},AbortController,URLSearchParams,setTimeout,clearTimeout,fetch:async()=>({ok:true,json:async()=>({success:true,id})})};
 vm.createContext(ctx);await vm.runInContext('(async function(){'+source+')()',ctx);
 assert.equal(ctx.location.href,'/result-final-design.html?id='+id);
});

