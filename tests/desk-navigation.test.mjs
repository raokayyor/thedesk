import test from 'node:test';import assert from 'node:assert/strict';
import '../member-dashboard-core.js';
import '../desk-navigation-core.js';
const C=globalThis.DeskNavigationCore;
test('five groups retain free previews and route members to owned tools',()=>{
 assert.deepEqual(C.groups.map(g=>g.label),['Desk','Practise','Applications','Community','More']);
 const d={member:true,report:{url:'/fullcycle.html?id='+'a'.repeat(48)},interviewUrl:'/interview-start.html?id='+'a'.repeat(48)};
 assert.equal(C.href('report',d),d.report.url);assert.equal(C.href('interview',d),d.interviewUrl);
 assert.equal(C.href('group',{}),'/assessment-centre-preview.html');assert.equal(C.href('group',d),'/group-exercise.html');
 assert.equal(C.href('library',{}),'/library.html');assert.equal(C.href('tracker',{}),'/tracker.html');
 assert.equal(C.href('report',{report:{url:'https://evil.example'}}),'/report-preview.html');
});
test('tools and preview routes select the corresponding group',()=>{for(const p of ['/interview.html','/interview-preview.html','/group-exercise.html'])assert.equal(C.groupFor(p),'practise');assert.equal(C.groupFor('/application-help.html'),'applications');assert.equal(C.groupFor('/fullcycle.html'),'more');assert.equal(C.groupFor('/my.html'),'desk');});

test('firm packs follow the nearest active tracker firm ahead of the profile',()=>{
 const d={member:true,profile:{targetFirm:'Barclays'},applications:[{firm:'J.P. Morgan',stage:'Interview',deadline:'2099-11-20'}]};
 assert.equal(C.href('firms',d),'/interview-start.html?firm=J.P.%20Morgan');
 assert.equal(C.href('firms',{...d,applications:[]}),'/interview-start.html?firm=Barclays');
 assert.equal(C.href('firms',{...d,applications:[{firm:'Expired',stage:'Unsuccessful'}]}),'/interview-start.html');
});
