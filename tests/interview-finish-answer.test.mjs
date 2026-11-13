import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('camera finish button follows recording state and uses the existing stop action',()=>{
 const nodes=new Map(),created=[];const make=()=>({hidden:false,textContent:'',disabled:false,style:{},setAttribute(){},before(){},prepend(){},append(n){created.push(n)},classList:{toggle(){}},click(){this.onclick?.()}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id)};
 let refresh,stops=0;const c={recorder:null,stream:null,recordingUrl:'',start(){c.recorder={state:'recording'}},stop(){stops++;c.recorder.state='inactive'},render(){},setInterval(fn){refresh=fn;return 1},clearInterval(){},addEventListener(){},document:{getElementById:get,createElement:make,querySelector:get,body:{classList:{toggle(){}}},head:{append(){}}}};
 get('stopBtn').onclick=()=>c.stop();vm.createContext(c);vm.runInContext(readFileSync(new URL('../interview-recording-status.js',import.meta.url),'utf8'),c);
 const overlay=created.find(n=>n.className==='finish-answer-overlay');assert(overlay.hidden);c.start();assert.equal(overlay.hidden,false);assert.equal(get('stopBtn').textContent,'Finish answer');overlay.click();assert.equal(stops,1);refresh();assert(overlay.hidden);
});
