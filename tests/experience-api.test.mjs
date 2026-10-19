import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import * as rules from '../lib/experience-interview.mjs';
const cv='Test Student\nEXPERIENCE\nClub — Volunteer, 2026\nCompared supplier quotes and presented the options to the committee.\nPROJECTS\nDissertation, 2026\nCompared three authors and documented sources in a table.';
let row={id:'owned-id',input:{cvText:cv,profile:{name:'Test Student'}},result:{overallScore:58},report:{}},paid=true,allowed=true,queries=[],updated=true,calls=0;
const client={messages:{create:async()=>{calls++;return {stop_reason:'tool_use',content:[{type:'tool_use',name:'ask_followups',input:{items:[{sourceId:rules.cvPoints(cv)[0].id,observation:'Your personal comparison method could be clearer.',question:'Which criteria did you personally compare, and how did you record the differences?'}]}}]};}}};
let source=fs.readFileSync(new URL('../api/full-cycle-experience.js',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace("const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});",'').replaceAll('export const ','const ').replace('export default ','');
const handler=new Function('client','createHash','ownedRecord','hasAccess','sameOrigin','sql','apiFailure',...Object.keys(rules),source+';return handler;')(client,createHash,async()=>row,async()=>paid,()=>allowed,()=>({query:async(q,args)=>{queries.push({q,args});return updated?[{id:'owned-id'}]:[];}}),()=>{throw Error('Unexpected failure');},...Object.values(rules));
const response=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;},end(){return this;}});
async function request(method,body={}){const res=response();await handler({method,query:{id:'owned-id'},body:{assessmentId:'owned-id',...body}},res);return res;}
paid=false;assert.equal((await request('GET')).statusCode,402);paid=true;row=null;assert.equal((await request('GET')).statusCode,402);row={id:'owned-id',input:{cvText:cv,profile:{}},result:{overallScore:58},report:{}};
allowed=false;await request('POST',{action:'draft'});assert.equal(queries.length,0);allowed=true;
assert.equal((await request('POST',{action:'draft',revision:8,experience:{examples:[]}})).statusCode,409);
assert.equal((await request('POST',{action:'complete',revision:0,experience:{examples:[],confirmed:false}})).statusCode,400);
let r=await request('POST',{action:'draft',revision:0,experience:{examples:[]}});assert.equal(r.body.revision,1);assert(!queries.at(-1).q.includes("report='{}'"));
r=await request('POST',{action:'complete',revision:0,experience:{examples:[],confirmed:true}});assert.equal(r.statusCode,200);assert(queries.at(-1).q.includes("report='{}'"));assert(queries.at(-1).q.includes('jsonb_each_text'));assert(!queries.at(-1).q.includes('rechecks_used='));assert(!queries.at(-1).q.includes('result='));
const p=rules.cvPoints(cv)[0];const draft=rules.validateExperience({examples:[{sourceId:p.id,answers:{ownership:{status:'answered',text:'I compared the quotes myself and showed the committee my notes.'}}}]},cv);row.input.experienceDraft=draft;
r=await request('POST',{action:'complete',revision:0,experience:{...draft,confirmed:true}});assert.equal(r.statusCode,428);
r=await request('POST',{action:'probe'});assert.equal(r.statusCode,200);assert.equal(calls,1);assert.equal(r.body.probe.items[0].sourceId,p.id);row.input.experienceProbe=r.body.probe;
r=await request('POST',{action:'probe'});assert(r.body.cached);assert.equal(calls,1);
r=await request('POST',{action:'complete',revision:0,experience:{...draft,followUps:[{id:'Q1',status:'answered',text:'I compared cancellation terms and total cost in a spreadsheet.'}],confirmed:true}});assert.equal(r.statusCode,200);const stored=JSON.parse(queries.at(-1).args[0]);assert.equal(stored.followUps[0].sourceId,p.id);assert(stored.confirmed);
updated=false;r=await request('POST',{action:'complete',revision:0,experience:{examples:[],confirmed:true}});assert.equal(r.statusCode,409);
console.log('PASS paid ownership and origin gates, revision conflicts, required follow-up review, cached probing, confirmed source-bound answers and no score/recheck changes');


