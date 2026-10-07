import {sql,initStore} from './report-store.mjs';
export function paidSessionMatches(session,id){return session.payment_status==='paid'&&session.status==='complete'&&session.amount_total===7900&&session.currency==='gbp'&&session.metadata?.assessmentId===id&&session.client_reference_id===id;}
export async function grantPayment(session){
 const id=session.metadata?.assessmentId;if(!paidSessionMatches(session,id))return false;
 await initStore();const rows=await sql().query('UPDATE desk_assessments SET paid_at=COALESCE(paid_at,now()),stripe_intent=$1 WHERE id=$2 AND stripe_session=$3 AND refunded_at IS NULL RETURNING id',[typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id,id,session.id]);return rows.length===1;
}
