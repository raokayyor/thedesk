import { runFramework, verdictFor } from '../lib/cv-fault-framework.mjs';
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
console.log('\n', verdictFor(34).headline, '|', verdictFor(58).headline);
