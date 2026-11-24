import {funnelEvent} from './assessment-funnel.mjs';
import {upsertAccount,linkAssessment} from './accounts.mjs';
import {resultEvent} from './result-events.mjs';
import {grantAccountPayment} from './account-memberships.mjs';
import {checkoutAmountMatches} from './membership-pricing.mjs';
import {sql,initStore} from './report-store.mjs';
export function paidSessionMatches(session,id){return session.payment_status==='paid'&&session.status==='complete'&&checkoutAmountMatches(session)&&session.currency==='gbp'&&session.metadata?.assessmentId===id&&session.client_reference_id===id;}
export async function grantPayment(session){
 if(session.metadata?.membershipKind==='account'){const granted=await grantAccountPayment(session);if(granted){const row=(await sql().query('SELECT d.id,d.owner_hash FROM desk_assessments d JOIN desk_account_assessments a ON a.assessment_id=d.id WHERE a.account_id=$1 ORDER BY d.created_at DESC LIMIT 1',[session.metadata.accountId]))[0];if(row)await funnelEvent(row.owner_hash,'member',row.id).catch(()=>{});}return granted;}
 const id=session.metadata?.assessmentId;if(!paidSessionMatches(session,id))return false;
 await initStore();const rows=await sql().query('UPDATE desk_assessments SET paid_at=COALESCE(paid_at,now()),stripe_intent=$1 WHERE id=$2 AND stripe_session=$3 AND refunded_at IS NULL RETURNING id',[typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id,id,session.id]);if(rows.length!==1)return false;
 const email=session.customer_details?.email||session.customer_email;
 if(email){const account=await upsertAccount(email);if(account)await linkAssessment(account.id,id);}
 if(session.metadata?.accountId)await linkAssessment(session.metadata.accountId,id);
 const funnelRow=(await sql().query('SELECT owner_hash FROM desk_assessments WHERE id=$1',[id]))[0];if(funnelRow)await funnelEvent(funnelRow.owner_hash,'member',id).catch(()=>{});
 await resultEvent(id,'checkout_paid',{amount:session.amount_total,currency:session.currency},'paid:'+session.id);
 return true;
}
