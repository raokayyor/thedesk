# BUILD: Free CV check, final (27 Nov). Replaces every earlier free-result brief.

**Attach:**
- `lib/cv-fault-framework.mjs` + `test/cv-fault-framework.test.mjs` (all tests must pass)
- `design/free-check-v6-mock.html` (visual style)
- `design/sections-card-james-phone.jpg`

**Phone first (390×844).** Desktop = same column, centred.

## 0. Do first
1. **Email / "Join free" works end to end:** email → free account (magic link, no password) → "Your result is saved" email → page unlocks in place. It currently shows "Email saving is currently unavailable".
2. **Bug:** "Start again" must clear the route, firms, CV and answers (local + server). Repro: IB + Barclays → Start again → Big Four, no firm → the header wrongly shows "Barclays". With no firm, use the route noun ("Big Four firms").
3. **Caching:** HTML served with `Cache-Control: no-cache`.

## 1. Engine rules
- **Reasons, flagged lines, order:** `runFramework()`. Single marked-up line = `teaserLine`. Screener wording = `screener` (banks / Big Four firms / asset managers / consultancies / employers).
- **Sections card:** `sectionsCheck()` (rows with `says` / `wrong` / `change`, all built from the student's own CV).
- **Test-based reason:** `testGap({numerical, commercial}, screener)` competes with the CV reasons by points.
- **Reason sentences only**, no "Preparation check · …?" questions.
- **Consistency:** the same CV + the same answers = the same score, reasons and lines (cache by hash).
- **Topic count** = distinct topics from wrongly answered questions.
- **Fix #1 validator:** materially different (similarity under 0.85), nothing invented, at most 2 amber gaps, never before = after.
- **Locked content** is placeholder text in the page, never the real text.
- **Role line** = "{Job title} · {Employer}" only (no dates, no bracketed notes).
- **Banned wording anywhere:** leverage, showcase, passionate about, dynamic, robust, impactful; "AI will reject you".

## 2. Page, top to bottom (locked = before joining)
1. **Score reveal (full screen, dark):**
   - route · firm
   - verdict headline by band (0–44 "Right now, you'd likely be screened out." · 45–64 "You'd get read, but not shortlisted." · 65–74 "You're close, but something would stop you." · 75+ "You'd likely be shortlisted, but not every line is pulling its weight.")
   - big score + band bar
   - **score parts:** "CV {x}/65 · Tests {y}/35" (or "CV only · tests not taken")
   - button [Show me what's holding me back ↓]
2. **Why you wouldn't be shortlisted:** reason 1 shown; reasons 2 and 3 blurred (3 labelled "THE ONE MOST STUDENTS MISS"), with "Join free to unlock reasons 2 and 3".
3. **A question you'll be asked:**
   - one interview question from the `teaserLine` experience, shown **in full**
   - "How to answer, built from your CV:" step 1 (situation, CV facts only) visible ✓; steps 2–3 blurred 🔒
   - "Join free to see the full answer + practise it on camera"
4. **Your weakest lines** + red pill "{n} flagged":
   - teaser line as a marked-up CV snippet (role · employer, highlighted line, red "↑ {why}", "Missing:" chips, blurred fix ✓)
   - next 2 lines blurred 🔒
   - "+{n} more flagged on your CV"
5. **The sections most students waste** (`sectionsCheck()`):
   - **one row in full** (priority: interests > skills > education): label, quoted "says", red "✗ wrong", and the "Change:" line **blurred** 🔒
   - other rows: label + quoted "says" + "✗ flagged 🔒"
   - "+{n} more sections flagged"
6. **Your tests:**
   - "YOUR TESTS · {n}/5 numerical · {n}/5 commercial"
   - **one question she got wrong** (prefer numerical): question text, then "You said {answer} · Correct: {answer}"
   - "🔒 Why, plus your {t-1} other topics to revise"
7. **ATS readiness, level only:**
   - LOW "Your CV could be filtered out before a person reads it." / MEDIUM "Parts of your CV may not read cleanly in application systems." / STRONG "Your CV should read cleanly in application systems."
   - 3-segment bar + "🔒 Full ATS breakdown and fixes in your full review"
   - strict scoring from 5 real checks: route key terms in experience lines (Rao-approved lists); 3+ lines with numbers; standard headings; consistent dates/titles; PDF reads in order (pasted text = fail)
   - STRONG = 5 pass · MEDIUM = 4 · LOW = 3 or fewer. The James test CV must be LOW.
8. **Cydney's quote.**
9. **Still locked for you:**
   - "You've seen {pct}% of your check" + progress bar (calculated, never hard-coded)
   - list (only items that exist):
     - reasons 2 and 3
     - the full answer to your interview question
     - your first fix: "{teaser line, max 40 chars}", rewritten
     - why {n} more lines are flagged
     - what to change in your {sections}
     - your {t-1} other test topics
   - [Join free: unlock all of it →] (focuses the pinned email field)
10. **Pinned join bar (phone, after the reveal):** "Join free to unlock your breakdown + first fix" · [email] [Join free →] · "or get your full review · £89 for the year".

## 3. After joining free (same page, unlocked in place)
- Header "✓ SAVED TO YOUR DESK"; toast "You're in, {first name}. Your breakdown and first fix are unlocked ↓"
- **Reasons 2 and 3** revealed.
- **Interview question:** all 3 steps (amber gaps for missing facts) + [Practise it →] (interview trial on this question).
- **Weakest lines:** "YOUR FIRST FIX" (validated rewrite, tappable amber gaps, "We never invent them."); why for every flagged line; their fixes stay locked 🔒.
- **Sections:** all "wrong" lines + **one** "Change:" line (the first row); the other changes locked 🔒.
- **Tests:** the explanation for the one missed question; other topics as a count, locked.
- **ATS:** still level only.
- "Still locked" becomes "Your check is unlocked ✓".
- **Membership card (dark)** after the quote:
  - "£89 FOR THE YEAR · YOUR FULL REVIEW + EVERY TOOL"
  - "Get every line fixed before {firm / route noun} sees it."
  - ticks with their numbers:
    - all {n} CV lines fixed and your ATS readiness raised
    - your degree, skills and interests rewritten
    - your {firm} application answers drafted from your CV
    - interview practice: {k} {firm} questions, scored and fixed
    - your {t} weak test topics with 2,000+ practice questions
    - a 30-day plan and a question answered by a practitioner
  - [Get my full review · £89 for the year]
  - "One payment · no auto-renewal · less than one CV rewrite · See a full review →" (Amelia's sample)
- **Pinned bar:** [Fix all {n} lines · £89 for the year] · "Go to My Desk → · your free trials are set up for {firm}".

## 4. Join free = account
- Email only, magic link.
- **Pre-fill the profile:** name, university, course, predicted grade, experience, route, firms. **Never store date of birth, home address or phone.**
- "We've set up your Desk from your CV. Check your details →".
- Free My Desk = the same as everyone's, with the trials on their CV and firm.

## 5. Pricing wording (everywhere)
- "£89 for the year" (one payment, 12 months, no auto-renewal). No "/yr", "a year", "Unlock full report" or "cancel anytime".
- Checkout states "£89 · 12 months' access · no auto-renewal".
- Store the expiry date; email 2 weeks before: "Your Desk access ends on {date}. Renew for another year →" (opt-in).

## 6. Proof
Run the 5 test CVs (Tom, James, Raj, Amelia, Sophie) with their routes/firms. Phone screenshots of the **reveal**, the **locked page** and the **unlocked page** for each.

**Pass only if:**
- the teaser line comes from internship/experience where one exists
- the route wording is right
- the topic count matches wrong answers
- the one missed test question is real
- the sections rows quote her exact words
- James is ATS LOW
- fix #1 differs from the original
- the same CV twice = an identical result
- Start again clears the firm
