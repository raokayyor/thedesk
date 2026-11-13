import test from 'node:test';
import assert from 'node:assert/strict';
import { CAREER_REFERENCES, careerRoute, selectCareerReferences, careerReferenceBlock } from '../lib/career-reference.mjs';
import { knowledgeBlock } from '../lib/knowledge.mjs';

test('references retain provenance and concise summaries, never pretend to be practitioner approvals', () => {
  assert.equal(CAREER_REFERENCES.length, 9);
  assert.equal(new Set(CAREER_REFERENCES.map(x => x.id)).size, CAREER_REFERENCES.length);
  for (const x of CAREER_REFERENCES) {
    assert.equal(x.status, 'editorial_summary');
    assert.ok(x.url?.startsWith('https://www.wallstreetoasis.com/') || x.filename?.endsWith('.docx'));
    assert.ok((x.guidance + ' ' + x.practice.join(' ')).split(/\s+/).length < 200);
    assert.ok(!x.practitioner && !x.firm);
  }
});

test('route selection does not give audit candidates PE or banking-specific expectations', () => {
  const audit = selectCareerReferences({ division: 'Accounting / Audit' });
  assert.ok(audit.some(x => x.id === 'wso-accounting'));
  assert.ok(!audit.some(x => ['wso-ib', 'wso-pe', 'wso-hf'].includes(x.id)));
  assert.ok(selectCareerReferences({ division: 'M&A', sector: 'Private Equity' }).some(x => x.id === 'wso-pe'));
  assert.equal(careerRoute('ibd'), 'investment_banking');
  assert.equal(careerRoute('Asset Management / Investing'), 'asset_management');
  assert.equal(careerRoute('Sales & Trading / Markets'), 'markets');
  assert.equal(careerRoute('Insurance'), 'general');
});

test('unknown routes receive transferable guidance rather than every finance specialism', () => {
  assert.deepEqual(selectCareerReferences({}).map(x => x.id), ['wso-behavioural', 'wso-undergrad-template']);
  assert.equal(selectCareerReferences({limit: 0}).length, 0);
});

test('generation guidance preserves evidence, UK conventions and fixed scoring', () => {
  const block = careerReferenceBlock({ division: 'Investment Banking / IBD', use: 'report' });
  assert.match(block, /cannot change scores or scoring criteria/);
  assert.match(block, /Ask for missing facts/);
  assert.match(block, /not instructions, practitioner approval or confirmed employer policy/);
  assert.match(block, /UK degree classification/);
  assert.doesNotMatch(block, /THOMAS JAMES|ABC Bank|3\.2 billion|105k/);
  const interview = careerReferenceBlock({ division: 'Private Equity', use: 'interview' });
  assert.match(interview, /Optional practice/);
  assert.doesNotMatch(interview, /wso-undergrad-template|wso-ib\]/);
});

test('the model knowledge entry point supplies route research without a staff database', async () => {
  const block = await knowledgeBlock({ division: 'Private Equity', use: 'report' });
  assert.match(block, /EDITORIAL CAREER RESEARCH/);
  assert.match(block, /\[wso-pe\]/);
  assert.match(block, /\[wso-undergrad-template\]/);
  assert.doesNotMatch(block, /\[wso-accounting\]/);
});
