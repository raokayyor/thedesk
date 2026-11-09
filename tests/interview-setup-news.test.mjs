import test from 'node:test';import assert from 'node:assert/strict';
import '../interview-bank.js';import '../interview-session-core.js';
import {rankNews,trustedArticle} from '../lib/news-library.mjs';
import {TOPICAL_READINGS} from '../lib/topical-readings.mjs';
const bank=globalThis.DeskInterviewBank,session=globalThis.DeskInterviewSession;
test('HireVue defaults to five balanced questions with optional numeracy off',()=>{
 const setup=session.normalizeSetup({firm:'db',role:'ibd'}),base=bank.buildSession({firmKey:'db',roleKey:'ibd',includeLogic:true});
 assert.equal(setup.numericalCount,0);assert.equal(setup.reasoningCount,0);assert.equal(setup.includeLogic,false);
 const questions=session.applyContext(base,setup);assert.equal(questions.length,5);assert.deepEqual(questions.map(q=>q.kind),['cv','competency','commercial','cv','motivation']);
 assert(!questions.some(q=>q.challenge));assert(!questions.some(q=>/an experience you choose/.test(q.q)));
 const opted=session.normalizeSetup({...setup,includeLogic:true,numericalCount:2,reasoningCount:1});assert.equal(session.applyContext(base,opted).length,8);
 const selected=session.normalizeSetup({...setup,news:{title:'A checked financial story for commercial discussion',url:'https://www.reuters.com/markets/example'}});const withNews=session.applyContext(base,selected);assert.equal(withNews.length,5);assert.equal(withNews[2].kind,'news');
});
test('wider AI, energy and geopolitics stories survive a busy firm feed',()=>{
 const firmItems=Array.from({length:20},(_,n)=>({title:'Deutsche Bank announces acquisition financing transaction '+n,url:'https://www.db.com/news/deal-'+n,publishedAt:'2026-11-06'}));
 const items=rankNews([...firmItems,...TOPICAL_READINGS],{firm:'db',role:'ibd',now:Date.parse('2026-11-06T10:00:00Z')});
 for(const topic of ['ai','energy','geopolitics'])assert(items.some(i=>i.topic===topic),topic);
 assert(items.some(i=>i.scope==='firm'));assert(items.some(i=>i.scope==='wider'));
 for(const item of items){assert(session.normalizeSetup({firm:'db',role:'ibd',news:item}).news);assert.equal(item.discussionQuestions.length,3)}
});
test('programme, stage and format are independent and numerical counts match the session',()=>{
 const setup=session.normalizeSetup({firm:'db',role:'ibd',programme:'spring',round:'first',format:'video',roleDescription:'Excel and valuation',includeLogic:true,numericalCount:6,reasoningCount:2});
 assert.equal(setup.programme,'spring');assert.equal(setup.round,'first');assert.equal(setup.format,'video');
 const base=bank.buildSession({firm:'db',role:'ibd',includeLogic:true}),q=session.applyContext(base,setup);
 assert.equal(q.filter(q=>q.kind==='maths').length,6);assert.equal(q.filter(q=>q.challenge&&q.kind!=='maths').length,2);assert.match(q[0].q,/explore/);assert.match(q[1].q,/valuation/);
 assert.equal(new Set(q.map(q=>q.id)).size,q.length);assert(!base[0].q.includes('explore it'));
});
test('unselected numerical questions stay off and question focus changes the interview',()=>{
 const setup=session.normalizeSetup({firm:'general',role:'audit',includeLogic:false,numericalCount:6,questionFocus:'competency'});
 const q=session.applyContext(bank.buildSession({role:'audit',includeLogic:false}),setup);assert.equal(q.filter(q=>q.challenge).length,0);assert.equal(q.filter(q=>q.kind==='competency').length,2);
});
test('news ranking excludes promotional items and selects by role rather than feed position',()=>{
 const now=Date.parse('2026-11-05T12:00:00Z'),items=[{title:'Deutsche Bank UKI named a Fertility Friendly Employer',url:'https://www.db.com/news/detail/20261105-fertility',publishedAt:'2026-11-05'}, {title:'EIB and Deutsche Bank launch €560 million partnership to power Europe’s space businesses',url:'https://www.db.com/news/detail/20261030-eib-finance',publishedAt:'2026-10-30'}, {title:'FRC revises auditing standards and auditor reporting requirements',url:'https://www.frc.org.uk/news-and-events/news/2026/06/auditing-standards/',publishedAt:'2026-06-24'}];
 const ibd=rankNews(items,{role:'ibd',firm:'db',now});assert.equal(ibd.length,1);assert.match(ibd[0].title,/560 million/);assert(ibd[0].discussionQuestions.length===3);
 const audit=rankNews(items,{role:'audit',now});assert.equal(audit.length,1);assert.equal(audit[0].topic,'reporting');
});
test('trusted manual reading links do not admit arbitrary hosts or credentials',()=>{
 assert(trustedArticle('https://www.ft.com/content/example'));assert.equal(trustedArticle('https://ft.com.attacker.test/content/x'),null);assert.equal(trustedArticle('https://user:secret@www.ft.com/content/x'),null);
 assert(session.newsUrl('https://www.bankofengland.co.uk/news/2026/november/example','db'));assert.equal(session.newsUrl('http://www.bankofengland.co.uk/news/test','db'),null);
});
