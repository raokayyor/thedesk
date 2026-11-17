import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('public interview uses shared context and a prewritten sample script, retaining server feedback limits',async()=>{
 const student=JSON.parse(readFileSync(new URL('../data/preview-student.json',import.meta.url),'utf8')),example=JSON.parse(readFileSync(new URL('../data/free-interview-example.json',import.meta.url),'utf8')),calls=[];
 const window={fetch:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(url==='/data/preview-student.json'?student:url==='/data/free-interview-example.json'?example:{success:true}));},addEventListener(){}};
 const document={createElement:()=>({}),head:{append(){}},addEventListener(){}};
 vm.runInNewContext(readFileSync(new URL('../free-mode.js',import.meta.url),'utf8'),{window,document,location:{search:'?ready=1&taster=interview&trial=1',href:'https://example.com/interview.html',origin:'https://example.com'},URL,URLSearchParams,Response,Promise,JSON,Set});
 const context=await(await window.fetch('/api/interview-context')).json();assert.equal(context.profile.name,'Jamie Patel');assert.equal(context.cv.text,example.cvText);
 const draft=await(await window.fetch('/api/interview-draft',{method:'POST',body:'{}'})).json();assert.equal(draft.draft.script,example.script);assert.equal(calls.length,2);
 await window.fetch('/api/interview-feedback',{method:'POST',body:JSON.stringify({transcript:'My own answer',question:'An unrelated question'})});const body=JSON.parse(calls.at(-1).options.body);assert.equal(body.publicTrial,true);assert.equal(body.taster,undefined);assert.equal(body.transcript,'My own answer');assert.match(body.question,/Tell me about yourself/);assert.equal(body.kind,'teaser');
});
test('legacy interview check redirects to the shared member workspace',()=>{const page=readFileSync(new URL('../interview-teaser.html',import.meta.url),'utf8');assert.match(page,/location.replace\('\/interview.html\?ready=1&taster=interview&trial=1'\)/);assert.doesNotMatch(page,/interview-teaser-media.js/)});
