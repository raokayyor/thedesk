import {MEMBERSHIP_AMOUNT,MEMBERSHIP_VERSION} from '../lib/membership-pricing.mjs';
import {grantPayment,paidSessionMatches} from '../lib/payment-verification.mjs';
import Stripe from 'stripe';
import {ownedRecord,hasAccess,sameOrigin,apiFailure,sql} from '../lib/report-store.mjs';
export default async function handler(req,res){
 if(req.method==='GET'){
  // Is "Pay in 3" (Klarna) switched on in Stripe? The sign-up page only mentions it when it is. Cached 10 minutes.
  try{if(!globalThis.__payIn3||Date.now()-globalThis.__payIn3.at>6e5){const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const acct=await stripe.accounts.retrieve();globalThis.__payIn3={at:Date.now(),on:acct?.capabilities?.klarna_payments==='active'};}
  res.setHeader('Cache-Control','public, max-age=600');return res.json({payIn3:globalThis.__payIn3.on,amount:MEMBERSHIP_AMOUNT});}catch(e){return res.json({payIn3:false,amount:MEMBERSHIP_AMOUNT});}
 }
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{const row=await ownedRecord(req,res,req.body?.assessmentId);if(!row)return res.status(404).json({error:'Assessment not found.'});
 if(await hasAccess(row))return res.json({url:`/fullcycle.html?id=${row.id}`});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const origin=new URL(process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;
 if(row.stripe_session){const prior=await stripe.checkout.sessions.retrieve(row.stripe_session);if(prior.status==='complete'&&paidSessionMatches(prior,row.id)&&await grantPayment(prior))return res.json({url:`/fullcycle.html?id=${row.id}`});if(prior.status==='open'&&prior.amount_total===MEMBERSHIP_AMOUNT&&prior.metadata?.productVersion===MEMBERSHIP_VERSION)return res.json({url:prior.url});if(prior.status==='open')await stripe.checkout.sessions.expire(prior.id);}
 const session=await stripe.checkout.sessions.create({mode:'payment',client_reference_id:row.id,metadata:{assessmentId:row.id,productVersion:MEMBERSHIP_VERSION},line_items:[{price_data:{currency:'gbp',unit_amount:MEMBERSHIP_AMOUNT,product_data:{name:'The Desk Membership',description:'12-month membership: deep assessment, CV rewrites, interview coach, firm interview packs, tests, Ask the panel. Up to 12 rechecks in the year. Paid once; no auto-renewal.'}},quantity:1}],success_url:`${origin}/fullcycle.html?id=${row.id}&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/result-final-design.html?id=${row.id}&checkout=cancelled`,payment_intent_data:{metadata:{assessmentId:row.id,productVersion:MEMBERSHIP_VERSION}}},{idempotencyKey:`checkout-${MEMBERSHIP_VERSION}-${row.id}-${row.stripe_session||'initial'}`});
 await sql().query('UPDATE desk_assessments SET stripe_session=$1 WHERE id=$2',[session.id,row.id]);return res.json({url:session.url});
 }catch(e){return apiFailure(res,e);}
}
