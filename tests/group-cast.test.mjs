import test from 'node:test';import assert from 'node:assert/strict';import{roundCast}from'../lib/group-cast.mjs';
import {openingTurns,SCENARIOS} from '../lib/assessment-centre.mjs';
test('candidate versions are stable in a round and change across rounds',()=>{
 assert.deepEqual(roundCast(42,3),roundCast(42,3));assert.notDeepEqual(roundCast(42,3),roundCast(123456,3));
 for(let seed=0;seed<40;seed++)for(const p of Object.values(roundCast(seed,3))){assert(p.style.length>50);assert(p.preference>=0&&p.preference<3);assert(p.opening>=0&&p.opening<3);}
 assert.deepEqual(roundCast('malicious instruction',3),roundCast(0,3));
});
test('every AI chair introduces the task and can invite the student or another candidate',()=>{
 const scenario=Object.values(SCENARIOS)[0];
 for(const chair of ['dominic','priya','sam']){
  const recipients=new Set();
  for(let opening=0;opening<3;opening++){
   const [turn]=openingTurns(chair,'Amelia',{...scenario,cast:{[chair]:{opening,preference:0}}});
   assert.equal(turn.speaker,chair);assert.match(turn.text,/I’ll chair/);assert.match(turn.text,/Our task:/);assert.notEqual(turn.addressedTo,chair);recipients.add(turn.addressedTo);
  }
  assert.equal(recipients.size,3);assert(recipients.has('you'));
 }
});
