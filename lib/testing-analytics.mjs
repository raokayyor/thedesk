export const TEST_EVENTS=new Set(['page_view','click','hero_cta_seen','hero_cta_clicked','request_finished','request_failed','runtime_error','tester_feedback','assessment_step_viewed','assessment_step_completed','assessment_question_answered','assessment_cv_uploaded','assessment_cv_pasted','assessment_extract_failed','assessment_email_submitted','assessment_result_opened','deep_skipped','deep_completed']);
export const testId=value=>typeof value==='string'&&/^[a-f0-9]{32}$/.test(value);
export function safeTestPath(value){if(typeof value!=='string')return null;const path=value.split(/[?#]/)[0];return /^\/(?:[a-zA-Z0-9_-]+(?:\.html)?)?$/.test(path)?path:null;}
export function cleanTestBatch(body){
 if(body?.consent!==true||!testId(body.session)||!testId(body.visit))throw Error('Start a consenting test session first.');
 const path=safeTestPath(body.path);if(!path)throw Error('Invalid page.');
 const number=(n,max)=>Number.isFinite(n)?Math.min(max,Math.max(0,Math.round(n))):0;
 const events=(Array.isArray(body.events)?body.events:[]).slice(0,30).filter(e=>TEST_EVENTS.has(e?.event)).map(e=>{const d=e.detail||{},detail={};for(const k of ['step','index','seconds','status','milliseconds'])if(Number.isFinite(d[k]))detail[k]=number(d[k],k==='milliseconds'?600000:86400);if(['verdict','repair','plan'].includes(d.part))detail.part=d.part;if(typeof d.control==='string'&&/^[a-zA-Z0-9_:./-]{1,100}$/.test(d.control))detail.control=d.control;if(typeof d.endpoint==='string'&&/^\/api\/[a-z0-9-]+$/.test(d.endpoint))detail.endpoint=d.endpoint;if(e.event==='tester_feedback'&&typeof d.note==='string')detail.note=d.note.trim().slice(0,1000);return {event:e.event,detail};});
 return {session:body.session,visit:body.visit,path,label:typeof body.label==='string'?body.label.replace(/[\r\n\t]/g,' ').trim().slice(0,40):'',width:number(body.width,10000),height:number(body.height,10000),activeMs:number(body.activeMs,14400000),scroll:number(body.scroll,100),events};
}
