import {FULL_CYCLE_REVIEW_MODE} from '../lib/full-cycle-access.mjs';
import {MEMBERSHIP_AMOUNT,MEMBERSHIP_VERSION} from '../lib/membership-pricing.mjs';
import {grantPayment,paidSessionMatches} from '../lib/payment-verification.mjs';
import {currentAccount,linkAssessment,validEmail,allow} from '../lib/accounts.mjs';
import {conversionFacts} from '../lib/result-conversion.mjs';
import {resultEvent} from '../lib/result-events.mjs';
import Stripe from 'stripe';
import {ownedRecord,hasAccess,sameOrigin,apiFailure,sql} from '../lib/report-store.mjs';
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return res.status(405).end();if(req.method==='POST'&&!sameOrigin(req,res))return;res.setHeader('Cache-Control','private, no-store');
 try{const row=await ownedRecord(req,res,req.body?.assessmentId||req.query?.id);if(!row)return res.status(404).json({error:'Assessment not found.'});
 const count=conversionFacts(row.result,row.input?.quiz,row.input?.cvText,row.report).cvLineCount,next=`/fullcycle.html?id=${row.id}&lines=${count}#cv`;
 const stripeReady=!!process.env.STRIPE_SECRET_KEY;
 if(req.method==='GET')return res.json({payIn3:false,checkoutAvailable:stripeReady});
 if(FULL_CYCLE_REVIEW_MODE||await hasAccess(row))return res.json({url:next,review:FULL_CYCLE_REVIEW_MODE});
 if(!stripeReady)return res.status(503).json({error:'Checkout is temporarily unavailable. Your result is saved.'});
 const account=await currentAccount(req);if(account)await linkAssessment(account.id,row.id);
 if(!await allow('result-checkout:'+row.owner_hash,8))return res.status(429).json({error:'Please try checkout again later.'});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY),origin=new URL(process.env.VERCEL_ENV==='preview'?`https://${req.headers.host}`:process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;
 const reply=session=>({url:session.url,payIn3:process.env.RESULT_PAY_IN_3==='true'&&session.payment_method_types?.includes('klarna')===true});
 if(row.stripe_session){const prior=await stripe.checkout.sessions.retrieve(row.stripe_session);if(prior.status==='complete'&&paidSessionMatches(prior,row.id)&&await grantPayment(prior))return res.json({url:next});if(prior.status==='open'&&prior.amount_total===MEMBERSHIP_AMOUNT&&prior.metadata?.productVersion===MEMBERSHIP_VERSION&&prior.metadata?.journey==='result-c-v1'){await resultEvent(row.id,'checkout_started',{},'checkout:'+prior.id);return res.json(reply(prior));}if(prior.status==='open')await stripe.checkout.sessions.expire(prior.id);}
 const email=account?.email||row.input?.resultEmail||row.input?.profile?.email||row.input?.cvText?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
 const metadata={assessmentId:row.id,productVersion:MEMBERSHIP_VERSION,journey:'result-c-v1',...(account?{accountId:account.id}:{})};
 // Stripe-hosted Checkout uses the account's enabled dynamic payment methods.
 // Card includes Apple Pay / Google Pay where the customer's device and wallet are eligible.
 const session=await stripe.checkout.sessions.create({mode:'payment',customer_creation:'always',...(email&&validEmail(email)?{customer_email:email}:{}),client_reference_id:row.id,metadata,line_items:[{price_data:{currency:'gbp',unit_amount:MEMBERSHIP_AMOUNT,product_data:{name:'The Desk Membership',description:'12 months: deep assessment, CV repairs, interview and application tools, assessment-centre practice and up to 12 rechecks. Paid once; no auto-renewal.'}},quantity:1}],success_url:`${origin}/fullcycle.html?id=${row.id}&lines=${count}&session_id={CHECKOUT_SESSION_ID}#cv`,cancel_url:`${origin}/result-final-design.html?id=${row.id}&checkout=cancelled`,payment_intent_data:{metadata}},{idempotencyKey:`checkout-result-c-${MEMBERSHIP_VERSION}-${row.id}-${row.stripe_session||'initial'}`});
 await sql().query('UPDATE desk_assessments SET stripe_session=$1 WHERE id=$2',[session.id,row.id]);await resultEvent(row.id,'checkout_started',{},'checkout:'+session.id);return res.json(reply(session));
 }catch(e){return apiFailure(res,e);}
}
