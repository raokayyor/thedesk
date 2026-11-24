import {createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {upsertAccount,startSession,endSession,initAccounts,allow,markVerified} from '../lib/accounts.mjs';
import {initMemberships} from '../lib/account-memberships.mjs';
import {FRESH_TEST_LOGIN} from '../lib/fresh-test-config.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 if(!await allow('fresh-test-login:'+ip,20)||!await allow('fresh-test-login-global',60))return res.status(429).json({error:'Too many attempts. Try again in an hour.'});
 const password=req.body?.password;
 if(typeof password!=='string'||password.length>100||Date.now()>=Date.parse(FRESH_TEST_LOGIN.expires)||!timingSafeEqual(createHash('sha256').update(password).digest(),Buffer.from(FRESH_TEST_LOGIN.hash,'hex')))return res.status(403).json({error:'That test password is not recognised or has expired.'});
 const free=req.body?.tier==='free';await initAccounts();if(!free)await initMemberships();
 // Unique identity and browser owner: no records are deleted or copied from another member.
 const account=await upsertAccount('test-run-'+randomBytes(16).toString('hex')+'@private.thedesk.invalid');if(free)await markVerified(account.id);
 if(!free)await sql().query("INSERT INTO desk_account_memberships(source,account_id,kind,until) VALUES($1,$2,'student-test',now()+interval '14 days')",['fresh-test:'+account.id,account.id]);
 await sql().query('INSERT INTO desk_account_profiles(account_id,data) VALUES($1,$2::jsonb)',[account.id,JSON.stringify({name:'Test student',plan:free?'free':'paid',freshTest:true})]);
 await endSession(req,res);
 const cookies=[].concat(res.getHeader('Set-Cookie')||[]);cookies.push(`desk_owner=${randomBytes(32).toString('hex')}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.VERCEL?'; Secure':''}`);res.setHeader('Set-Cookie',cookies);
 await startSession(res,account.id);return res.json({next:'/my.html?testing=1'});
 }catch(e){return apiFailure(res,e)}
}
