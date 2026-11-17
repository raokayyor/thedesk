import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('public taster uses result context and enforces its question on feedback',async()=>{
 const c={success:true,publicTrial:true,sample:true,profile:{name:'Amelia Chen',targetFirm:'Barclays',targetSector:'IBD'},student:{cvText:'Original submitted CV'},question:'Tell me about a time you led others.',weakest:'Leadership',paperScore:23},calls=[];
 const window={fetch:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(c));},addEventListener(){}};
 const document={createElement:()=>({}),head:{append(){}},addEventListener(){}};
 vm.runInNewContext(readFileSync(new URL('../free-mode.js',import.meta.url),'utf8'),{window,document,location:{search:'?ready=1&taster=interview&trial=1',href:'https://example.com/interview.html',origin:'https://example.com'},URL,URLSearchParams,Response,Promise,JSON,Set});
 const context=await(await window.fetch('/api/interview-context')).json();assert.equal(context.profile.name,'Amelia Chen');assert.equal(context.cv.text,c.student.cvText);
 await window.fetch('/api/interview-feedback',{method:'POST',body:JSON.stringify({transcript:'My own answer',question:'An unrelated question'})});const body=JSON.parse(calls.at(-1).options.body);assert.equal(body.publicTrial,true);assert.equal(body.question,c.question);assert.equal(body.kind,'competency');assert.equal(body.sample,'amelia');
});
test('legacy interview check redirects to the shared member workspace',()=>{const page=readFileSync(new URL('../interview-teaser.html',import.meta.url),'utf8');assert.match(page,/location.replace\('\/interview.html\?ready=1&taster=interview&trial=1'\)/);assert.doesNotMatch(page,/interview-teaser-media.js/)});
