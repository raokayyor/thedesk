import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runFramework} from '../lib/cv-fault-framework.mjs';
import {assessmentEntry} from '../lib/assessment-entry.mjs';
import {assessmentEntryMarkup} from '../result-entry.js';
const source=readFileSync(new URL('./cv-fault-framework.test.mjs',import.meta.url),'utf8');
const sophie=source.match(/sophie: `([\s\S]*?)`,/)[1];
test('all Sophie flags exclude ranked pitch and corrected audit, not just the first three',()=>{
 const rules=runFramework(sophie,{firm:'Barclays'});
 assert.ok(!rules.allFlaggedLines.some(l=>/ranked first of 8|adjusted before sign-off/.test(l.text)));
 assert.deepEqual(rules.reasons.map(r=>r.text),['Your Warwick Investment Society budget and events work never says what it told you.','Nothing on your CV connects you to Barclays in particular.',"Your strongest evidence isn't where a screener looks first."]);
 const row={input:{cvText:sophie,profile:{targetFirm:'Barclays'},quiz:{skipped:true}},result:{}};
 for(const unlocked of [false,true])assert.doesNotMatch(assessmentEntryMarkup(assessmentEntry(row,unlocked)),/Preparation check|Can you explain|How would you connect/);
});
test('quantified duty with achieved result is exempt while unsupported duty is still flagged',()=>{
 for(const line of ['Helped screen 8 companies; 2 were selected.','Worked in a team of 5; our pitch was ranked first of 8.','Supported two analysts; recommendations were accepted.'])assert.equal(runFramework('EXPERIENCE\nIntern, Example Bank, 2026\n- '+line).allFlaggedLines.length,0);
 assert.ok(runFramework('EXPERIENCE\nIntern, Example Bank, 2026\n- Helped with bookkeeping').allFlaggedLines[0].faults.includes('duty_not_achievement'));
 assert.match(runFramework('EDUCATION\nExample University, first year History').course.grade,/No predicted grade/);
});
