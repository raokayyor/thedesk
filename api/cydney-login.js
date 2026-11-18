import {createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {upsertAccount,startSession,initAccounts,allow} from '../lib/accounts.mjs';
import {initMemberships} from '../lib/account-memberships.mjs';
import {CYDNEY_INVITE} from '../lib/student-test-config.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 if(!await allow('cydney-login:'+ip,5)||!await allow('cydney-login-global',30))return res.status(429).json({error:'Too many attempts. Try again in an hour.'});
 const password=req.body?.password;
 if(typeof password!=='string'||password.length>80||Date.now()>=Date.parse('2027-11-18T23:59:59Z')||!timingSafeEqual(createHash('sha256').update(password.toUpperCase()).digest(),Buffer.from(CYDNEY_INVITE.hash,'hex')))return res.status(403).json({error:'That password is not recognised.'});
 await initAccounts();await initMemberships();
 // Reuse Cydney’s earlier invitation account if she has already activated it.
 const previous=await sql().query('SELECT account_id FROM desk_account_memberships WHERE source LIKE $1 ORDER BY created_at LIMIT 1',['student-test:'+CYDNEY_INVITE.hash+':%']);
 const accountId=previous[0]?.account_id||(await upsertAccount('cydney-fenwick@private.thedesk.invalid')).id;
 const source='cydney-direct:'+CYDNEY_INVITE.hash;
 await sql().query("INSERT INTO desk_account_memberships(source,account_id,kind,until) VALUES($1,$2,'student-test',$3) ON CONFLICT DO NOTHING",[source,accountId,'2027-11-18T23:59:59Z']);
 const grant=(await sql().query('SELECT account_id FROM desk_account_memberships WHERE source=$1 AND revoked_at IS NULL AND until>now()',[source]))[0];
 if(!grant)return res.status(403).json({error:'This access has ended. Contact The Desk.'});
 await sql().query('INSERT INTO desk_account_profiles(account_id,data) VALUES($1,$2::jsonb) ON CONFLICT DO NOTHING',[grant.account_id,JSON.stringify({name:'Cydney Fenwick',plan:'paid'})]);
 // Close the original one-account invitation once password access is activated.
 await sql().query('INSERT INTO desk_member_codes(code_hash,expires_at,max_uses,used) VALUES($1,$2,1,1) ON CONFLICT(code_hash) DO UPDATE SET used=desk_member_codes.max_uses',[CYDNEY_INVITE.hash,CYDNEY_INVITE.expires]);
 res.setHeader('Set-Cookie',`desk_owner=${randomBytes(32).toString('hex')}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.VERCEL?'; Secure':''}`);
 await startSession(res,grant.account_id);return res.json({next:'/my.html?testing=1'});
 }catch(e){return apiFailure(res,e)}
}
