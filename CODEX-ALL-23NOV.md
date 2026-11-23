# Codex: everything outstanding (23 Nov)

All references are on branch `claude/assessment-test`, in `design/` and the CODEX-*.md files named below. Do the sections in order and send Rao screenshots after each one.

## A. Homepage hero
**Phone (≤900px).** Reference: `design/home-phone-lean-mock.html` and `design/hero-lean.jpg`.
1. H1: "Find out why you'd be rejected. Then fix it."
2. Subline: "Your coach for getting into finance." No kicker or pill on phone.
3. Example card: no title, no labels, no footer.
   - Row 1: red ✕ + "Barista, Caffè Nero (part-time)".
   - Then the dark pill "↓ Fixed with The Desk", with a 10px gap above and below.
   - Then the green box with ✓ and the rebuilt line in Garamond.
4. CTA "Start my free review →", and under it "Free · 10 mins · no card".
5. Live strip on one line: 38px photo, "**Ask me anything** · live {day} {time}, free", "Join →" right-aligned.
6. Goldman line: "360k applications to Goldman Sachs. Under 1% got in.¹ Make it count."

**Desktop.** Reference: `design/hero-fix-card.jpg`.
- Pill above the H1: "Your coach for getting into finance" (--ink background, white, 13.5px, weight 600).
- Keep the full H1 and the line "For students applying to banks, asset managers and the Big Four."
- Example card:
  - title "One line from a student's CV, fixed." (Garamond 600, ink)
  - ✕ "Their CV said" / "Barista, Caffè Nero (part-time)", no strikethrough
  - pill "↓ Fixed with The Desk"
  - ✓ "Now it says" + the rebuilt line
  - "+3–5 points on their score · See how ↓"
- CTA "Start my free application review →", and under it "We score your CV, answers and tests, then show you what to fix first · 10 mins · no card".

**Both:**
- The sticky phone bar reads "Free review · 10 mins", button "Start →".
- The final CTA, the £89 tile button ("Start with my free review →") and the 1:1 page bottom CTA use the same wording.
- Homepage `<title>`: "The Desk · Your coach for getting into finance".

**Live strip never hides.** If there's an `openToAll` session in the next 14 days, show it with "Join →". Otherwise show the fallback: "**Ask me anything** · every fortnight, free" + "Get the date →". The fallback opens a one-field email form (with a consent box) that saves to `leads:live-notify` and auto-sends the invite when the next session is created. Show the red dot only when a dated session exists.

## B. Interview coach screens: phone and desktop
Build all of `CODEX-INTERVIEW-PHONE.md`. References: `design/interview-phone-simple-mock.html`, `interview-crib-mock.html`, `interview-desktop-mock.html` and their JPGs. In summary:
- **Generated content:** facts only from the CV or the student's own words. Unknowns become amber gaps. Validate server-side.
- **Setup:** one screen, a prefilled summary card with "Change", "What kind of interview?" (3 cards), a Practice / Real interview toggle, and "Start · {n} questions →" in ink (no blue).
- **Think time (dark):**
  - the question
  - "Use one from your CV" (2 radio rows), which then becomes "Your answer in 4 beats" (Set the scene / What *you* did / What changed / What it shows), with "Read the full answer →", the tip, and "I'm ready · start recording"
  - Remove the "Use saved answers" checkbox from the top of the card. Saved answers preselect automatically (see C).
  - Simplify the bottom: one primary button, plus "Microphone only · Type instead" links. Drop "Play question" / "Read it myself" as separate buttons; keep "Listen to the question" in the top bar only.
- **Recording:**
  - camera full screen
  - question + timer + the 4 beats pinned, at the **top centre** (under the webcam on desktop)
  - one "Done" button, space bar on desktop
  - portrait-first, never a rotate prompt
- **Full answer:** a sheet on phone, a right-hand drawer on desktop. Owner's actions in bold, gaps amber, "Built from your CV · nothing made up".
- **Real interview mode:** question, timers and "Done" only.
- **Free taster:** 4 beats visible; the full answer locked.

## C. Interview feedback, saving, and the two modes
Build all of `CODEX-INTERVIEW-FEEDBACK.md`. Reference: `design/interview-feedback-mock.html` and `.jpg`.

**Fix these bugs first:**
1. Beats tick everything: a 44/100 answer showed "4 of 4 ✓". Beats must meet their criterion, and one sentence can't satisfy two beats.
2. "Your contribution" matched the wrong sentence (Pho House instead of the Redcliffe action).
3. Every improvement says the same template line ("Connect this point directly…"). Replace these with specific fixes or drop them.
4. "What worked" praised trivia ("Hi, I'm Amelia").
5. A retry shows no "up from".
6. The save button isn't visible.

**Practice mode, the improvement tool:**
- Score + band (Not there yet / Getting there / Strong answer / Excellent) + a meter marked at 70. The previous score shows as a grey marker.
- "{n} fixes to get to about {target}": max 3, biggest first, each with a +points chip, "You said" (weak phrase struck through) and a green "Try" box built from the CV or their own words.
- Honest beats ✓ / ✕ with reasons. The transcript with green and red highlights (tap red to see the fix).
- "Try again with these fixes" (fixes pinned on think and recording) and "See a 70+ version of your answer" (locked for free).
- At 70+:
  - "↑ {diff} points from your first try"
  - "What you fixed"
  - one "To push past 85" tip
  - "Check before you use it" for firm claims or numbers not in the CV
  - the dark save card "Save as your {firm} {type}" + "Save this answer"
- Attempt history per question: "44 → 63 → 81".
- Dimension tiles move to a collapsed "Score breakdown" at the bottom.

**Saved answers library** in My Desk: grouped by question type, best score, last practised; open / practise again / delete. A saved answer's beats preselect on the think screen next time ("Your saved answer · 81").

**Real interview mode rehearses saved answers:**
- Option: "Saved answers only / Mix in new questions".
- Real conditions, one take, feedback only at the end.
- The summary lists each question: "Today {score} · Your saved best {best}" and "You hit {n} of your 4 beats · you missed {beat}".
- Actions: "Back to Practice on this question →", "Replace your saved answer with today's" when it scored higher, "Run again", and "Practise the weak ones".

**Free taster:** the score, the band, fix 1 in full, and fixes 2–3 as titles. One retry. Save and the 70+ version are locked: "Members can save answers and see the 70+ version →".

## D. Still open from earlier
1. `api/mentor-apply.js` saves nothing and logs personal data. Save via `A.saveItem('leads:mentor', 'mentor-application', {...})`, add validation and quota, remove the `console.log` of personal fields, and tell Rao whether past applications can be recovered from the logs.
2. Programmes database: build `CODEX-PROGRAMMES.md`. Migrate the 61 rows out of `tracker.html` into Neon, build the admin page and the weekly freshness check, and send Rao the CSV export. Never copy aggregator lists. Every row is sourced from the firm's own page.
3. 1:1 page: if not live yet, build `CODEX-1TO1.md` (prices £99 / £249 for membership + 2 sessions / £3,000; panel under the header; every 1:1 link points to `/one-to-one.html`).

**Screenshots to send Rao at 390px and 1280px:**
- the homepage first screen
- interview setup, think (4 beats), the full answer and recording
- a weak first attempt, a retry with "up from", the save confirmation and the answer library
- a Real-mode run summary
