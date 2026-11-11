import '../group-roles.js';import '../group-updates.js';
import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import vm from'node:vm';
const html=readFileSync(new URL('../group-exercise.html',import.meta.url),'utf8'),script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n');
test('floor request waits for a candidate to finish, names student, then resumes after contribution',async()=>{
 const nodes=new Map(),logs=[],pending=[];const make=()=>({value:'',checked:false,disabled:false,textContent:'',innerHTML:'',events:{},classList:{toggle(){},add(){},remove(){}},addEventListener(k,f){this.events[k]=f},querySelectorAll(){return[]},closest(){return this},setAttribute(){},focus(){},matches(){return false},appendChild(e){logs.push(e.innerHTML)}});const el=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id)};
 const scenario={id:'mendip',title:'Mendip',brief:'Brief',options:[{name:'A',facts:'Facts'}],extra:'More'};el('candidateName').value='Jack';el('discussionMode').value='open';el('studentRole').value='random';el('chairMode').value='ai';
 const browser={addEventListener(){},scrollTo(){}};const fetcher=async(url,opts)=>{if(url.includes('desk-home'))return{json:async()=>({profile:{}})};if(!opts)return{ok:true,json:async()=>({member:true,voice:false,scenarios:[scenario]})};const b=JSON.parse(opts.body);if(b.action==='group-turn')return await new Promise(resolve=>pending.push({body:b,resolve:turns=>resolve({ok:true,status:200,json:async()=>({turns})})}));throw Error('Unexpected request')};
 const c={DeskGroupRoles:globalThis.DeskGroupRoles,DeskGroupUpdates:globalThis.DeskGroupUpdates,window:browser,document:{getElementById:el,createElement:make},fetch:fetcher,navigator:{mediaDevices:{getUserMedia:async()=>{throw Error('test microphone unavailable')}}},AbortSignal,Date,Promise,setInterval:()=>1,clearInterval(){},setTimeout:(f,ms)=>{if(ms<12000)queueMicrotask(f);return 1},clearTimeout(){},console};vm.createContext(c);vm.runInContext(script,c);
 const flush=async()=>{for(let i=0;i<80;i++)await Promise.resolve()};await flush();
 // The selected case is supplied by the same rendered case button listener.
 const button=make();button.dataset={id:'mendip'};el('scen').querySelectorAll=()=>[button];
 // Reload creates listeners for the mocked case button.
 vm.runInContext(script,c);await flush();button.events.click();el('toBrief').events.click();await el('start').events.click();await flush();assert.equal(pending.length,1);
 el('takeFloor').onclick();assert.match(el('roomMsg').textContent,/Floor requested/);assert.equal(logs.length,0);
 pending[0].resolve([{speaker:'dominic',text:'Let me finish my recommendation.'},{speaker:'sam',text:'Should not precede handover.'}]);await flush();assert.match(logs[0],/finish my recommendation/);assert.match(logs[1],/Jack, go ahead/);assert.equal(logs.length,2);assert.equal(el('send').disabled,false);
 el('nextUpdate').onclick();assert.match(el('newsUpdates').innerHTML,/Competitor reduces/);el('say').value='I would test the employment impact before deciding.';el('send').events.click();await flush();assert.equal(pending.length,2);assert.equal(pending[1].body.reason,'reply');assert.equal(pending[1].body.newsCount,1);pending[1].resolve([{speaker:'priya',text:'I agree we should test that risk.'}]);await flush();assert.match(logs.at(-1),/test that risk/);
 });

