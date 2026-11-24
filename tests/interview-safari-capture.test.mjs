import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {wavFromFloatChunks} from '../lib/interview-audio.mjs';
const source=readFileSync(new URL('../interview-live-transcript.js',import.meta.url),'utf8').replace(/^import .*?;\s*/,'');
function harness(){
 const nodes={transcript:{value:'',dispatchEvent(){}},speechSupport:{textContent:''}};let processor,created=0,resumes=0;
 const connection=()=>({connect(){},disconnect(){}});
 class AudioContext{constructor(){created++;this.state='suspended';this.sampleRate=48000;this.audioWorklet={addModule:async()=>{throw Error('Safari worklet unavailable')}};}async resume(){resumes++;this.state='running';}createMediaStreamSource(){return connection()}createGain(){return {...connection(),gain:{value:0}}}createScriptProcessor(){processor={...connection()};return processor}async close(){this.state='closed'}}
 const context={window:{AudioContext,addEventListener(){}},document:{getElementById:id=>nodes[id],addEventListener(){}},setupSpeech(){},render(){},speech:null,speechFinal:'',stream:{getAudioTracks:()=>[{}]},assessment:{},MediaStream:class{},wavFromFloatChunks,Float32Array,Uint8Array,DataView,URLSearchParams,Event:class{},btoa:s=>Buffer.from(s,'binary').toString('base64'),setTimeout,clearTimeout,fetch:async()=>({ok:false,json:async()=>({success:false})})};vm.runInNewContext(source,context);return {context,nodes,get processor(){return processor},get created(){return created},get resumes(){return resumes}};
}
test('Safari tap primes one audio context; worklet failure still retains microphone PCM when live service fails',async()=>{
 const h=harness();h.context.window.DeskLiveTranscript.prepare();assert.equal(h.created,1);assert.equal(h.resumes,1);h.context.setupSpeech();await new Promise(r=>setImmediate(r));assert.equal(h.created,1);assert.ok(h.processor?.onaudioprocess);h.processor.onaudioprocess({inputBuffer:{getChannelData:()=>new Float32Array(4096).fill(.2)}});const blob=h.context.window.DeskLiveTranscript.audioBlob();assert.equal(blob.type,'audio/wav');assert.ok(blob.size>44);await h.context.window.DeskLiveTranscript.flush();assert.equal(h.context.window.DeskLiveTranscript.audioBlob().size,blob.size);
});
