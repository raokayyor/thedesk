import assert from 'node:assert/strict';
import {articleText,validExplanation,explainNews} from '../lib/news-explainers.mjs';
const text='A fictional manufacturer borrowed money to buy new equipment. The bank arranged a loan repaid over five years. The firm says the equipment will increase capacity, although demand could still change. This is borrowing rather than selling a share of ownership. ';
assert(!articleText('<nav><p>Navigation that must not enter article content or the explanation.</p></nav><article><p>'+text+'</p></article>').includes('Navigation'));
assert(!validExplanation('What should I think about? Open the original article.'));
const summary='The manufacturer is borrowing to buy equipment and will repay the loan over five years. A loan gives it money now without selling ownership, but it still has to make repayments even if business slows. The company says the equipment will let it produce more.';
assert(validExplanation(summary));let calls=0,fetches=0;const cache=new Map();let leased=false;
const db={query:async(q,args)=>{if(q.startsWith('CREATE'))return [];if(q.startsWith('SELECT'))return cache.has(args[0])?[{explanation:cache.get(args[0])}]:[];if(q.startsWith('INSERT')){if(leased)return [];leased=true;return [{key:args[0]}];}if(q.startsWith('UPDATE')&&q.includes('explanation=$2'))cache.set(args[0],args[1]);return [];}};
const client={messages:{create:async req=>{calls++;const sources=JSON.parse(req.messages[0].content);assert(sources[0].article.includes('equipment'));return{stop_reason:'tool_use',content:[{type:'tool_use',name:'submit_explainers',input:{items:[{id:sources[0].id,explanation:summary}]}}]};}}};
const prior=globalThis.fetch;globalThis.fetch=async()=>{fetches++;return new Response('<article><p>'+text.repeat(3)+'</p></article>',{headers:{'content-type':'text/html'}});};
try{const item={url:'https://www.example.com/news/loan',title:'A manufacturer funds new equipment'};const a=await explainNews([item],'https://www.example.com/news',{db,client});assert.equal(a[0].explanation,summary);const b=await explainNews([item],'https://www.example.com/news',{db,client});assert.equal(b[0].explanationStatus,'ready');assert.equal(calls,1);assert.equal(fetches,1);
 const c=await explainNews([{...item,url:'https://evil.example/private'}],'https://www.example.com/news',{db:{query:async q=>q.startsWith('INSERT')?[{}]:[]},client});assert.equal(c[0].explanation,null);assert.equal(fetches,1);assert.equal(calls,1);
}finally{globalThis.fetch=prior;}
console.log('PASS article-body extraction, specific explanations, persistent reuse, and blocked off-domain article requests');

