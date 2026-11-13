import {sql,initStore} from './report-store.mjs';
export const RESULT_EVENTS=new Set(['result_viewed','live_fix_used','unlock_clicked','checkout_started','checkout_paid','email_captured']);
let ready;
export function initResultEvents(){return ready??=initStore().then(()=>sql().query(`CREATE TABLE IF NOT EXISTS desk_result_events(id bigserial PRIMARY KEY,assessment_id text,event text NOT NULL,event_key text UNIQUE,detail jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now())`)).catch(e=>{ready=null;throw e});}
export async function resultEvent(id,event,detail={},key=null){if(!RESULT_EVENTS.has(event))throw new Error('Unknown result event');await initResultEvents();await sql().query('INSERT INTO desk_result_events(assessment_id,event,event_key,detail) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(event_key) DO NOTHING',[id,event,key,JSON.stringify(detail)]);}
