import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
globalThis.__gameAccess={paid:false,queries:[]};
registerHooks({load(url,context,next){
 if(url.endsWith('/lib/report-store.mjs'))return {format:'module',shortCircuit:true,source:`export const initStore=async()=>{};export const sameOrigin=(q,r)=>q.method==='GET'||q.headers.origin==='https://desk.test'||(r.status(403).json({error:'origin'}),false);export const apiFailure=(r,e)=>r.status(500).json({error:e.message});export const sql=()=>({query:async(q)=>{globalThis.__gameAccess.queries.push(q);return [];}});`};
 if(url.endsWith('/lib/value-accounts.mjs'))return {format:'module',shortCircuit:true,source:`export const principal=async()=> 'fictional-student';export const isPaidOwner=async()=>globalThis.__gameAccess.paid;`};
 return next(url,context);
}});
const {default:handler}=await import('../api/game.js');
process.env.PRACTITIONER_SUPPORT_KEY='fictional-staff-test';
async function run(method='GET',query={},body={},staff=false){const res={code:200,setHeader(){},status(n){this.code=n;return this;},json(d){this.body=d;return this;},end(){}};await handler({method,query,body,headers:{origin:'https://desk.test',...(staff?{authorization:'Bearer fictional-staff-test'}:{})}},res);return res;}
test('free accounts reach the game without a membership gate',async()=>{globalThis.__gameAccess.paid=false;assert.equal((await run()).code,200);for(const [m,q,b] of [['GET',{view:'quote',ticker:'FTSE100'},{}],...['join','trade','stop'].map(action=>['POST',{}, {action}])]){const r=await run(m,q,b);assert.equal(r.code,404);assert.equal(r.body.error,'No game is running right now.');assert.equal(r.body.membershipRequired,undefined);}});
test('members retain game access and staff administration still requires the staff key',async()=>{globalThis.__gameAccess.paid=true;assert.equal((await run()).code,200);assert.equal((await run('POST',{}, {action:'join'})).code,404);globalThis.__gameAccess.paid=false;assert.equal((await run('GET',{view:'staff'})).code,401);assert.equal((await run('GET',{view:'staff'},{},true)).code,200);assert.equal((await run('POST',{}, {action:'staff-unknown'})).code,401);assert.equal((await run('POST',{}, {action:'staff-unknown'},true)).code,400);});