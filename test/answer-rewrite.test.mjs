import { validateRewrite, fallbackRewrite, toClient } from '../lib/answer-rewrite.mjs';
import assert from 'node:assert/strict';

// Amelia Chen sample evidence (from the free-result sample)
const evidence = [
  { id: 'E1', kind: 'education', text: 'BSc Economics, University of Bristol, 2023–2026. Final year. Predicted 2:1. Modules: Corporate Finance, Financial Accounting, Econometrics.' },
  { id: 'E2', kind: 'experience', org: 'Redcliffe Partners', role: 'Corporate Finance Intern', text: 'Supported the investment team with research and analysis on potential transactions.' },
  { id: 'E3', kind: 'experience', org: 'Redcliffe Partners', role: 'Corporate Finance Intern', text: 'Researched 12 UK software companies for a prospective acquisition screen.' },
  { id: 'E4', kind: 'experience', org: 'Redcliffe Partners', role: 'Corporate Finance Intern', text: 'Flagged 4 companies for further review because their recurring revenue models matched the screen brief.' },
  { id: 'E5', kind: 'experience', org: 'Redcliffe Partners', role: 'Corporate Finance Intern', text: 'Presented the comparison table and selection reasons to an associate.' },
  { id: 'E6', kind: 'project', org: 'University project', role: 'Valuation project', text: 'Built a DCF and trading-comparables valuation of LVMH against 3 luxury-sector peers.' },
  { id: 'E7', kind: 'activity', org: 'Pho House', role: 'Team Member', text: 'Trained 3 new colleagues.' }
];
const transcript = "Hi, I'm Amelia, I'm a final year economics student at Bristol. I've always been really interested in finance and investment banking. Last summer I did an internship at Redcliffe Partners where I supported the team with research and analysis on potential transactions, which was really interesting. I also work part time at Pho House which has taught me teamwork and communication. I think Barclays is a great bank with a strong reputation and I'd love to be part of the team.";
const firm = 'Barclays';

// 1) A good model output passes and keeps all sourced sentences.
const good = {
  parts: [
    { type: 'text', text: "I'm Amelia, a final-year Economics student at Bristol.", sources: ['T'], change: null },
    { type: 'text', text: "The most relevant thing I've done is my corporate finance internship at Redcliffe Partners.", sources: ['T', 'E2'], change: 1 },
    { type: 'text', text: 'I researched 12 UK software companies for an acquisition screen.', sources: ['E3'], change: 2 },
    { type: 'text', text: 'I flagged 4 of them for further review because their recurring revenue models matched the brief, and I presented my reasons to the associate.', sources: ['E4', 'E5'], change: null },
    { type: 'gap', text: 'what happened next?', sources: [], change: null },
    { type: 'text', text: "That showed me how careful analysis feeds a deal decision, and that's the work I want to do every day.", sources: [], change: null },
    { type: 'text', text: 'Alongside my degree I also trained three new colleagues at Pho House, so I am used to taking responsibility.', sources: ['E7', 'T'], change: null },
    { type: 'text', text: "I'm applying to Barclays because", sources: ['T'], change: 3 },
    { type: 'gap', text: "one thing about Barclays you've looked into", sources: [], change: null }
  ],
  changes: [{ n: 1, reason: 'x' }, { n: 2, reason: 'y' }, { n: 3, reason: 'z' }]
};
const g = validateRewrite(good, { transcript, evidence, firm });
assert.equal(g.ok, true, 'good rewrite should pass');
assert.equal(g.parts.filter(p => !p.gap).length, 7, 'all sourced sentences kept');
console.log('good:', g.words, 'words,', g.parts.filter(p => p.gap).length, 'gaps');

// 2) One invented fact only removes THAT sentence, not the whole answer.
const bad = structuredClone(good);
bad.parts.splice(4, 0, { type: 'text', text: 'Two of them went on to a £40m deal led by Goldman.', sources: ['E4'], change: null });
const b = validateRewrite(bad, { transcript, evidence, firm });
assert.ok(!b.parts.some(p => /£40m|Goldman/.test(p.text)), 'invented sentence removed');
assert.ok(b.parts.filter(p => !p.gap).length >= 6, 'other sentences survive');
console.log('one invented fact:', b.words, 'words kept, invented sentence removed');

// 3) CV fragments pasted as speech are dropped.
const frag = { parts: [{ type: 'text', text: 'BSc Economics, 2023–2026. Final year. Predicted 2:1. Modules: Corporate Finance.', sources: ['E1'], change: null }, ...good.parts.slice(1)], changes: good.changes };
const f = validateRewrite(frag, { transcript, evidence, firm });
assert.ok(!f.parts.some(p => /Modules:/.test(p.text)), 'CV fragment dropped');

// 4) Model failure → deterministic fallback still gives a full, sourced answer with ≤2 gaps.
const fb = fallbackRewrite({ transcript, evidence, firm, question: 'Give me a brief introduction…' });
const c = toClient(fb);
assert.ok(c.gaps <= 2);
assert.ok(!/supported the investment team/i.test(c.text), 'weak line not used');
assert.ok(/12 UK software companies/.test(c.text) && /Flagged 4|flagged 4/.test(c.text), 'strongest Redcliffe evidence used');
assert.ok(!/LVMH/.test(c.text), 'unrelated project not used');
console.log('fallback (' + c.words + ' words):\n' + c.text);
console.log('\nall tests passed');
