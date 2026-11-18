import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../deep-assessment.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('skipButton.onclick='),source.indexOf('const complete='));
test('skip saves partial answers as a draft and opens tools without completing or scoring',async()=>{let body,destination,captured=false;const skipButton={},context={skipButton,state:{id:'owned'},answers:{q1:{text:'partial'}},testChoice:'carry',capture:()=>{captured=true},document:{getElementById:()=>({})},api:async b=>body=b,location:{assign:url=>destination=url}};vm.createContext(context);vm.runInContext(code,context);await skipButton.onclick();assert.ok(captured);assert.equal(body.action,'save');assert.equal(body.answers.q1.text,'partial');assert.equal(destination,'/my.html?deep=incomplete#memberTools');});
test('failed save keeps the student on the questions with a retry',async()=>{const skipButton={},message={},context={skipButton,state:{id:'owned'},answers:{},testChoice:'carry',capture(){},document:{getElementById:()=>message},api:async()=>{throw Error('Offline')},location:{assign(){assert.fail('must not navigate after failed save')}}};vm.createContext(context);vm.runInContext(code,context);await skipButton.onclick();assert.equal(skipButton.disabled,false);assert.match(message.textContent,/Offline/);});
