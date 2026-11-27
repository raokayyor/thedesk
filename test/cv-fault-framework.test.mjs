import { runFramework, verdictFor, sectionsCheck, testGap } from '../lib/cv-fault-framework.mjs';
import assert from 'node:assert/strict';
const CVS = {
james: `James Patel
EDUCATION
Leeds University Business School, BSc Accounting and Finance, 2023-2026. Predicted 2:1.
A-levels: Maths A, Economics A, History B.
EXPERIENCE
Sales Assistant, Next (part-time), Sep 2023 - present
- Helped customers and worked on the till
- Responsible for stock
- Worked weekends
Summer Intern, Patel & Co Accountants (family friend's firm), July 2024
- Helped with bookkeeping
- Did data entry in Excel for client accounts
- Shadowed the partner in client meetings
POSITIONS
Member, Leeds Finance Society
Football team member
SKILLS
Excel, PowerPoint, good communication, team player, hard working
Interests: investing, football, travelling`,
amelia: `Amelia Chen
EDUCATION
University of Bristol, BSc Economics, 2023-2026. Predicted 2:1.
EXPERIENCE
Corporate Finance Intern, Redcliffe Partners, Jul-Aug 2025
- Researched 12 UK software companies for a prospective acquisition screen
- Recorded business descriptions, revenue and EBITDA in an Excel comparison table
- Flagged 4 companies for further review because their recurring revenue models matched the screen brief
- Presented the comparison table and selection reasons to an associate
Team Member, Pho House (part-time), 2024-2025
- Trained 3 new colleagues on ordering and till procedures
- Worked 12 hours per week alongside university
POSITIONS
Member, Economics Society
LVMH valuation, University Corporate Finance project, 2025
- Built a DCF and trading-comparables valuation
- Tested revenue growth assumptions of 3%, 5% and 7% and presented valuation sensitivity to a 4-person seminar team
SKILLS
Excel (DCF, comps, pivot tables), PowerPoint`,
strong: `Priya Shah
EDUCATION
LSE, BSc Mathematics and Economics, 2023-2026. Predicted First.
EXPERIENCE
Spring Week, Goldman Sachs, Apr 2025
- Built a 3-statement model for a consumer company and pitched a buy recommendation to 2 VPs, which was selected as the top team pitch
Analyst Intern, Mid-market PE fund, Jul-Aug 2025
- Screened 40 healthcare targets and recommended 3, 1 of which went to IC
POSITIONS
President, LSE Investment Society: led 25 analysts, grew membership 40%
SKILLS
Excel (LBO, DCF, VBA), Python`,
sophie: `Sophie Grant
EDUCATION
University of Warwick, BSc Economics, 2023-2026. Predicted First.
EXPERIENCE
Spring Insight Programme, a UK investment bank, April 2025
- Worked in a team of 5 to build a pitch for a mid-cap acquisition and presented it to 2 Vice Presidents; our team's pitch was ranked first of 8
Audit Intern, regional accountancy firm, July-August 2025
- Tested 40 revenue transactions for a manufacturing client and flagged 3 that were booked in the wrong period, which the senior adjusted before sign-off
POSITIONS
Treasurer, Warwick Investment Society, 2024-2025
- Managed a £6,000 budget and organised 4 speaker events with 120+ attendees in total
Member, university netball team
SKILLS
Excel (DCF, comps, pivot tables), Python (pandas)
Interests: half-marathon running (1:52), writing a weekly markets newsletter for 300 subscribers`,
none: `Tom Lee
EDUCATION
University of Kent, BA History, 2024-2027.
SKILLS
Microsoft Office, hard working, team player
Interests: reading, gym`,
};
for (const [k, cv] of Object.entries(CVS)) {
  const r1 = runFramework(cv, { firm: 'Barclays' }), r2 = runFramework(cv, { firm: 'Barclays' });
  assert.deepEqual(r1, r2, 'deterministic');
  assert.equal(r1.reasons.length, 3, k + ' has 3 reasons');
  console.log('\n=== ' + k.toUpperCase());
  r1.reasons.forEach((r, i) => console.log(` ${i+1}${r.shown?'':' [hidden]'} (${r.points}) ${r.text}`));
  r1.flaggedLines.forEach(l => console.log(`  ⚑ [${l.section}] "${l.text}" — ${l.why} (${l.faults.join(',')})`));
  console.log('  +' + r1.moreFlagged + ' more · course:', r1.course.type, '·', r1.course.grade);
}
const so=runFramework(CVS.sophie,{firm:'Barclays'}); assert.ok(!so.flaggedLines.some(l=>/ranked first of 8|adjusted before sign-off/.test(l.text)), 'strong lines must not be flagged');
const am=runFramework(CVS.amelia,{firm:'Barclays',route:'Investment banking'}); assert.equal(am.teaserLine.section,'internship','Amelia teaser comes from her internship, not a membership'); console.log('\nAmelia teaser:', am.teaserLine.text, '|', am.courseTeaser);
const b4=runFramework(CVS.james,{route:'Big Four'}); assert.equal(b4.screener,'Big Four firms'); console.log('Big Four wording:', b4.courseTeaser);
console.log('\n', verdictFor(34).headline, '|', verdictFor(58).headline);

// sections check
const js = sectionsCheck(CVS.james);
assert.ok(js.find(r=>r.kind==='skills').change.includes('Did data entry in Excel for client accounts'), 'James Excel proof uses the line that names Excel');
assert.ok(js.find(r=>r.kind==='interests').wrong.includes('Pitch me a stock'), 'investing -> pitch me a stock');
assert.ok(!sectionsCheck(CVS.amelia).some(r=>r.kind==='skills'), 'backed skills (DCF, comps) are not flagged');
assert.ok(sectionsCheck(CVS.sophie).find(r=>r.kind==='interests').wrong.includes('last piece'), 'newsletter beats markets');
const banned=/leverage|showcase|passionate about|dynamic|robust|impactful/i;
for (const cv of Object.values(CVS)) for (const r of sectionsCheck(cv)) assert.ok(!banned.test(r.wrong+r.change), 'no AI-speak');
assert.equal(testGap({numerical:1,commercial:1}).id,'tests_weak'); assert.equal(testGap({numerical:3,commercial:3}),null);
// Reason 1 is always a headline (never skills/interests/ordering)
const { CV_GAPS, FALLBACK_GAPS } = await import('../lib/cv-fault-framework.mjs');
const headlineIds = new Set([...CV_GAPS, ...FALLBACK_GAPS].filter(g=>g.headline).map(g=>g.id));
for (const [k,cv] of Object.entries(CVS)) assert.ok(headlineIds.has(runFramework(cv,{firm:'Barclays'}).reasons[0].id), k+' reason 1 is a headline gap');
const interestsOnly = `Sam Ray\nEDUCATION\nUniversity of Leeds, BSc Economics, 2023-2026. Predicted 2:1.\nEXPERIENCE\nAnalyst Intern, Northern Capital, Summer 2025\n- Built a DCF for 2 retail companies and recommended 1, which the team took to the client meeting\n- Led a team of 3 to update 40 comps\nPOSITIONS\nPresident, Leeds Investment Society, 2024-2025\n- Grew membership 30% and ran a stock pitch competition for 60 students\nSKILLS\nExcel (DCF, comps), Python\nInterests: reading, travelling`;
const ir = runFramework(interestsOnly,{firm:'Barclays'}); assert.ok(ir.reasons[0].id!=='interests_generic', 'interests never lead'); console.log('Strong CV with generic interests -> reason 1:', ir.reasons[0].text);
assert.ok(!/Audit Intern/.test(runFramework(CVS.sophie).teaserLine.role||''), 'society line not labelled as a job');
console.log('sections + test gap tests pass');
