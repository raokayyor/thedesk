# Free CV check v6: build exactly this (replaces the earlier free-result briefs)

**Mocks:** `design/free-check-v6-mock.html` (add `class="unlocked"` to `<body>` to see the after-join state) · `design/free-check-v6-locked-phone.jpg` · `design/free-check-v6-unlocked-phone.jpg`. Phone first (390×844); desktop is the same column centred.

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
