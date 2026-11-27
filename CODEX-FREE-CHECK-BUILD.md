# BUILD: Free CV check (final, all-in-one). Replaces every earlier free-result / summary brief.

**Attach with this:**
- `lib/cv-fault-framework.mjs` and `test/cv-fault-framework.test.mjs` (the rulebook; all tests must pass)
- `design/free-check-v6-mock.html` (add `class="unlocked"` to `<body>` for the after-join state)
- `design/free-check-v6-locked-phone.jpg` and `design/free-check-v6-unlocked-phone.jpg`

## 0. Order of work
1. **The email / "Join free" must work end to end:** email → free account → magic-link email → result page unlocked. Currently it shows "Email saving is currently unavailable".
2. Build the page exactly as below.
3. Run the 5 test CVs and send screenshots.

## 1. Engine rules (apply everywhere)
- **Reasons, flagged lines and their order** come from `runFramework()`. Use `teaserLine` for the marked-up line, `screener` for "banks / Big Four firms / asset managers / consultancies / employers" wording, and `courseTeaser` where needed.
- **Reason sentences only** (no "Preparation check · …?" questions). Strong CVs: the "stops at the method" reason must name her own line ("Your {subject} never says what it told you."); generic fallbacks only if no line qualifies.
- **Consistency:** the same CV text + the same answers = the same score, reasons and lines (cache by hash).
- **Test topic count** = the number of distinct topics from wrongly answered questions.
- **Fix #1 validator:** materially different from the original (similarity under 0.85), nothing invented, at most 2 amber gaps, never before = after.
- **Locked content** is placeholder text in the page, never the real text.
- **Caching:** serve HTML with `Cache-Control: no-cache` so new deploys load immediately.

**One page, two states.**
- **Locked** (straight after the assessment).
- **Unlocked** (after "Join free": email only, magic link, logged-in free account, profile pre-filled from the CV; no date of birth, address or phone).
- £89 = "Your full review + every tool".

## Locked state, top to bottom
1. Header "The Desk" · "YOUR CV CHECK".
2. **Dark verdict card:** route · firm; verdict headline by band; big score + band bar; "Tests {n}/5 numerical · {n}/5 commercial · {n} topics to revise".
3. **Why you wouldn't be shortlisted:** reason 1 shown; reasons 2 and 3 as blurred striped cards (placeholder text only); reason 3 labelled "THE ONE MOST STUDENTS MISS".
4. **Your weakest lines** + red pill "{n} flagged":
   - the teaser line as a marked-up CV snippet: role · employer, the line highlighted, red handwritten note "↑ {why}", "MISSING" + green chips, blurred fix with ✓
   - the next 2 flagged lines as blurred cards with 🔒
   - "+ {n} more flagged on your CV"
5. **ATS readiness: level only, no details:**
   - "LOW" (red) / "MEDIUM" (amber) / "STRONG" (green) + a 3-segment bar + one line:
     - LOW: "Your CV could be filtered out before a person reads it."
     - MEDIUM: "Parts of your CV may not read cleanly in application systems."
     - STRONG: "Your CV should read cleanly in application systems."
   - then "🔒 Full ATS breakdown and fixes in your full review"
   - **no checks list and no examples on the free page** (same before and after joining)
   - strict scoring from 5 real checks: route key terms used in experience lines (Rao-approved lists); 3+ lines with a number; standard headings; consistent dates/titles; PDF reads in order (pasted text = fail)
   - STRONG = 5 pass; MEDIUM = 4; LOW = 3 or fewer. Never a fixed value. Never claim "AI will reject you".
6. **Cydney's quote.**
7. **Pinned bottom bar (phone):** "Join free to unlock your breakdown + first fix" · [email] [Join free →] · "or get your full review · £89/yr".

## Unlocked state (same page, in place)
- Header right: "✓ SAVED TO YOUR DESK". Toast: "You're in, {first name}. Your breakdown and first fix are unlocked ↓".
- Reasons 2 and 3 revealed (same card style as reason 1).
- **Teaser line:** "YOUR FIRST FIX", the validated rewrite with tappable amber gaps ("＋ how many?"), and "Tap the amber gaps to add your facts. We never invent them."
- The other flagged lines unblurred with their *why*; their fixes stay locked 🔒.
- ATS: unchanged (level only); the breakdown stays in the £89 full review.
- **Membership card (dark)** under the quote: "£89 · YOUR FULL REVIEW + EVERY TOOL", heading "Get every line fixed before {firm} sees it.", 5 ticks using their numbers:
  - all {n} CV lines fixed, and your ATS readiness raised
  - your {firm} application answers drafted from your CV
  - interview practice: {k} {firm} questions, scored and fixed
  - your {t} weak test topics, with 2,000+ practice questions
  - a 30-day plan and a question answered by a practitioner

  Then [Get my full review · £89/yr], "Less than one CV rewrite · See a full review →" (Amelia's sample).
- **Pinned bar:** [Fix all {n} lines · £89/yr] · "Go to My Desk → · your free trials are set up for {firm}".

## Rules
- Everything locked is placeholder text in the page, never the real content.
- Reasons, lines and order come from `lib/cv-fault-framework.mjs`.
- The rewrite validator applies to fix #1.
- **Proof:** 5 test CVs, both states, phone screenshots. The email must work.

## 2. Join free = account + unlock (email only)
- Magic link, no password. Creates a logged-in free account with the assessment saved.
- **Pre-fill the profile from the CV and assessment:** name, university, course, predicted grade, experience entries, route and firms. **Do not extract or store date of birth, home address or phone.** Show "We've set up your Desk from your CV. Check your details →".
- Sends "Your result is saved" with the login link.
- A free account's My Desk is the same as everyone's; the trials run on their CV and firm.
- **Naming:** free = "Your CV check" (promises "your first fix", singular); £89 = "Your full review + every tool". The £89 checkout returns to this page with everything unlocked.

## 3. Proof (send all)
Run the 5 test CVs from `test/cv-fault-framework.test.mjs` (Tom, James, Raj, Amelia, Sophie), each with its route and firm.

For each, send:
- phone screenshots (390×844) of the **locked** and **unlocked** states
- the ATS readiness level
- the teaser line
- fix #1

**Pass only if:**
- the teaser line comes from internship/experience where one exists
- the route wording is right
- the topic count matches wrong answers
- fix #1 is never the same as the original
- a second run of one CV gives an identical result
