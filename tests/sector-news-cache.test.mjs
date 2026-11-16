import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../sector-news.js',import.meta.url),'utf8');
const prefs={sectors:['Banking'],organisations:[]};
function setup(fetch){const data=new Map(),window={};vm.runInNewContext(source,{window,fetch,URLSearchParams,localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}});return window.DeskSectorNews;}
test('stored headlines render while the live feed is still pending',async()=>{let finish;const news=setup(url=>url.includes('snapshot=1')?Promise.resolve({json:async()=>({items:[{title:'Stored story',url:'https://example.com/stored'}]})}):new Promise(r=>finish=r));let shown=[];const pending=news.load(prefs,items=>shown=items);await new Promise(r=>setImmediate(r));assert.equal(shown[0].title,'Stored story');assert.equal(news.cached(prefs)[0].title,'Stored story');finish({json:async()=>({items:[{title:'Fresh story',url:'https://example.com/fresh'}]})});await pending;assert.equal(shown[0].title,'Fresh story');});
test('a failed refresh preserves stored headlines and interests have distinct caches',async()=>{let fail=false;const news=setup(async()=>{if(fail)throw Error('offline');return{json:async()=>({items:[{title:'Banking story',url:'https://example.com/banking'}]})};});await news.load(prefs);fail=true;await news.load(prefs);assert.equal(news.cached(prefs)[0].title,'Banking story');assert.equal(news.cached({sectors:['Insurance']} ).length,0);});
