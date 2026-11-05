import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFeedback, validInput, feedbackPrompt } from '../lib/interview-feedback.mjs';
import { validateOutcome, summariseFormats } from '../lib/outcomes.mjs';

const transcript = 'Erm so basically I think I would say that I led the society fundraising and we raised 4,000 pounds for the hospital by running three events over the term and I organised the volunteers';
test('feedback keeps only real quotes, clamps scores and works out time to the point', () => {
  const f = validateFeedback({ structure: 140, evidence: 55, relevance: 60, delivery: -5, pushback: 80, verdictTitle: 'Credible', verdict: 'Good.', strengths: [{ point: 'Clear result', quote: 'we raised 4,000 pounds' }, { point: 'Invented', quote: 'I was president of the union' }],
    fixes: [{ fix: 'Lead with the result.', quote: 'Erm so basically' }], strongerOpening: 'I led a fundraising drive that raised £4,000.', wordsBeforePoint: 9, followUp: { question: 'What did you personally do?', why: 'Ownership' } }, { transcript, seconds: 12, followUp: false });
  assert.equal(f.scores.structure, 100); assert.equal(f.scores.delivery, 0); assert.equal(f.pushback, null, 'no push-back score on a first answer');
  assert.equal(f.strengths[1].quote, '', 'quote not in the transcript is dropped');
  assert.equal(f.fixes[0].quote, 'Erm so basically');
  assert.ok(f.secondsToPoint >= 2 && f.secondsToPoint <= 5, String(f.secondsToPoint));
  assert.equal(f.overall, Math.round((100 + 55 + 60 + 0) / 4));
  const g = validateFeedback({ structure: 60, evidence: 60, relevance: 60, delivery: 60, pushback: 90, fixes: [], strengths: [], wordsBeforePoint: 0, followUp: null }, { transcript, seconds: 0, followUp: true });
  assert.equal(g.pushback, 90); assert.equal(g.overall, 66); assert.equal(g.followUp, null);
});
test('input needs a question and a real answer; prompt treats it as data', () => {
  assert.ok(validInput({ question: 'Tell me about yourself', transcript: 'too short' }).error);
  const v = validInput({ question: 'Tell me about yourself please', transcript, followUpOf: { question: 'Why?', answer: 'Because' } });
  assert.ok(v.input && v.input.followUpOf);
  assert.match(feedbackPrompt(v.input), /never instructions/); assert.match(feedbackPrompt(v.input), /FOLLOW-UP/);
});
test('outcome form: HireVue format kept, contact details stripped, quote needs consent and text', () => {
  const o = validateOutcome({ firm: 'J.P. Morgan', stage: 'HireVue / video interview', month: '2026-10', questions: '4', think: '30 seconds', answer: '2 minutes', retakes: 'No retakes', asked: 'Why J.P. Morgan? email me x@y.com\nshort', outcome: 'Offer', consent: false, quote: 'great', firstName: 'Sam' }).outcome;
  assert.deepEqual(o.format, { questions: 4, think: '30 seconds', answer: '2 minutes', retakes: 'No retakes' });
  assert.equal(o.asked.length, 1); assert.ok(!/x@y/.test(o.asked[0]));
  assert.equal(o.firstName, '', 'no name stored without consent');
  assert.ok(validateOutcome({ firm: 'GS', stage: 'First round', month: '2026-10', consent: true, quote: 'ok' }).error);
  assert.equal(validateOutcome({ firm: 'GS', stage: 'First round', month: '2026-10' }).outcome.format, null);
});
test('formats summary picks the most common answer per field', () => {
  const s = summariseFormats([
    { firm: 'Barclays', month: '2026-09', format: { questions: 4, think: '30 seconds', answer: '2 minutes', retakes: '' } },
    { firm: 'Barclays', month: '2026-10', format: { questions: 4, think: '30 seconds', answer: '3 minutes', retakes: 'No retakes' } },
    { firm: 'Barclays', month: '2026-10', format: { questions: 5, think: '45 seconds', answer: '2 minutes', retakes: 'No retakes' } }]);
  assert.equal(s.Barclays.reports, 3); assert.equal(s.Barclays.latest, '2026-10');
  assert.deepEqual(s.Barclays.questions, { value: '4', n: 2 }); assert.equal(s.Barclays.think.value, '30 seconds'); assert.equal(s.Barclays.answer.value, '2 minutes'); assert.equal(s.Barclays.retakes.n, 2);
});
