import {randomBytes} from 'node:crypto';
import {sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {normEmail,validEmail,initAccounts,upsertAccount,currentAccount,startSession,allow} from '../lib/accounts.mjs';
import {initMemberships,accountMembership} from '../lib/account-memberships.mjs';
import {validPilotCode,PILOT_EXPIRES} from '../lib/pilot-access.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).end();
 if(!sameOrigin(req,res))return;
 try{
  const email=normEmail(req.body?.email);
  if(!validEmail(email))return res.status(400).json({error:'Enter a valid email address.'});
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  if(!await allow('pilot-login:'+ip,10))return res.status(429).json({error:'Too many attempts. Try again in an hour.'});
  if(!validPilotCode(req.body?.code))return res.status(403).json({error:'That access code is incorrect or has expired.'});
  await initAccounts();await initMemberships();
  const existing=await currentAccount(req);
  if(existing&&(await accountMembership(existing.id)).source==='pilot')return res.json({next:'/my.html',resumed:true});
  // Random internal identity: a shared code must never open a real account by email.
  const account=await upsertAccount('pilot-'+randomBytes(16).toString('hex')+'@access.thedesk.invalid');
  await sql().query('INSERT INTO desk_account_profiles(account_id,data) VALUES($1,$2::jsonb)',[account.id,JSON.stringify({pilotAccess:true,contactEmail:email})]);
  await sql().query("INSERT INTO desk_account_memberships(source,account_id,kind,until) VALUES($1,$2,'pilot',$3)",['pilot:'+account.id,account.id,PILOT_EXPIRES]);
  res.setHeader('Set-Cookie',`desk_owner=${randomBytes(32).toString('hex')}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure`);
  await startSession(res,account.id);
  return res.json({next:'/my.html',resumed:false});
 }catch(e){return apiFailure(res,e);}
}
