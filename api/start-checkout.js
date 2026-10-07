import Stripe from 'stripe';
import {ownedRecord,hasAccess,sameOrigin,apiFailure,sql} from '../lib/report-store.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{const row=await ownedRecord(req,res,req.body?.assessmentId);if(!row)return res.status(404).json({error:'Assessment not found.'});
 if(await hasAccess(row))return res.json({url:`/fullcycle.html?id=${row.id}`});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const origin=new URL(process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;
 if(row.stripe_session){const prior=await stripe.checkout.sessions.retrieve(row.stripe_session);if(prior.status==='open')return res.json({url:prior.url});}
 const session=await stripe.checkout.sessions.create({mode:'payment',client_reference_id:row.id,metadata:{assessmentId:row.id},line_items:[{price_data:{currency:'gbp',unit_amount:7900,product_data:{name:'The Desk Full Cycle',description:'Personalised application repair report, ATS guidance and two rechecks within 30 days.'}},quantity:1}],success_url:`${origin}/fullcycle.html?id=${row.id}&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/result-final-design.html?id=${row.id}&checkout=cancelled`,payment_intent_data:{metadata:{assessmentId:row.id}}},{idempotencyKey:`checkout-${row.id}-${row.stripe_session||'initial'}`});
 await sql().query('UPDATE desk_assessments SET stripe_session=$1 WHERE id=$2',[session.id,row.id]);return res.json({url:session.url});
 }catch(e){return apiFailure(res,e);}
}
