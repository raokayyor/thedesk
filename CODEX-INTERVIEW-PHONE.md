# Codex: interview coach on phone, start to finish

References (in `design/`):
- `interview-phone-simple-mock.html` and `interview-phone-simple.jpg` (setup, think, recording)
- `interview-crib-mock.html` and `interview-crib.jpg` (crib sheet, full answer)

Applies at ≤900px. Desktop can use the same steps in a two-column layout. Use the site tokens (--ink #1f2a2e, --paper #f4f1ec, --card #fbfaf7, --line #e2ddd5, --accent #c4562a, --good #2f7a4f), EB Garamond 600 for headings and questions, Figtree for body. **No blue buttons.** Hide the member tab bar on every interview screen.

## 0. Rules for everything generated
- Every fact in CV points, beats, model answers and feedback comes **only** from the student's CV evidence (the `deep` assessment data) or their own earlier answers.
- Never invent numbers, places, people, days, settings or outcomes. Anything unknown (usually the result) renders as an amber gap chip for the student to fill.
- Validate server-side: every noun phrase and number in generated text must trace back to the source text. If it doesn't, replace that part with a gap.
- Label generated answers "Built from your CV · nothing made up".

## 1. Setup (`interview-start.html`), one screen
- Header: logo + "Exit". Kicker "Interview coach". H1 "Practise your next interview."
- **Summary card** prefilled from the profile and free result: "{Firm} · {Division}" / "{Programme} · {Stage}", with a "Change" link. The link opens the full current form (employer, role, exact title, stage, preparation level, job advert) in a bottom sheet. If there's no profile data, show the firm and programme pickers inline instead.
- **One visible question:** "What kind of interview?", with three large radio cards:
  - Video (HireVue): "Think time, then record against the clock"
  - Competency: "Your experience and motivation"
  - Technical: "Valuation, DCF, markets"
- "+ Add a commercial awareness or numerical question" expands the two checkboxes.
- **Mode toggle:** Practice (default) / Real interview. Real interview mode hides all prompts (see 6).
- Fixed bottom button in --ink: "Start · {n} questions →". Under it: "Your camera turns on only when you press start".
- One line under the setup card: "Practising for a real HireVue? Try it on a laptop too."

## 2. Think time (between every question)
Dark --ink screen.
- Top line: "Q{n} of {total} · {firm} · {type}", with the countdown "0:30 to think" on the right in --accent-light.
- The question in Garamond 22–25px.
- **"Use one from your CV" card** (white): the 2 best CV points for this question's competency as radio rows. Each shows the point in bold plus one coaching line ("Say what changed because of you"). The first is preselected.
  - If none fit: "No strong example yet: here's how to find one →" linking to the CV tool.
- **Once an example is picked,** the card becomes **"Your answer in 4 beats"** (with "from {source}" on the right):
  1. Set the scene
  2. What *you* did
  3. What changed (usually an amber gap: "Add your result: …?")
  4. What it shows

  Each beat is 1–2 lines. A "Change example" link swaps back to the picker.
- "Read the full answer →" opens the full-answer sheet (see 4).
- Practitioner tip: round photo (`/assets/kayyor-rao.jpg` for Kayyor) plus one line in Garamond italic and "{Name} · tip".
- White bottom button: "I'm ready · start recording". Recording also starts automatically when the countdown hits 0.
- Line under the button: "The 4 beats stay pinned while you record".

## 3. Recording
- Camera full screen (`object-fit: cover`, mirrored).
- Top-left: red dot + "Recording · Q{n} of {total}" (above the overlay, z-index).
- Top overlay on a dark gradient: "{firm} · {type}" in small green caps, then the question in Garamond 25px, then the timer bar ("0:46 ——— 2:00").
- **Pinned beats** under the timer: a compact list, one truncated line each, on a translucent light panel.
- Pull-up sheet handle: "↑ Swap example · Tip".
- One white "Done" button fixed at the bottom with a red stop square.
- Mic-only / type-instead stay available as small text links on the think screen, not here.
- **Orientation:** portrait by default. If the phone is rotated, adapt the layout (camera left 60%, question and controls right). Never show a rotate prompt.

## 4. Full answer sheet
Light --paper sheet, opened from "Read the full answer →".
- Top line: "Built from your CV · nothing made up", and "Close ✕".
- H2: "A strong answer, using your {source} example."
- Subline: "Read it, then say it in your own words. Don't learn it word for word."
- A 60–90 second model answer in Garamond 18px: the student's own actions in **bold**, unknown parts as amber "Your result here" chips.
- "Why it scores:" one line explaining it.
- Bottom button: "Back to practise". Fine print: "Practice mode shows this · Real interview mode hides it".

## 5. After each answer: feedback
- Compare the transcript against the 4 beats: tick or cross each, with one line on what was missing.
- Say whether they filled the result gap ("You said what changed ✓" / "You stopped before the result ✕").
- Keep the existing score and dimension tiles. Free tasters stay limited as now (one worked, one fix, the rest locked).

## 6. Real interview mode
Skip the CV card, beats, tip, full answer and pinned beats. Show only the question, the think countdown, the recording timer and "Done".

## 7. Free taster
Same screens, one question. The think screen shows the 4 beats. "Read the full answer" is visible but locked, with "Members see the full answer →" (to `/signup.html`).

Send Rao 390px screenshots of: setup, think (picker), think (4 beats), full answer sheet, recording, feedback, and real-interview-mode recording.

## 8. Desktop (>900px)
References: `design/interview-desktop-mock.html` and `design/interview-desktop.jpg`.

**Principle:** the laptop webcam is at the top centre, so the question and prompts sit at the top centre. That keeps the student's eyes near the camera. Never put prompts in a side column during recording.

- **Setup:** the same content as phone, in one centred card (max-width 560px).
- **Think time** (dark full screen):
  - top line with "Q{n} of {total} · {firm} · {type} · {mode}" and the countdown on the right
  - the question centred at the top, Garamond 40px
  - below it, two columns: left is the "Your answer in 4 beats" card (with "Change example" and "Read the full answer →"); right is a live camera preview labelled "Your camera · look here, not at the notes", the practitioner tip, and a white "I'm ready · start recording" button
  - space bar also starts recording
- **Recording:**
  - camera fills the screen
  - top-centre overlay: firm and type, question in Garamond 32px, timer bar (max 620px), then the 4 beats as one row of short pills (amber for the gap)
  - "Recording · Q{n} of {total}" top-left
  - white "Done" button bottom-centre, "Space bar to finish" bottom-right
- **Full answer:** a right-hand drawer (max 520px) over the think screen. Same content as the phone sheet.
- **Real interview mode:** the question, the timers and "Done" only.
