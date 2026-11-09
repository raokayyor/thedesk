import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeVideoId,captionText,importYoutube} from '../lib/youtube-transcript.mjs';
test('accepts video URLs while excluding arbitrary hosts and playlist-only links',()=>{
 for(const link of ['https://www.youtube.com/watch?v=96ZbWOcWQ0o&list=example','https://youtu.be/96ZbWOcWQ0o','https://www.youtube.com/shorts/96ZbWOcWQ0o'])assert.equal(youtubeVideoId(link),'96ZbWOcWQ0o');
 for(const link of ['https://youtube.com.evil.test/watch?v=96ZbWOcWQ0o','https://www.youtube.com/playlist?list=x','http://localhost/video','https://user:password@youtube.com/watch?v=96ZbWOcWQ0o'])assert.throws(()=>youtubeVideoId(link));
});
test('empty or oversized captions do not silently enter the bank',()=>{
 assert.throws(()=>captionText([]));assert.throws(()=>captionText([{text:'x'.repeat(300001)}]));
 assert.equal(captionText([{text:'<b>A useful caption sentence with enough detail to analyse.</b>'}]),'A useful caption sentence with enough detail to analyse.');
});
test('caption retrieval uses a canonical video ID and returns actionable failure',async()=>{
 const r=await importYoutube('https://youtu.be/96ZbWOcWQ0o',{retrieve:async(id)=>{assert.equal(id,'96ZbWOcWQ0o');return [{text:'A useful caption sentence with enough detail to analyse.',lang:'en'}]}});
 assert.equal(r.videoId,'96ZbWOcWQ0o');assert.equal(r.language,'en');
 await assert.rejects(()=>importYoutube('96ZbWOcWQ0o',{retrieve:async()=>{throw Error('Unavailable')}}),/Paste its transcript/);
});
