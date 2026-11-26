# The Desk CV framework: one rulebook for every free assessment

**Code:** `lib/cv-fault-framework.mjs` (ready to use) · **Tests:** `test/cv-fault-framework.test.mjs` (4 CVs: weak, Amelia, strong, no experience).
**Rule:** the framework **finds** the faults (deterministic rules, no AI). AI is only used afterwards to **write** fixes, and those go through the rewrite validator. The same CV always gives the same reasons, the same lines, the same order.

## 1. Verdict (by score band)
| Score | Band | Headline (free summary) |
|---|---|---|
| 0–44 | Developing | Right now, you'd likely be screened out. |
| 45–64 | Developing | You'd get read, but not shortlisted. |
| 65–74 | Borderline | You're close, but something would stop you. |
| 75+ | Competitive | You'd likely be shortlisted, but not every line is pulling its weight. |

## 2. "Why you wouldn't be shortlisted": always 3 reasons (2 shown, #3 hidden)
Checked in order of points at stake. The top 3 that fire are used; if fewer than 3 fire (strong CVs), the fallbacks fill the gap, so **every CV always gets 3**.

| Gap | Fires when | Points | Reason shown |
|---|---|---|---|
| Internship tasks only | internship lines have no result | 12 | Your internship says what you did, not what it achieved. |
| No relevant experience | no internship and nothing finance-related | 12 | Nothing on your CV yet is close to the job you want. |
| No numbers | no bullet contains a number | 10 | Not one line has a number in it, so nothing shows scale. |
| No leadership | no led/captain/president/organised/trained/committee | 9 | Nothing shows you can lead or take responsibility. |
| No commercial awareness | no deals/markets/valuation/trading words | 8 | Nothing shows you follow markets or deals. |
| No "why finance" | no finance internship, valuation, spring week, investment club, competition | 7 | There's no sign of why you want finance, beyond saying so. |
| Skills as claims | soft-skill claims, or "Excel" with nothing built | 6 | Your skills are claims, not evidence. |
| Generic interests | interests with no specifics | 4 | Your interests are generic, a missed chance to stand out. |
| *Fallback 1* | always | 5 | Your best work stops at the method, not what it meant for a decision. |
| *Fallback 2* | always | 4 | Nothing on your CV connects you to {firm} in particular. |
| *Fallback 3* | always | 3 | Your strongest evidence isn't where a screener looks first. |

## 3. "Which lines are hurting me?": every line checked, top 3 shown
Each experience, internship, position and skills line is checked against these faults. Severity = sum of weights × section weight (internship 1.5, experience 1.3, positions 1.1, education 1.0, skills 0.9, interests 0.7). The top 3 are shown, plus "+ n more flagged". The reason shown is the most specific fault.

| Fault | Applies to | Weight | Why (shown to the student) |
|---|---|---|---|
| Exposure, not contribution ("Shadowed…", "Attended…") | experience | 5 | Shows you were in the room, not what you contributed. |
| Duty, not achievement ("Responsible for…", "Helped…", "Did…") | experience | 5 | Says what you were there for, not what you did. |
| Soft claim ("team player", "hard working") | all | 4 | A claim anyone can write. Banks want the evidence, not the adjective. |
| "Excel" with nothing built | skills | 3 | "Excel" with nothing built: every applicant writes this. |
| Membership only ("Member, …") | positions | 4 | Membership alone shows interest, not action. |
| Self-undermining word ("family friend's", "basic", "just") | experience, positions | 3 | A word here undersells you or invites the wrong question. |
| No result | experience, positions | 4 | No result: a screener can't tell if it mattered. |
| No number | experience | 3 | No number, so there's no sense of scale. |
| Weak opening verb | experience | 2 | Weak opening verb hides your part in it. |
| Too short (under 6 words) | experience, positions | 2 | Too thin to judge: one short phrase. |

## 4. "Does my university and course affect it?" (approved wording only)
- Course type → one note (finance / economics / maths-quant / other).
- Predicted grade → one note (First / 2:1 / 2:2 / none).
- **Never** say a university isn't good enough. No public target lists. Any per-university line needs Rao's sign-off.

## 5. Tests
- Scores from the 5 + 5 questions; the topics missed are mapped from each wrong question's topic tag.

## 6. How it feeds the pages
- **Free summary (no email):** verdict + score · reasons 1–2 shown, 3 blurred ("the one most students miss") · university/course teaser · test scores + topic count · email box.
- **Free full assessment (after email):** reason 3 · the 3 flagged lines + why · **fix #1 only** (AI rewrite, validated) · university/course note · test topics · the banker's question.
- **Member:** fixes for every flagged line, worked answers, the full plan.

## 7. Wording needing Rao's sign-off
- verdict headlines
- the self-undermining list (e.g. "family friend's firm")
- course and grade notes
- the fallback reasons

## Test results (from `test/cv-fault-framework.test.mjs`)
- **James (weak):**
  - reasons: internship tasks only / no numbers / [hidden] no leadership
  - lines: "Helped with bookkeeping", "Responsible for stock", "Did data entry in Excel for client accounts" (+6 more)
- **Amelia (sample):**
  - reasons: stops at the method / no Barclays link / [hidden] ordering
  - lines: "Member, Economics Society", "Recorded … in an Excel comparison table", "Presented … to an associate"
- **Strong (Priya):** 3 fallback reasons, 0 lines flagged (correct: a strong CV shouldn't be invented faults)
- **No experience (Tom):**
  - reasons: nothing close to the job / no numbers / [hidden] no leadership
  - lines: soft claims in skills
