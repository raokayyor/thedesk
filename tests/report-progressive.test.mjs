import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../fullcycle.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('async function load(){'),html.indexOf('function safeLink(')).replace("await import('/lib/report-read.mjs')",'({})');
test('saved findings appear before generation and CV starts before the slow plan finishes',async()=>{
 const events=[],pending={};let shown=false;
 const saved={paid:true,profile:{name:'Student'},deep:{status:'complete',evaluation:{score:62}},report:{},result:{},quiz:{}};
 const context={URLSearchParams,AbortController,AbortSignal,DOMException,setTimeout,clearTimeout,location:{search:'?id='+ 'a'.repeat(48),pathname:'/fullcycle.html'},document:{getElementById:()=>({})},window:{DeskReportLoading:{mount:()=>({mark:(p,s)=>events.push(p+':'+s)})}},showReportAsItBuilds:()=>{shown=true;events.push('visible')},showFinishedPart:p=>events.push('shown:'+p),api:async(url,options)=>{if(url.startsWith('/api/assessment-result'))return saved;if(url==='/api/generate-cv'){events.push('cv-start');return{cv:{sourceText:'CV'}};}assert.ok(shown,'render saved findings before starting model requests');const part=JSON.parse(options.body).part;return new Promise(resolve=>pending[part]=resolve);}};
 vm.createContext(context);vm.runInContext(code+';this.load=load;',context);const result=context.load();await new Promise(r=>setImmediate(r));assert.equal(events[0],'visible');
 pending.repair({data:{bulletRepair:[]}});await new Promise(r=>setImmediate(r));assert.ok(events.includes('shown:repair'));assert.ok(events.includes('cv-start'));assert.ok(!events.includes('plan:done'));
 pending.verdict({data:{executiveVerdict:{}}});pending.plan({data:{sevenDayActionPlan:[]}});const report=await result;assert.equal(report.cv.sourceText,'CV');assert.equal(report.deep.evaluation.score,62);
});
