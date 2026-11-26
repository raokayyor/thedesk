# Free summary page: make them want the fix (26 Nov)

**Scope:** the **summary page only** (`result-final-design.html`, before the email). The full free assessment comes later, once the email works.
**Goal:** the fear is working ("Right now, you'd likely be screened out"); the *desire* isn't. A student must see how big the fix is, why that line matters, and that reasons are specific to *her*, including strong CVs. Phone first (390×844). Use the attached `lib/cv-fault-framework.mjs` (all tests must pass).

## 1. The flagged line: show the scale of the fix
- **Which line:** use the framework's `teaserLine`: the worst line from **internship → experience → positions → skills**. Never a society membership when a job or internship line is weak. (Currently Amelia shows "Member, Economics Society"; Raj shows the tutoring line instead of his Rolls-Royce internship.)
- **Stakes line** directly under it (small, bold): "**This is the first line a screener reads on your {internship / main job / society role}.**" The section comes from the framework.
- **Why** (as now): the framework's one-line reason.
- **Stronger version, partly revealed:**
  - generate the real rewrite on the server (same validator: materially different from the original, invents nothing, amber gaps for missing facts)
  - send **only the first 5–7 words** to the page, e.g. *"Entered and checked [＋ how many?] client accounts…"*, then a blurred placeholder of similar length (the rest of the real text must not be in the page)
  - add "**+{n} pts if fixed**" only if the scorer can compute the per-line gain for this CV; otherwise omit it (never estimate)
- Under it: "**+ {n} more lines like this on your CV**".

## 2. Reasons: always specific, including strong CVs
- Always the framework's reason sentences (no "Preparation check · …?" question format). Numbered 1, 2, then the blurred "3 · The one most students miss".
- **Strong CVs (fallback reasons) must name her actual line:**
  - "Your best work stops at the method…" becomes "**Your {strongest line's subject, e.g. LVMH valuation} never says what it told you.**" Use the highest-severity line that has a number but no "so what" (framework: a line with `no_outcome` and a number).
  - "Nothing on your CV connects you to {firm}…" only if no line mentions the firm or its business areas; otherwise use the next reason.
  - Generic fallbacks may only be used if no line qualifies.

## 3. Tests: real numbers
- "{n} topics you'd be asked about" = the number of distinct topics from **questions answered wrongly**. It currently shows "5" for every student (Tom 2/10, Amelia 2/10, James 5/10 all show 5). Only the count shows here; topic names come after the email.

## 4. Route-aware wording
- Use the framework's `screener` and `courseTeaser` everywhere: banks / Big Four firms / asset managers / consultancies / employers (for "Not sure yet").
- Bug: Raj (Big Four) sees "there's one thing **banks** will check".

## 5. The email box: sell what's behind it
- Heading: "**See your fix in full.**"
- List:
  - "✓ Reason #3, the one most students miss"
  - "✓ This line, fully rewritten"
  - "✓ {n} more lines flagged, and why"
  - "✓ Your course, grade and test topics"
- Button: [Show me my fix →]

## 6. After the email (spec for the full free assessment; build once the email works)
- Fix #1 as a full **before → after card** (same style as the homepage Caffè Nero card), with amber gaps tappable to fill.
- Directly under it: "**{n} more lines like this on your CV**", with the first 2 shown as line + why (fixes locked), then [**Fix all of them · £89**].
- The £89 button reads as the next step after the win, not a paywall: no other upsell above it.

## 7. Proof
Re-run these 5 test CVs (text in `test/cv-fault-framework.test.mjs`): **Tom** (no experience, Not sure yet), **James** (weak, IB Barclays), **Raj** (engineer, Big Four), **Amelia** (average, IB Barclays), **Sophie** (strong, IB Barclays). Send phone screenshots of each summary and check:
- the flagged line is from internship/experience where one exists
- the stronger version shows 5–7 real words, then blur
- strong CVs get reasons that name their own lines
- the topic count matches wrong answers
- the wording matches the route


## Latest override: missing-information chips
The user removed the 5–7-word preview. Never publish real rewrite words before email. Show Your line is missing plus two or three labels from validated amber gaps, with deterministic framework-fault fallback even if generation fails. Keep only a blurred placeholder for Stronger version. Prefer a second source-specific reason before generic ordering. Latest requested proof is Amelia and Raj phone blocks.
