import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('submission waits for browser ownership before starting analysis',async()=>{
 const source=readFileSync(new URL('../assessment-submit.js',import.meta.url),'utf8').split('// Share background preparation')[1].split('for(const button of document.querySelectorAll')[0];
 let release,analysed=false;const ready=new Promise(resolve=>release=resolve),nodes=new Map();const el=k=>{if(!nodes.has(k))nodes.set(k,{value:k==='cvText'?'Synthetic CV evidence '.repeat(20):'student',checked:true,disabled:false,checkValidity:()=>true,style:{},setAttribute(){}});return nodes.get(k)};
 const ctx={document:{getElementById:el,querySelector:()=>({value:'1'})},window:{routeQuizReady:true,deskAssessmentJourney:{ready,track(){},clear(){}},assessmentLoading:{show(){},complete(){},hide(){}}},cvMethod:'paste',score:()=>3,commercial:[],numerical:[],selectedBankId:'bank',location:{search:'',href:''},crypto:globalThis.crypto,DOMException,AbortController,AbortSignal,URLSearchParams,setTimeout,clearTimeout,fetch:async url=>{if(url==='/api/analyse-mot')analysed=true;return {ok:true,json:async()=>({success:true,id:'a'.repeat(48)})}}};
 vm.createContext(ctx);vm.runInContext('// Share background preparation'+source,ctx);const pending=ctx.submitAssessment();await Promise.resolve();assert.equal(analysed,false);release();await pending;assert.equal(analysed,true);
});

