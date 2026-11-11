import Stripe from 'stripe';
import {sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {currentAccount,entitlement,latestAssessment,allow} from '../lib/accounts.mjs';
import {initMemberships,redeemTesterCode,grantAccountPayment} from '../lib/account-memberships.mjs';
import {MEMBERSHIP_AMOUNT,MEMBERSHIP_VERSION} from '../lib/membership-pricing.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 try{
 const account=await currentAccount(req);if(!account)return res.status(401).json({error:'Sign in to your free account first.'});
 if(req.method==='GET'){const access=await entitlement(account.id),assessment=await latestAssessment(account.id);return res.json({member:access.active,until:access.until||null,hasAssessment:!!assessment,testerCodes:process.env.VERCEL_ENV==='preview'});}
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 const b=req.body||{},access=await entitlement(account.id);
 if(b.action==='redeem'){
  if(access.active)return res.json({success:true,next:'/my.html'});
  if(!await allow('member-code:'+account.id,5))return res.status(429).json({error:'Too many attempts. Try again in an hour.'});
  if(!await redeemTesterCode(account.id,b.code))return res.status(400).json({error:'This tester code is invalid, expired or fully used. It only works on the testing Preview.'});
  return res.json({success:true,next:'/my.html'});
 }
 if(b.action==='verify'){
  if(typeof b.sessionId!=='string'||!/^cs_[A-Za-z0-9_]{8,250}$/.test(b.sessionId))return res.status(400).json({error:'Invalid checkout.'});
  await initMemberships();const own=await sql().query('SELECT 1 FROM desk_membership_checkouts WHERE session_id=$1 AND account_id=$2',[b.sessionId,account.id]);if(!own.length)return res.status(403).json({error:'Checkout does not belong to your account.'});
  const session=await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(b.sessionId);
  if(!await grantAccountPayment(session))return res.status(402).json({error:'Payment is not complete. No membership has been activated.'});return res.json({success:true,next:'/my.html'});
 }
 if(b.action==='checkout'){
  if(access.active)return res.json({url:'/my.html'});
  if(!await allow('membership-checkout:'+account.id,5))return res.status(429).json({error:'Please try again later.'});
  if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({error:'Checkout is temporarily unavailable.'});
  const origin=new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;
  const session=await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.create({mode:'payment',customer_email:account.email,client_reference_id:account.id,metadata:{accountId:account.id,membershipKind:'account',productVersion:MEMBERSHIP_VERSION},line_items:[{price_data:{currency:'gbp',unit_amount:MEMBERSHIP_AMOUNT,product_data:{name:'The Desk Membership',description:'12 months of preparation tools, deep CV assessment, interview and application practice, and up to 12 rechecks. Paid once; no automatic renewal.'}},quantity:1}],success_url:origin+'/membership-start.html?session_id={CHECKOUT_SESSION_ID}',cancel_url:origin+'/membership-start.html?checkout=cancelled',payment_intent_data:{metadata:{accountId:account.id,membershipKind:'account',productVersion:MEMBERSHIP_VERSION}}});
  await initMemberships();await sql().query('INSERT INTO desk_membership_checkouts(session_id,account_id) VALUES($1,$2)',[session.id,account.id]);return res.json({url:session.url});
 }
 return res.status(400).json({error:'Unknown action.'});
 }catch(e){return apiFailure(res,e);}
}
