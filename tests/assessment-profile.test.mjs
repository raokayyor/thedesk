import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/assessment-profile.js';
test('guest profile prefill never issues or replaces an assessment ownership cookie',async()=>{
 const res={headers:{},setHeader(k,v){this.headers[k]=v},json(body){this.body=body;return this;}};
 await handler({method:'GET',headers:{}},res);
 assert.deepEqual(res.body,{signedIn:false});
 assert.equal(res.headers['Set-Cookie'],undefined);
 assert.equal(res.headers['Cache-Control'],'private, no-store');
});
