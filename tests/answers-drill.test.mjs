import assert from 'node:assert/strict';
import fs from 'node:fs';
import { quickChecks, groundCheck, stripUngrounded, validateDraft, validateCheck, wordCount } from '../lib/answers-core.mjs';
import { DRILLS, todaysDrill, drillQuick, validateDrillFeedback, divisionKey } from '../lib/drill-core.mjs';
import { practiceMeasures, validateTeaser, teaserFallback, contextFromReport } from '../interview-practice-core.mjs';

const cv = JSON.parse(fs.readFileSync(new URL('../samples/amelia-input.json', import.meta.url))).cvText;
const ctx = { cvText: cv, competencies: [{ name: 'Leadership', score: 2, evidence: 'Trained 3 new colleagues' }] };
const req = { firm: 'Barclays', division: 'Investment Banking', question: 'Why Barclays? (200 words)', limit: 200, limitType: 'words' };

// Answer builder never keeps invented facts.
assert.deepEqual(groundCheck('I led a team of 5 and saved £2m.', cv).badClaims.sort(), ['led', 'saved']);
assert(groundCheck('At Redcliffe Partners I researched 12 UK software companies.', cv).ok);
const d = validateDraft({ answerType: 'why_firm', competency: '', plan: [{ point: 'Why IB', evidence: 'Redcliffe' }, { point: 'I grew revenue 40%', evidence: 'x' }], draft: 'At Redcliffe Partners I researched 12 UK software companies. I led a team of 5 analysts. Barclays lists Integrity among its values. I want to join because [confirm: who you met].', research: ['A deal'] }, ctx, req);
assert(!/team of 5/.test(d.draft) && d.removedSentences === 1 && d.plan.length === 1 && /Integrity/.test(d.draft), 'ungrounded sentence and plan point removed, firm value kept');
assert.throws(() => validateDraft({ answerType: 'why_firm', competency: '', plan: [{ point: 'x', evidence: 'y' }], draft: 'I won 3 awards.', research: [] }, ctx, req), /not grounded/);
// Quick checks: limit, clichés, machine-sounding words.
const q = quickChecks('I am passionate about Barclays, a prestigious bank. Moreover, I want to leverage my skills. ' + 'word '.repeat(200), { limit: 200, firm: 'Barclays' });
assert(q.overLimit && q.cliches.includes('prestigious') && q.aiTells.includes('leverage my') && q.namesFirm);
assert.equal(wordCount('  one two   three '), 3);
// Line edits must quote the student exactly, and suggestions can't add facts.
const text = 'At Redcliffe Partners I researched 12 companies for a screen. I want to work at Barclays.';
const c = validateCheck({ scores: { answersQuestion: 4, specificity: 3, evidence: 4, firmFit: 2, structure: 4 }, verdict: 'v', strengths: ['s'], fixes: ['f'], lineEdits: [{ quote: 'I want to work at Barclays.', suggestion: 'I want to join Barclays because [confirm: a reason].' }, { quote: 'not in answer', suggestion: 'x' }, { quote: 'At Redcliffe Partners I researched 12 companies for a screen.', suggestion: 'I led 9 analysts at Redcliffe.' }], checkTheseClaims: [] }, ctx, req, text);
assert.equal(c.lineEdits.length, 1); assert.equal(c.overall, 3.4);

// Drill: 36 evergreen questions, stable daily pick, structure check, no invented numbers.
assert(DRILLS.length >= 30 && new Set(DRILLS.map(x => x.id)).size === DRILLS.length);
assert.equal(todaysDrill(new Date('2026-10-23T08:00:00Z')).id, todaysDrill(new Date('2026-10-23T22:00:00Z')).id);
assert.equal(divisionKey('Audit & Assurance'), 'audit');
const dq = drillQuick('Rate cuts squeeze bank margins because loans reprice faster than deposits, so banks lose income while borrowers win. My view is the hit is smaller than people expect.', 50);
assert.equal(dq.covered, 4);
const prompt = DRILLS[0];
const fb = validateDrillFeedback({ scores: { structure: 4, economics: 3, soWhat: 3, conviction: 4 }, verdict: 'v', strengths: ['s'], fixes: ['f'], betterAnswer: 'Bank margins fell by 37 basis points last year.', factsToCheck: [] }, prompt, 'answer');
assert.equal(fb.betterAnswer, '', 'invented figure removed');

// Practice measures saved with each interview answer.
const m = practiceMeasures('I rebuilt the model myself, which meant we delivered on time. As a result the team won the pitch.', 70, 120, { text: 'What did you do?', transcript: 'I rebuilt the 3 statement model over 2 nights and checked every link myself.' });
assert(m.hasResult && m.withinTime && m.followUpSpecific === true && m.iShare === 0.5);
assert.equal(practiceMeasures('short', 10, 120, null).followUpSpecific, null);

// Free-result teaser: CV question must be grounded, with a framework fallback.
const report = JSON.parse(fs.readFileSync(new URL('../samples/amelia-report-v3-live.json', import.meta.url)));
const tctx = contextFromReport(report, cv);
assert.throws(() => validateTeaser({ questions: [{ type: 'cv', text: 'Tell me about your time at Goldman Sachs.', why: '', evidence: 'Goldman Sachs summer internship trading desk' }, { type: 'motivation', text: 'Why Barclays and IB?', why: '', evidence: '' }, { type: 'competency', text: 'Tell me about leading people.', why: '', evidence: '' }] }, tctx), /not grounded/);
assert.equal(teaserFallback(tctx).length, 3);
console.log('Answer builder, drill, practice measures and teaser checks passed.');
