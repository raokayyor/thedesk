import Stripe from 'stripe';
import {ownedRecord,sameOrigin,apiFailure} from '../lib/report-store.mjs';
import {grantPayment,paidSessionMatches,linkPaidAccount} from '../lib/payment-verification.mjs';

export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{const row=await ownedRecord(req,res,req.body?.assessmentId);if(!row||row.stripe_session!==req.body?.sessionId)return res.status(403).json({error:'Checkout does not belong to this assessment.'});
 const session=await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(row.stripe_session,{expand:['discounts.promotion_code']}).catch(()=>new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(row.stripe_session));
 if(!paidSessionMatches(session,row.id))return res.status(402).json({error:'Payment has not completed. Return to your result to continue.'});
 if(!await grantPayment(session))return res.status(402).json({error:'This payment no longer grants report access.'});
 // Payment links the receipt, but a typed checkout email is not proof of account ownership.
 await linkPaidAccount(session);
 return res.json({success:true,signedIn:false});}catch(e){return apiFailure(res,e);}
}
