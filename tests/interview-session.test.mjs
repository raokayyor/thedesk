import assert from 'node:assert/strict';
import '../interview-bank.js';import '../interview-session-core.js';
import {parseEmployerNews,validNewsUrl,fetchEmployerNews} from '../lib/interview-news.mjs';
const S=globalThis.DeskInterviewSession,B=globalThis.DeskInterviewBank;
const setup=S.normalizeSetup({firm:'db',role:'ibd',roleTitle:'Risk Analyst',roleDescription:'Excel and risk research',round:'second',news:{title:'A sufficiently detailed employer headline',url:'https://www.db.com/news/test'}});
const base=B.buildSession({firmKey:'db',roleKey:'ibd',evidence:'My project',includeLogic:true});const original=JSON.stringify(base),q=S.applyContext(base,setup);
assert.equal(q.length,8);assert.match(q[0].q,/Risk Analyst/);assert.match(q[1].q,/Excel|risk/);assert.match(q[2].q,/assumption/);assert.equal(q[4].kind,'news');assert.equal(JSON.stringify(base),original);
assert.equal(S.normalizeSetup({...setup,firm:'ey'}).news,null);
for(const url of ['https://db.com.evil.example/a','http://db.com/a','https://user:pass@db.com/a','https://db.com:999/a','javascript:alert(1)']){assert.equal(S.newsUrl(url,'db'),null);assert.equal(validNewsUrl(url,'db'),null)}
const now=Date.parse('2026-10-30T12:00:00Z');const xml='<rss><item><title>A genuine official headline for a test</title><link>https://www.db.com/news/test</link><pubDate>29 Oct 2026 12:00:00 GMT</pubDate></item><item><title>A future headline should not show here</title><link>https://www.db.com/news/future</link><pubDate>31 Oct 2026 12:00:00 GMT</pubDate></item></rss>';
assert.equal(parseEmployerNews(xml,'db',now).length,1);assert.equal(parseEmployerNews('x'.repeat(2500001),'db').length,0);
let calls=0;const result=await fetchEmployerNews('db',{fetcher:async()=>{calls++;return{status:302,headers:new Headers({location:'https://evil.example'})}}});assert.equal(result.status,'unavailable');assert.equal(calls,1);
console.log('PASS interview role/round/news tailoring, immutable base questions, official-domain validation and safe news fallback');
