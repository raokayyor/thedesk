import Stripe from 'stripe';
import {grantPayment} from '../lib/payment-verification.mjs';
import {sql,initStore} from '../lib/report-store.mjs';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();let event;
 try{const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>1048576)return res.status(413).end();chunks.push(c);}event=new Stripe(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(Buffer.concat(chunks),req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);}catch{return res.status(400).json({error:'Invalid webhook signature.'});}
 try{if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))await grantPayment(event.data.object);
 if(event.type==='charge.refunded'&&event.data.object.refunded){await initStore();await sql().query('UPDATE desk_assessments SET paid_at=NULL,refunded_at=now() WHERE stripe_intent=$1',[event.data.object.payment_intent]);}
 return res.json({received:true});}catch{ return res.status(503).end();}
}
