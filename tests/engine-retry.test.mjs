import test from 'node:test';
import assert from 'node:assert/strict';
import Anthropic from '@anthropic-ai/sdk';
import {neonConfig} from '@neondatabase/serverless';
import handler from '../api/analyse-mot.js';
import {COMPETENCIES} from '../lib/assessment-scoring.mjs';
const cv='Finance Society\n- Analysed valuation, operating performance and relevant transaction or sector benchmarks\nCorporate Finance\n2026 BSc Finance\nfictional@example.com';
const fixture=()=>({summaryDetail:'Finance Society',deskSummary:'Your Finance Society analysis is relevant, but your methods and conclusion need detail.',priorities:Array.from({length:3},(_,i)=>({title:'Explain your Finance Society contribution '+i,description:'Your Finance Society analysis needs a specific method and conclusion to show what you contributed.',detail:'Finance Society',competencies:['Analytical ability']})),competencies:COMPETENCIES.map(name=>({name,score:63,detail:'Finance Society',reason:'Your Finance Society work needs a supported outcome.',quotes:['E2'],nextStep:'Describe your contribution.'})),applicationCriteria:['contribution','analysis','outputs','roleRelevance','specificity','clarity'].map(name=>({name,points:3,quotes:['E2']})),cvPreview:{source:'Finance Society',original:'E2',issue:'Your valuation analysis lacks a method and conclusion, leaving your own judgement unclear.',structure:'Analysed [company] valuation using [method], benchmarking against [peers], and found [conclusion].'}});
test('API retries generic model output, saves only validated result, and rejects missing route bank before model',async()=>{
 const oldEnv={key:process.env.ANTHROPIC_API_KEY,db:process.env.DATABASE_URL,origin:process.env.APP_ORIGIN},oldFetch=neonConfig.fetchFunction;
 process.env.ANTHROPIC_API_KEY='test-placeholder';process.env.DATABASE_URL='postgres://u:p@test.neon.tech/db';process.env.APP_ORIGIN='https://thedesk.vercel.app';
 let writes=0,calls=0,allInvalid=false;neonConfig.fetchFunction=async(_url,options)=>{if(JSON.parse(options.body).query.includes('INSERT INTO desk_assessments'))writes++;return new Response(JSON.stringify({fields:[],rows:[],rowCount:0,command:'SELECT',rowAsArray:false}),{status:200,headers:{'Content-Type':'application/json'}});};
 const proto=Object.getPrototypeOf(new Anthropic({apiKey:'test-placeholder'}).messages),oldCreate=proto.create;
 proto.create=async()=>{calls++;const a=fixture();if(calls===1||allInvalid)a.priorities[0].description='Quantify your work to demonstrate impact.';return{stop_reason:'tool_use',content:[{type:'tool_use',name:'submit_assessment',input:a}]};};
 const req={method:'POST',headers:{origin:'https://thedesk.vercel.app',host:'thedesk.vercel.app'},body:{consent:true,cv:{text:cv},profile:{name:'Fictional test',targetSector:'General Finance'},answers:{commercial:[0,0,0,0,0],numerical:[1,2,2,1,1]}}};
 const response=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;}});
 try{let res=response();await handler(req,res);assert.equal(res.statusCode,200);assert.equal(calls,2);assert.equal(writes,1);assert.equal(res.body.result.competencies[0].score,63);
 calls=0;allInvalid=true;res=response();await handler(req,res);assert.equal(res.statusCode,503);assert.equal(calls,3);assert.equal(writes,1);
 calls=0;req.body.profile.targetSector='Consulting / Advisory';res=response();await handler(req,res);assert.equal(res.statusCode,400);assert.equal(calls,0);assert.equal(writes,1);
 }finally{proto.create=oldCreate;neonConfig.fetchFunction=oldFetch;for(const [key,value]of Object.entries({ANTHROPIC_API_KEY:oldEnv.key,DATABASE_URL:oldEnv.db,APP_ORIGIN:oldEnv.origin})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
