# Free result: one page that unlocks in place (replaces "summary page" + "full free assessment")

**Decision:** there is **one** free result page. Before the email, parts are blurred. Giving the email **unlocks the same page in place** (blur clears, fix #1 appears); no separate "full free assessment" page. £89 unlocks fixes for every other line plus the rest of The Desk.
**Mock:** `design/free-summary-v5-mock.html` · `design/free-summary-v5-full-phone.jpg`. Phone first (390×844). Keep the framework (`lib/cv-fault-framework.mjs`) as the source of reasons and lines.

## Before the email (locked state)
1. **Verdict card (dark):** route · firm label; verdict headline by band; big score + band bar (Developing · 65 · 75 Competitive); one line: "Tests {n}/5 numerical · {n}/5 commercial · {n} topics to revise".
2. **"Why you wouldn't be shortlisted":** **reason 1 shown**; reasons 2 and 3 as blurred striped cards (placeholder text, never the real text in the page); reason 3 labelled "THE ONE MOST STUDENTS MISS".
3. **"Your weakest lines"** + a red pill "{n} flagged":
   - **The first line (framework `teaserLine`) as a marked-up CV snippet:** role · employer in small grey, then the line in EB Garamond with a red highlighter underline, a handwritten-style red note (Caveat) "↑ {why}", "MISSING" + green chips (what the rewrite adds), and the fix blurred with a ✓.
   - **The next 2 flagged lines** as faded, blurred snippet cards (their own words, blurred to show there's more).
   - "+ {n} more flagged on your CV".
4. **Cydney's quote** (approved wording only).
5. **Email bar, pinned to the bottom of the screen on phone:** "See your full breakdown + first fix, free" · [email] [Show me →] · "or fix all {n} lines now · £89/yr" (text link). Not pinned on desktop.

**Remove:** the "Does my university and course affect it?" block, the separate "Your tests" block, the stakes sentence, the "Stronger version" label, the 4-item unlock list, the long small print, and the practitioner card (it moves into the unlocked state).

## After the email (same page, unlocked)
- Reasons 2 and 3 revealed.
- **Fix #1 revealed:** the full before → after for the teaser line (validated: materially different, nothing invented, amber gaps tappable).
- The other flagged lines unblurred, each with its *why*; their fixes stay locked: "Fix all {n} · £89".
- New sections appear below: "Does your university and course affect it?" (approved note), "Your test topics" (names), "What a banker would ask you" (practitioner line).
- The email bar is replaced by: [Fix all {n} lines · £89/yr] + "Your result is saved, link sent to {email}".
- Small toast on unlock: "Unlocked. Your first fix is below ↓"

## Proof
5 test CVs; phone screenshots of the locked and unlocked states for each. The email must work.
