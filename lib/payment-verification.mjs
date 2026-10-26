import {sql,initStore} from './report-store.mjs';
export const PRICE_PENCE=7900;
// Full price, or a discount code applied by Stripe (amount_total below the £79 subtotal). A 100% code completes with no payment.
export function paidSessionMatches(session,id){
 const total=session.amount_total,sub=session.amount_subtotal??session.amount_total,discount=session.total_details?.amount_discount||0;
 const amountOk=sub===PRICE_PENCE&&Number.isInteger(total)&&total>=0&&total<=PRICE_PENCE&&total===sub-discount;
 const paidOk=session.payment_status==='paid'||(total===0&&session.payment_status==='no_payment_required');
 return paidOk&&session.status==='complete'&&amountOk&&session.currency==='gbp'&&session.metadata?.assessmentId===id&&session.client_reference_id===id;
}
// The discount code used, if any: the promotion code text when Stripe gives it, otherwise its id.
export function promoFromSession(session){const p=session?.discounts?.[0]?.promotion_code;const code=typeof p==='object'&&p?p.code:typeof p==='string'?p:null;return code?String(code).slice(0,60):null;}
export async function grantPayment(session){
 const id=session.metadata?.assessmentId;if(!paidSessionMatches(session,id))return false;
 await initStore();await sql().query('ALTER TABLE desk_assessments ADD COLUMN IF NOT EXISTS paid_amount integer, ADD COLUMN IF NOT EXISTS promo_code text');
 const promo=promoFromSession(session);
 const rows=await sql().query("UPDATE desk_assessments SET paid_at=COALESCE(paid_at,now()),stripe_intent=$1,paid_amount=$4,promo_code=CASE WHEN $5::text IS NULL THEN promo_code WHEN promo_code IS NULL OR promo_code LIKE 'promo_%' THEN $5 ELSE promo_code END WHERE id=$2 AND stripe_session=$3 AND refunded_at IS NULL RETURNING id",[typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id,id,session.id,session.amount_total,promo]);return rows.length===1;
}

// After a successful payment: create or find the student's account from the Stripe email and link this assessment.
export async function linkPaidAccount(session){
 const email=session?.customer_details?.email||session?.customer_email;const id=session?.metadata?.assessmentId;
 if(!email||!paidSessionMatches(session,id))return null;
 try{const {upsertAccount,linkAssessment}=await import('./accounts.mjs');const account=await upsertAccount(email);if(!account)return null;await linkAssessment(account.id,id);return account;}
 catch(e){console.warn('account link failed',e.message);return null;}
}
