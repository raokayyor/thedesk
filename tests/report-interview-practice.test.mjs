import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../report-interview-practice.js',import.meta.url),'utf8');
function setup(){const handlers=[];let finish,timers=0;const clock={textContent:''},status={textContent:''},button={textContent:'Start',closest:()=>card},card={querySelector:s=>s==='[data-timer]'?clock:s==='.qq'?{textContent:'Explain your research.'}:status};const context={window:{DeskNaturalVoice:{cancel(){},speak:()=>new Promise(r=>finish=r)}},document:{addEventListener:(type,fn)=>handlers.push(fn)},location:{search:'?id=abc'},URLSearchParams,setInterval:()=>{timers++;return 1},clearInterval(){},addEventListener(){}};vm.runInNewContext(source,context);return{click:()=>handlers[0]({target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){}}),finish:v=>finish(v),timers:()=>timers,clock,status};}
test('report Start reads the question before starting its answer timer',async()=>{const x=setup(),pending=x.click();assert.equal(x.clock.textContent,'Listening…');assert.equal(x.timers(),0);x.finish(true);await pending;assert.equal(x.timers(),1);assert.match(x.status.textContent,/does not record/);});
test('report audio failure leaves the timer stopped',async()=>{const x=setup(),pending=x.click();x.finish(false);await pending;assert.equal(x.timers(),0);assert.match(x.status.textContent,/could not play/);});
