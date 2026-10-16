import fs from 'node:fs';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../api/practitioner-questions.js',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace('export default ','').trim();
const queries=[];let inserted=false;const record={id:'root-assessment',owner_hash:'owner'};
const query=async(sql,args)=>{queries.push({sql,args});if(sql.startsWith('INSERT')){if(inserted)return [];inserted=true;return [{id:'question-1'}];}if(sql.startsWith('SELECT id,due_at'))return [{id:'question-1'}];return [];};
const handler=new Function('FIRM_GUIDES','sql','ownedRecord','hasAccess','owner','newId','sameOrigin','apiFailure','initQuestions','validEmail','return '+source)([{slug:'goldman-sachs'}],()=>({query}),async()=>record,async()=>true,()=> 'owner',()=> 'question-1',()=>true,()=>{throw Error('Unexpected failure');},async()=>{},()=>true);
const response=()=>({code:200,setHeader(){},status(n){this.code=n;return this;},json(value){this.body=value;return this;},end(){}});
const req={method:'POST',body:{id:'root-assessment',bank:'goldman-sachs',email:'fictional@example.com',question:'How should I prepare evidence for this role?',publish:false},query:{}};
let res=response();await handler(req,res);assert.equal(res.body.success,true);assert.equal(queries.find(q=>q.sql.startsWith('INSERT')).args[6],'goldman-sachs');
res=response();await handler({...req,body:{...req.body,bank:'db'}},res);assert.equal(res.code,409,'quota remains one across all guides');
res=response();await handler({...req,body:{...req.body,bank:'unknown'}},res);assert.equal(res.code,400);
res=response();await handler({method:'GET',query:{published:'1',bank:'goldman-sachs'}},res);assert(queries.some(q=>q.sql.includes('bank=$1')&&q.args[0]==='goldman-sachs'));
console.log('PASS firm-specific question routing, validated firms, public-answer isolation and shared quota; no real messages sent');

