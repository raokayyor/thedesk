import assert from 'node:assert/strict';
import {profileChecks,reportFacts,validateDraftAnswer,stripUnsupportedIntensifiers,lintReport,parsePart,buildContext,buildPartPrompt,getPartSchema} from '../lib/full-cycle-contract.mjs';
import {buildThirtyDayPlan} from '../lib/thirty-day-plan.mjs';
import {buildRepairedCv} from '../lib/repaired-cv.mjs';
import {firmProcess} from '../lib/firm-process.mjs';

const cv=`Amelia Chen
Email: amelia@example.com
EDUCATION
University of Bristol — BSc Economics, 2023–2026. Final year. Predicted 2:1.
EXPERIENCE
Pho House — Part-time Team Member, September 2023–present
Worked 12 hours per week alongside university. Trained 3 new colleagues on ordering and till procedures. During one busy service, spotted a duplicate payment, informed the shift lead and helped process the correction. No monetary saving or complaint-resolution rate was recorded.
ACTIVITIES
Economics Society — Member, 2024–2026. Attended employer talks. No committee position.
SKILLS
Excel, valuation.`;
const now=new Date('2026-10-15T10:00:00Z');

// Profile contradictions are caught
const pc=profileChecks(cv,{year:'1st Year',programme:'Summer Internship'},now);
assert.equal(pc.stage,'final year');
assert.equal(pc.warnings.length,2);
assert.deepEqual(profileChecks(cv,{year:'Final year',programme:'Graduate programme'},now).warnings,[]);

// Facts carry correct labels, including commercial & technical out of 20
const f=reportFacts({overallScore:71,band:'Borderline',breakdown:{application:23,ats:9,competency:18,numerical:9,technical:12},weights:{application:30,ats:10,competency:25,numerical:15,technical:20}},{numericalCorrect:3,numericalTotal:5,commercialCorrect:3,commercialTotal:5,missed:[{topic:'Net debt'}]},cv,{},now);
assert(f.scoreLines.includes('Commercial & technical 12/20'));
assert.equal(f.pointsToCompetitive,4);

// Lint corrects a misquoted score and flags use of the name
const ctx={name:'Amelia Chen',result:{breakdown:{technical:12,numerical:9},weights:{technical:20,numerical:15}}};
const {data,notes}=lintReport({x:'The Numerical score is 9/15 and Commercial is 9/15.',y:'Amelia scores well.'},ctx);
assert.equal(data.x,'The Numerical score is 9/15 and Commercial is 12/20.');
assert(notes.some(n=>n.startsWith('name used')));

// Intensifiers the CV never used are removed
assert.equal(stripUnsupportedIntensifiers('identifying material dependence on growth',cv),'identifying dependence on growth');

// Draft answers: real STAR passes; pasted CV, invented numbers and claims fail
const src=['Worked 12 hours per week alongside university. Trained 3 new colleagues on ordering and till procedures. During one busy service, spotted a duplicate payment, informed the shift lead and helped process the correction.'];
const good=`At Pho House, where I work 12 hours a week alongside my degree, three new colleagues joined and I was asked to train them on ordering and the till. [confirm: who asked you, and over how many shifts?] I broke it into the steps that caused the most mistakes for me when I started, showed each one during quieter periods, then let them take orders while I watched and stepped in only when needed. [confirm: did they reach working on their own, and how quickly?] On one busy service I also spotted a duplicate payment, told the shift lead straight away and helped process the correction, which showed the new staff that flagging an error early is part of the job. What I took from it is that training people is about checking understanding, not just explaining. [confirm: what would you do differently next time?]`;
assert.deepEqual(validateDraftAnswer(good,src,cv),{ok:true});
assert.equal(validateDraftAnswer('I trained 3 new colleagues on ordering and till procedures. I worked 12 hours per week alongside university.',src,cv).ok,false);
assert.match(validateDraftAnswer(good.replace('three new colleagues','five new colleagues, cutting errors by 40%,'),src,cv).reason,/number/);
assert.match(validateDraftAnswer(good.replace('I was asked to train them','I led the team and trained them'),src,cv).reason,/claim/);

// Uppercase CONFIRM placeholders leave the finished bullet and become questions
const bullet={originalBullet:'E7',factsUsed:['E7','E3'],exampleBullet:'Maintained 12 hours per week alongside university [CONFIRM: across how many terms?]; trained 3 new colleagues.',questionsToConfirm:[]};
const parsed=parsePart(JSON.stringify({bulletRepair:[bullet,{...bullet},{...bullet}],competencyRepair:Array.from({length:7},()=>({name:'Leadership',evidenceSourceIds:['E7'],draftAnswer:good})),interviewRiskMap:Array(3).fill({})}),'repair',cv);
assert(!/CONFIRM/i.test(parsed.bulletRepair[0].exampleBullet));
assert.equal(parsed.bulletRepair[0].exampleBullet,cv.split('\n').filter(x=>x.trim())[6]);
assert.equal(parsed.bulletRepair[0].questionsToConfirm[0],'Across how many terms?');
// Same draft reused across competencies is kept only once
assert.equal(parsed.competencyRepair.filter(c=>c.draftAnswer).length,1);

// Repaired CV drops number-free sentences the report says to cut, never role headings
const paid={bulletRepair:[{originalBullet:'Worked 12 hours per week alongside university.',exampleBullet:'Worked 12 hours per week alongside university.',factsUsed:['Worked 12 hours per week alongside university.','Excel, valuation.'],questionsToConfirm:['How many terms?']},{originalBullet:'Attended employer talks.',exampleBullet:'Attended employer talks.',factsUsed:['Attended employer talks.','Excel, valuation.']}],
  competencyRepair:Array(7).fill({}),interviewRiskMap:Array(3).fill({}),
  evidenceHierarchy:{reduceOrCut:[{evidence:'No committee position. / No monetary saving or complaint-resolution rate was recorded.',whyReduce:'Disclaimer'}]}};
const rcv=buildRepairedCv({cvText:cv,paid,profile:{name:'Amelia Chen'}});
assert(!rcv.sourceText.includes('No committee position.'));
assert(!rcv.sourceText.includes('No monetary saving'));
assert.equal(rcv.removed.length,2);
const pho=rcv.sections.flatMap(s=>s.items).find(i=>i.heading.startsWith('Pho House'));
assert(pho && pho.bullets.length>=1, 'rewritten bullet stays a bullet under its role');
assert.equal(pho.bullets.find(b=>b.text.startsWith('Worked 12')).confidence,'needs_confirmation');

// Firm process and 30-day plan
assert.match(firmProcess('Barclays').process,/motivational interview/);
assert.equal(firmProcess('Nonexistent Bank'),null);
const weeks=buildThirtyDayPlan({quiz:{missed:[{topic:'Net debt'},{topic:'Strategic buyer in M&A'}]},profile:{targetDivision:'Investment Banking / IBD'},firm:firmProcess('Barclays')});
assert.equal(weeks.length,3);
assert(weeks[0].sessions.some(s=>s.href.includes('topic=Enterprise%20value')));
assert(weeks[1].sessions.some(s=>s.href.includes('route=investment_banking')));

// Prompt carries the v3 rules and the facts; firmPrep only when a firm process exists
const c2=buildContext({overallScore:71,band:'Borderline',breakdown:{technical:12},weights:{technical:20}},cv,{name:'Amelia Chen',targetFirm:'Barclays',year:'1st Year',programme:'Summer Internship'},{});
const prompt=buildPartPrompt('verdict',c2);
assert(prompt.includes('WRITING RULES (v3)') && prompt.includes('Commercial & technical 12/20') && !prompt.includes('Two short interactive online assessments'));
assert(!getPartSchema('verdict',c2).properties.firmPrep);
const c3=buildContext({overallScore:71},cv,{name:'A',targetFirm:'Unknown Ltd'},{});
assert(!getPartSchema('verdict',c3).properties.firmPrep);
console.log('Full Cycle v3 checks passed: profile mismatch, score labels, intensifiers, STAR drafts, confirm placeholders, cut lines, firm process, 30-day plan.');



