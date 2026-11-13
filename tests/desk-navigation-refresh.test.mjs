import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
test('navigation discards an older free response when a post-payment refresh wins',async()=>{
 const pending=[],saved=new Map(),context={window:{},document:{createElement:()=>({}),head:{append(){}},dispatchEvent(){}},sessionStorage:{setItem:(k,v)=>saved.set(k,v)},AbortSignal,CustomEvent:class{},fetch:()=>new Promise(resolve=>pending.push(resolve))};vm.createContext(context);vm.runInContext(readFileSync(new URL('../desk-nav.js',import.meta.url),'utf8'),context);
 const first=context.window.DeskNavigation.refresh(),second=context.window.DeskNavigation.refresh();pending[1]({ok:true,json:async()=>({member:true})});await second;pending[0]({ok:true,json:async()=>({member:false})});await first;
 assert.equal(context.window.DeskNavigation.data.member,true);assert.equal(JSON.parse(saved.get('desk-navigation-cache')).member,true);
});
