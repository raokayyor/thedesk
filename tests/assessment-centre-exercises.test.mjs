import test from 'node:test';
import assert from 'node:assert/strict';
import {CASES,publicCase,INBOX,publicInbox,scoreInbox,validReplies,caseFeedbackPrompt} from '../lib/assessment-centre-exercises.mjs';
test('public case and inbox packs withhold worked answers and scoring keys',()=>{
 for(const c of Object.values(CASES)){assert(!('model' in publicCase(c)));assert(c.table.rows.length>0);}
 const ib=publicInbox();assert.equal(ib.emails.length,15);assert(!('error' in ib));assert(!('modelReplies' in ib));for(const e of ib.emails){assert(!('model' in e));assert(!('why' in e));assert(!('trap' in e));}
});
test('inbox marks correct priorities, confidentiality traps and P&L arithmetic deterministically',()=>{
 const pr=Object.fromEntries(INBOX.emails.map(e=>[e.id,e.model]));const full=scoreInbox(pr,'EBIT','140.0');assert.equal(full.priority.pct,100);assert(full.error.lineOk&&full.error.valOk);assert(full.traps.every(t=>t.ok));
 for(const e of INBOX.emails.filter(e=>e.trap))pr[e.id]='Now';const unsafe=scoreInbox(pr,'EBIT','-140');assert(unsafe.traps.every(t=>!t.ok));assert(!unsafe.error.valOk);assert(unsafe.priority.pct<100);
});
test('empty replies receive no invented positive assessment',()=>{assert(validReplies({replies:[{id:3,score:4}]},{}).every(r=>r.score===1));});
test('gym worked example defines gross-debt leverage consistently and allows alternative recommendations',()=>{assert.match(CASES.atlas.summary,/gross borrowings/);assert.match(CASES.atlas.model.points[0],/£155m/);assert.match(caseFeedbackPrompt(CASES.atlas,'Test','',[]),/reward well-supported alternatives/);});
