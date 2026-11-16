import test from 'node:test';
import assert from 'node:assert/strict';
import {interviewPhase} from '../interview-focus-state.js';
test('timed attempt advances through listening, preparation, recording and review',()=>{
 const sequence=[{}, {starting:true}, {thinking:true}, {recording:true}, {recorded:true}, {recorded:true,feedback:true}];
 assert.deepEqual(sequence.map(interviewPhase),['ready','listen','prepare','record','review','feedback']);
});
test('retake cannot show old feedback or recording while listening or preparing',()=>{
 assert.equal(interviewPhase({recorded:true,feedback:true,starting:true}),'listen');
 assert.equal(interviewPhase({recorded:true,feedback:true,thinking:true}),'prepare');
 assert.equal(interviewPhase({recording:true,starting:true,thinking:true,feedback:true,recorded:true}),'record');
});
test('a failed question playback and a reset question return to ready',()=>{
 assert.equal(interviewPhase({starting:false,thinking:false,recorded:false,feedback:false}),'ready');
});
