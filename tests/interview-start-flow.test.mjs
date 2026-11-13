import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const file=readFileSync(new URL('../hirevue-guide.js',import.meta.url),'utf8');
const source=file.slice(file.indexOf("  const S = { phase:"),file.indexOf("  document.addEventListener('desk:questionchange'"));
function setup(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{value:id==='hvThink'?0:120,checked:true,hidden:false,textContent:'',classList:{toggle(){},remove(){}},scrollIntoView(){}});return elements.get(id);};
 let resolveVoice,starts=0,timers=0;
 const context={window:{DeskInterviewVoice:{readQuestion:()=>new Promise(r=>resolveVoice=r)}},document:{getElementById:el},$:s=>el(s.slice(1)),questions:[{q:'Explain a DCF.'}],current:0,stream:{},start:()=>starts++,stop(){},setInterval:()=>{timers++;return 1;},clearInterval(){}};
 vm.runInNewContext(source+';globalThis.flow={hvStart,S};',context);
 return {context,el,finishVoice:v=>resolveVoice(v),starts:()=>starts,timers:()=>timers};
}
test('Start waits for complete question playback before automatic recording',async()=>{
 const x=setup(),pending=x.context.flow.hvStart(false);
 assert.equal(x.context.flow.S.phase,'question');assert.equal(x.starts(),0);assert.equal(x.timers(),0);
 x.finishVoice(true);await pending;assert.equal(x.starts(),1);assert.equal(x.context.flow.S.phase,'answer');
});
test('failed or cancelled question playback never starts recording',async()=>{
 const x=setup(),pending=x.context.flow.hvStart(false);x.finishVoice(false);await pending;assert.equal(x.starts(),0);assert.equal(x.el('hvStart').disabled,false);
 const y=setup(),cancelled=y.context.flow.hvStart(false);y.context.flow.S.generation++;y.finishVoice(true);await cancelled;assert.equal(y.starts(),0);
});
