import {createHash} from 'node:crypto';
import {chooseFramework} from './interview-frameworks.mjs';
import {checkAnswerBeats} from './interview-beat-checks.mjs';
export {normalise,questionFamily} from './interview-question-family.mjs';
import {normalise,questionFamily} from './interview-question-family.mjs';
export function answerKey(question,kind,firm){return createHash('sha256').update(normalise(firm)+'|'+questionFamily(question,kind)).digest('hex').slice(0,24);}
export function scoredAnswer(attempt){const d=attempt?.data,score=d?.feedback?.overall;if(typeof d?.transcript!=='string'||!Number.isFinite(score))return null;return {question:d.question,text:d.transcript,score,firm:d.firm||'',role:d.role||'',kind:d.kind||'competency',source:'transcript',attemptId:String(attempt.id),key:answerKey(d.question,d.kind,d.firm),beats:checkAnswerBeats(d.transcript,{question:d.question,kind:d.kind,firm:d.firm}).beats,savedAt:new Date().toISOString(),lastPractised:attempt.createdAt||attempt.created_at||new Date().toISOString()};}
export function groupLibrary(items,attempts=[]){return items.map(item=>{const d=item.data||{},key=d.key||answerKey(d.question,d.kind,d.firm),practice=attempts.filter(x=>answerKey(x.data.question,x.data.kind,x.data.firm)===key);return {...item,data:{...d,key,lastPractised:practice[0]?.createdAt||d.lastPractised||item.createdAt},attempts:practice.map(x=>({id:x.id,score:x.data.feedback?.overall,at:x.createdAt}))};}).sort((a,b)=>String(b.data.lastPractised).localeCompare(String(a.data.lastPractised)));}
