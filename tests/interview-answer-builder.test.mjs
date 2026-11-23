import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {buildInterviewGuide,evidenceSources,applyConfirmedGuideGaps} from '../lib/interview-evidence-guide.mjs';
const s=JSON.parse(readFileSync(new URL('../samples/amelia-report-v3-preview.json',import.meta.url),'utf8')),question='Give me a brief introduction relevant to Investment Banking / IBD at Barclays.';
test('the answer builder starts with the strongest CV action and spoken study/role sentences',()=>{const e=buildInterviewGuide(evidenceSources(s.originalCvText),question,{kind:'intro'}).examples[0];assert.match(e.contributionDraft,/^I flagged 4/);assert.match(e.contributionDraft,/I researched 12/);assert.doesNotMatch(e.answer[0].text,/Modules:|2023/);assert.match(e.answer[0].text,/I’m studying Economics at the University of Bristol/);assert.match(e.answer[1].text,/I worked as a corporate finance intern at Redcliffe Partners/);});
test('applying both fields replaces the populated contribution and the missing motivation in the actual answer and beats',()=>{const guide=buildInterviewGuide(evidenceSources(s.originalCvText),question,{kind:'intro'}),e=guide.examples[0],contribution='I compared all twelve companies against the recurring revenue rule and explained why four fit.',reason='I want to work in banking because I enjoy explaining company analysis, and I want to explore Barclays financing work.';const next=applyConfirmedGuideGaps(guide,[{sourceId:e.id,index:2,text:contribution},{sourceId:e.id,index:3,text:reason}]).examples[0];assert.equal(next.beats[2].text,contribution);assert.equal(next.beats[3].text,reason);assert.ok(next.answer.some(p=>p.text===contribution));assert.ok(next.answer.some(p=>p.text===reason));assert.ok(!next.answer.some(p=>p.text===e.beats[2].text));});

test('a named university and stronger action elsewhere in a non-finance CV are loaded',()=>{const cv=`Alex Morgan
EDUCATION
Loughborough University — BA English, 2023–2026. Predicted 2:1.
EXPERIENCE
Campus Bar — Team Member, 2024–present
Worked with colleagues to prioritise outstanding orders during busy periods.
PROJECTS
English dissertation, 2026
Compared three authors’ treatment of unreliable narration and documented sources in an evidence table.`;const e=buildInterviewGuide(evidenceSources(cv),question,{kind:'intro'}).examples[0];assert.equal(e.beats[0].gap,false);assert.match(e.beats[0].text,/studying English at Loughborough University/);assert.match(e.contributionDraft,/I compared three authors/);assert.equal(e.beats[2].gap,false);assert.doesNotMatch(e.contributionDraft,/finance internship|financial modelling/);});
