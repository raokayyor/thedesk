import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('single session enquiry displays notes and submits the single type without checkout',async()=>{
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:({fullName:'Test Student',email:'student@example.com',uni:'Bristol',note:'Barclays interview next week'})[id]||'',hidden:false,required:false,className:'',textContent:'',replaceChildren(){},append(){},closest(){return {hidden:false}},scrollIntoView(){}});return nodes.get(id)};
 const requests=[];const context={URLSearchParams,location:{search:'?plan=single'},history:{replaceState(){}},document:{getElementById:node,querySelectorAll:()=>[],createElement:()=>({})},fetch:async(url,opts)=>{if(opts){requests.push({url,body:JSON.parse(opts.body)});return {ok:true,json:async()=>({success:true})}}return {ok:true,json:async()=>url.includes('universities')?[]:{}}}};
 let source=readFileSync(new URL('../signup.js',import.meta.url),'utf8').replace(/^import[^;]+;/,'const SIGNUP_SECTORS=[];');vm.runInNewContext(source,context);
 assert.equal(node('noteWrap').hidden,false);assert.match(node('fKicker').textContent,/£99/);
 await node('joinForm').onsubmit({preventDefault(){}});assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/value-account');assert.equal(requests[0].body.type,'single');assert.match(requests[0].body.note,/Barclays/);assert.match(node('msg').textContent,/payment link and times/);
});
