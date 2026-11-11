import test from 'node:test';import assert from 'node:assert/strict';import{roundCast}from'../lib/group-cast.mjs';
test('candidate versions are stable in a round and change across rounds',()=>{
 assert.deepEqual(roundCast(42,3),roundCast(42,3));assert.notDeepEqual(roundCast(42,3),roundCast(123456,3));
 for(let seed=0;seed<40;seed++)for(const p of Object.values(roundCast(seed,3))){assert(p.style.length>50);assert(p.preference>=0&&p.preference<3);assert(p.opening>=0&&p.opening<3);}
 assert.deepEqual(roundCast('malicious instruction',3),roundCast(0,3));
});
