# Codex: application drafts for every firm the student tracks

References:
- `design/app-drafts-mock.html` and `design/app-drafts.jpg` (list → fill gaps → draft)
- seed data in `data/application-questions.mjs`

## What we learned researching the questions (23 Nov)
- **Most banks' written questions sit behind the application login.** Third-party guides say this explicitly for Barclays and Morgan Stanley. Public sources only give *reported* questions (guides, Glassdoor), rarely exact wording or word limits.
- **Many banks now put the motivation questions in the HireVue rather than the form** (Goldman, J.P. Morgan, Deutsche Bank). The same themes recur everywhere: why this firm, why this division, about you, leadership, teamwork, challenge, integrity, a market story.
- **So the feature drafts answers to the recurring themes for every tracked firm** (these serve the form *and* the video interview). It also drafts the exact questions where we have them, plus any question the student pastes from a live form.

## 1. Data
- `data/application-questions.mjs`: `QUESTION_THEMES` plus `APPLICATION_QUESTIONS` (firm, programme, stage form/video/interview, theme, text, wordLimit, confidence official/reported/student, source, note). Move this to a Neon table `app_questions` alongside the programmes table (see CODEX-PROGRAMMES.md).
- **Student-pasted questions:** "+ Paste a question from a form" saves firm, programme, text and word limit with confidence `student`. When 3+ students paste matching text (normalised), mark it `verified` and offer it to everyone tracking that programme. This is how the library fills itself.
- **Firm facts for "why this firm" answers:** only from our dated sources: `lib/firm-process.mjs`, the firm news briefings, and practitioner notes. Each fact keeps its source and date. With no fact, show an amber gap: "Add one {firm} detail you've looked into".

## 2. Generation
**Inputs:**
- CV evidence from `deep`
- the student's answers to gap questions
- their saved interview answers
- a voice sample: their own free-text answers (assessment, pasted paragraphs)

**Output per question:** a draft within the word limit (or 150–250 words if none), plus a strength score (same scorer as the interview coach).

**Rules:**
- **Facts only from the inputs.** No invented numbers, places, people, outcomes or firm facts. Unknowns become amber gap chips. Validate server-side (trace every noun phrase and number to a source, otherwise turn it into a gap).
- **Gap questions are shared across firms.** One answer ("What happened after your Redcliffe screen?") fills every draft that needs it. Ask at most 3 at a time, sorted by how many drafts they unlock ("Used in: 3 questions").
- **Voice:** match the student's sentence length and vocabulary from the voice sample. No generic phrasing ("I thrive in…", "passionate about…").
- **Different students get genuinely different drafts,** because they come from different CVs. Never reuse one template text across students.

## 3. Screens (phone first)
1. **Applications (My Desk tab):**
   - "Your applications, drafted." with three stats: questions drafted, gaps to fill, next deadline
   - one card per tracked programme: firm · programme, closing date, n questions, chips "{n} ready" / "{n} gap"
   - "+ Add a firm or paste a question from a form"
   - sticky "Fill {n} gaps · about {m} mins"
2. **Fill the gaps (bottom sheet):** up to 3 questions. Each shows "Used in: …", quick-pick chips where useful, and a short text field. "Update my drafts". Fine print: "We only use your words. Nothing is made up."
3. **Draft:**
   - header firm · programme · closes; the question in Garamond
   - chips: "{words} / {limit} words", "Strength {score} · {band}", "In your voice"
   - the draft with CV- or answer-sourced phrases underlined in green and gaps as amber chips
   - legend, then tools: "Shorter", "More like me", "Check it" (runs the scorer + "Check before you use it" for firm claims), "Copy"
   - the policy line: "Rewrite it in your own words before you submit. Some firms ask you not to submit AI-written answers; this is your draft, not your final."
   - "Mark as submitted" → status in the tracker, plus reminders for tests and interviews
4. **Link to the interview coach:** each theme answer also seeds the interview crib sheet (4 beats) for that firm's video interview.

## 4. Free vs member
- **Free:** one firm, one question drafted in full; the rest show as locked cards with their gap count.
- **Member:** every tracked firm, unlimited redrafts.

## 5. Track
Per student: drafts created, gaps filled, copied, marked submitted. Per question: how many students pasted it (for verification). Show Rao a weekly count of new `student` questions.

Send Rao 390px screenshots of all 3 screens plus "paste a question".
