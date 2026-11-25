import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import * as DeskToolLinks from '../lib/tool-links.mjs';
import {FEATURES,memberDestination} from '../feature-tour.mjs';
const html=readFileSync(new URL('../my.html',import.meta.url),'utf8');
function dashboard(member,assessed=true){const code=html.slice(html.indexOf('function freeDesk(){'),html.indexOf('function render(){'));const scope=vm.createContext({window:{DeskToolLinks},interviewHelpCard:()=>'<section>Got an interview coming up?</section>',D:{member,signedIn:true,profile:{firstName:'James'},actions:[],library:{},prep:null,deep:null,readiness:null,report:assessed?{url:"/result-final-design.html?id="+"a".repeat(48),fixes:[]}:null,needsAssessment:false},matchMedia:()=>({matches:true}),esc:s=>String(s??''),upcomingCard:()=>'<section>Applications due</section>',freeRow:()=>'<section id="freeTasters">Your free tries</section>',liveEventCard:()=>'<section>Live AMA</section>',deepStatusCard:()=>'',memberOnboardingCard:()=>'',newsCard:()=>'<section>Newsflow</section>',panelBand:()=>'<section>Panel</section>'});vm.runInContext(code+';globalThis.output=memberDesk();globalThis.freeOutput=freeDesk();',scope);return scope;}
test('free and member accounts retain the same dashboard without duplicate tool cards',()=>{const free=dashboard(false),paid=dashboard(true);for(const key of ['member-home-grid','member-home-left','member-home-right','memberDailySlot']){assert.ok(free.output.includes(key));assert.ok(paid.output.includes(key));}assert.equal(free.output,free.freeOutput);assert.equal((free.output.match(/workspace-tool-heading/g)||[]).length,(paid.output.match(/workspace-tool-heading/g)||[]).length);assert.doesNotMatch(free.output,/free-desk-hero|100svh|0 of 13|Explore your tools|Your free tries|freeTasters/);assert.doesNotMatch(free.output,/workspace-tool-grid|workspace-tool-heading|Open tool/);assert.doesNotMatch(paid.output,/workspace-tool-grid|workspace-tool-heading|Open tool/);for(const text of ['Newsflow','Panel','Prepare together.']){assert.ok(free.output.includes(text));assert.ok(paid.output.includes(text));}});
test('every locked preview has an explicit full member destination',()=>{for(const key of ['tests','story','answers','library','news','case','inbox']){assert.ok(FEATURES[key].page);assert.equal(memberDestination(key,{member:true}),FEATURES[key].paid);}assert.equal(memberDestination('story',{member:true}),'/your-story.html');});

test('free account without an assessment retains the full shared dashboard',()=>{const s=dashboard(false,false).output;assert.match(s,/Get your score: 10 mins/);assert.match(s,/memberDailySlot/);assert.match(s,/Quick tools/);});

test('dashboard has exactly the requested three quick tools and restores interview help',()=>{for(const member of [false,true]){const output=dashboard(member).output;assert.match(output,/Got an interview coming up/);assert.match(output,/aria-label="Quick tools"/);for(const title of ['Interview coach','Assessment centre','Application help'])assert.ok(output.includes('<h3>'+title+'</h3>'));assert.doesNotMatch(output,/Open tool/);}});


test('explore has no student identity while sample tool context stays available',async()=>{
 const {exploreDesk}=await import('../lib/explore-desk.mjs');const d=await exploreDesk();
 assert.equal(d.explore,true);assert.equal(d.profile.name,'');assert.equal(d.profile.firstName,'');assert.equal(d.profile.university,'');assert.ok(d.profile.targetFirm);
 const render=html.slice(html.indexOf('function render(){'),html.indexOf('let PROGS=null;'));
 function greeting(data){const app={};const scope=vm.createContext({D:data,app,qp:new URLSearchParams(),headerBits(){},dashboardSidebar(){},document:{body:{classList:{toggle(){}}},dispatchEvent(){}},Event:class{},greet:()=> 'Morning',esc:s=>String(s??''),memberDesk:()=>'',bind(){},matchMedia:()=>({matches:false}),location:{hash:''}});vm.runInContext(render+';render();',scope);return app.innerHTML;}
 assert.match(greeting(d),/<h1>Welcome to My Desk<\/h1>/);
 assert.doesNotMatch(greeting(d),/Morning, Amelia/);
 for(const member of [false,true])assert.match(greeting({...d,explore:false,signedIn:true,member,profile:{firstName:'James'}}),/<h1>Morning, James\.<\/h1>/);
});

test('score leads the shared dashboard and free upgrade sits before the daily question',()=>{
 for(const member of [false,true]){const output=dashboard(member,false).output;assert.ok(output.indexOf('Get your score: 10 mins')<output.indexOf('id="memberDailySlot"'));if(!member){assert.ok(output.indexOf('Get your score: 10 mins')<output.indexOf('Unlock full membership'));assert.ok(output.indexOf('Unlock full membership')<output.indexOf('id="memberDailySlot"'));}else assert.doesNotMatch(output,/Unlock full membership/);}
});
