import test from 'node:test';
import assert from 'node:assert/strict';
import '../member-dashboard-core.js';
const {upcoming}=globalThis.DeskDashboard;
const now=new Date('2026-11-12T12:00:00');
test('nearest eligible application, not stale or closed applications, gets the countdown',()=>{
 const a=upcoming([{firm:'Old',stage:'Interview',deadline:'2026-11-10'},{firm:'Closed',stage:'Rejected',deadline:'2026-11-13'},{firm:'JPM',stage:'Interview',deadline:'2026-11-15'},{firm:'EY',stage:'Preparing',deadline:'2026-11-14'}],now);
 assert.equal(a.firm,'EY');assert.equal(a.days,2);assert.equal(a.interview,false);
});
test('interviews with no date remain actionable without inventing a countdown',()=>{
 const a=upcoming([{firm:'HSBC',stage:'Interview'}],now);assert.equal(a.firm,'HSBC');assert.equal(a.days,null);assert.equal(a.interview,true);
 assert.equal(upcoming([{firm:'DB',stage:'Preparing',deadline:'2026-11-20'}],now),null);
});
test('confirmed interview date takes precedence over the application deadline',()=>{
 const a=upcoming([{firm:'JPM',stage:'Interview',interviewDate:'2026-11-12',deadline:'2026-10-01'}],now);assert.equal(a.days,0);
});
