import test from 'node:test';
import assert from 'node:assert/strict';
import {financialSpeechText,generateInterviewSpeech} from '../lib/interview-voice.mjs';
test('financial shorthand is spoken in full, including currency and decimals',()=>{
 assert.equal(financialSpeechText('Option C costs £4m. Revenue is 10m and debt is £2.5bn.'),'Option C costs 4 million pounds. Revenue is 10 million and debt is 2.5 billion pounds.');
 assert.equal(financialSpeechText('£120M, $250k, €1.2bn and £4 m.'),'120 million pounds, 250 thousand dollars, 1.2 billion euros and 4 million pounds.');
 assert.equal(financialSpeechText('10 minutes; 30ms; team4m; 8% interest; £4 million.'),'10 minutes; 30ms; team4m; 8% interest; £4 million.');
});
test('shared voice generation sends expanded speech to the provider',async()=>{
 let spoken;
 await generateInterviewSpeech('Option C costs £4m',{fetcher:async(_url,options)=>{spoken=JSON.parse(options.body).text;return{ok:true,arrayBuffer:async()=>new Uint8Array([1]).buffer}}});
 assert.equal(spoken,'Option C costs 4 million pounds');
});
