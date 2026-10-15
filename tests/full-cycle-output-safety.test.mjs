import assert from 'node:assert/strict';
import {parsePart,validateDraftAnswer} from '../lib/full-cycle-contract.mjs';
const cv='Candidate\nTrained 3 new colleagues on ordering and till procedures.\nBuilt a DCF in Excel. Presented the sensitivity to a 4-person team.';
const original='Built a DCF in Excel. Presented the sensitivity to a 4-person team.';
const payload=example=>({bulletRepair:[{originalBullet:original,exampleBullet:example,factsUsed:[original,'Trained 3 new colleagues on ordering and till procedures.'],questionsToConfirm:[]}],competencyRepair:Array.from({length:7},()=>({})),interviewRiskMap:[{},{},{}]});
for(const example of ['Valuation was [confirm: what did you find?]; presented to a 4-person team.','Valuation was; presented to a 4-person team.']) {
 const repaired=parsePart(JSON.stringify(payload(example)),'repair',cv);
 assert.equal(repaired.bulletRepair[0].exampleBullet,original);
}
const draft='At work I trained 3 new colleagues on ordering and till procedures. There was no formal induction and I took it on myself to train them before their first busy shift. '+Array(10).fill('This was part of my work alongside university.').join(' ');
assert.match(validateDraftAnswer(draft,['Trained 3 new colleagues on ordering and till procedures.'],cv).reason,/unsupported initiative/);
console.log('PASS: incomplete rewrite and unsupported initiative regressions');

