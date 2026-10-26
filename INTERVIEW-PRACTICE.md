# Interview practice (new feature)

## Apply
- Run `git am 0001-*.patch`, or copy the files in `files/` into the repo.
- The patch is based on commit `2c6833d`.
- Then run `node tests/interview-practice.test.mjs`.

## What it is
`/interview-practice.html` works in two ways:
- **With no parameters, it's the fictional sample.** You practise as Amelia. Questions come from the framework, at no model cost.
- **With `?id=<assessmentId>`, it uses the student's own paid assessment.** Questions are personalised by Claude from their CV, target firm, division and weakest competencies.

**How a session runs:**
1. **Pick a format:**
   - Video interview: 30 seconds' thinking time, 90 seconds to answer
   - First round
   - Superday
   - Partner / motivational interview
2. **Each question starts with an "Are you ready?" screen** with a camera framing check. When the student clicks "I'm ready, ask me", the interviewer reads the question aloud in a British voice using the browser's built-in speech (no cost) and shows it in large text. There's a "Repeat the question" button. Video-interview mode then gives 30 seconds' thinking time; live formats count down 3 seconds before recording starts. Reading aloud can be switched off.
3. **Answer 5 questions out loud.** The camera is optional. Words are transcribed live in Chrome, Edge and Safari. If transcription isn't available, the student can type instead.
4. **Get feedback on each answer.** Claude scores it 1–5 on:
   - answering the question
   - structure
   - evidence from their own CV
   - accuracy (technical and commercial questions only)

   The app also measures delivery (filler words, pace, "I" vs "we") and timing. Each answer then gets strengths, fixes, a stronger version in the student's own words (with gaps marked [confirm: …]), and any claims they made that their CV doesn't support.
5. **See a session summary.** It lists every score, the question to practise first, and a call to action for a practitioner mock interview (currently linking to `/mentor.html`).

**Privacy:** video and audio never leave the device. Only the transcript is sent for feedback. State this in the privacy notice too.

## Files
- **`interview-practice-core.mjs`** (repo root, so the browser can import it): questions, timings, metrics, the quick check, prompts and validators. It's shared by the page and the API.
- **`lib/interview-practice.mjs`:**
  - loads the context: paid assessment from the database, or the sample JSON
  - daily usage limits, using a new `desk_interview_usage` table
  - Claude calls through tools, using `INTERVIEW_MODEL` (default: `FULL_CYCLE_MODEL`, otherwise `claude-sonnet-4-6`)
- **`api/interview-questions.js`:** POST `{assessmentId | sample:"amelia", mode}`. Requires paid access for a real assessment. If the model fails or the limit is reached, it falls back to the framework questions.
- **`api/interview-feedback.js`:** POST `{assessmentId | sample, question, transcript, durationSec}`.
  - Paid assessments: 80 feedback calls a day.
  - Sample: 6 an hour per IP address.
  - Over the limit or on a model error, it returns the automatic quick check.
- **`vercel.json`:** both functions get 60 seconds and `includeFiles: samples/amelia-*.json`.
- **`tests/interview-practice.test.mjs`.**

## Safety rules enforced in code
- **CV questions must be grounded.** A CV-led question the model generates must point at text that is actually on the CV, otherwise it falls back to the framework set.
- **The "stronger answer" is dropped** if it introduces any of the following that aren't in the CV, the transcript or the reference answer:
  - a number
  - a £ amount or percentage
  - an outcome claim (saved / increased / led …)
- **Scores are checked as whole numbers from 1 to 5.** Accuracy only applies to technical and commercial questions.

## Hook it up (Codex)
1. On the Full Cycle report's "Interview questions" tab, add a button: "Practise these out loud →", linking to `/interview-practice.html?id=<assessmentId>`.
2. In the tracker, when a saved role's stage is set to "Interview", link to the same page.
3. Add the transcript-only processing line to the privacy notice.

## Cost
- About 1p per feedback call.
- One question set is roughly 2,000 tokens.
- The limits above cap what any one student can spend.

## v1.1: how the student came across
**Measured on the device** (`deliveryMetrics`, `analysePauses`, `confidenceAssessment` in the core module). No audio is uploaded; only these numbers are sent.
- **Pauses:** taken from loudness samples every 100ms. The student sees:
  - how long they took to start
  - pauses over 1.5 seconds
  - silences over 3 seconds ("stalls")
  - the longest pause
  - whether their voice trailed off at the end
- **Fillers:** um, uh, er, "you know", "basically", "I mean", "literally", and "like" used as a filler ("it was like, really hard"). "Like" isn't counted in normal use ("I'd like to", "looks like").
- **Hedging:** "I think", "I guess", "maybe", "kind of", "sort of", "probably", "I'm not sure", "to be honest" and similar.
- **Casual language:** "yeah", "gonna", "stuff", "pretty much", "loads of", "dunno" and similar.
- **Weak endings** ("so yeah…", "I guess", "if that makes sense"), apologising, and "I" vs "we".
- **A Confidence score out of 5**, labelled "Sounds confident", "Mostly confident" or "Sounds unsure". Every point taken off is listed, so the score is explainable.

**Judged by Claude** (feedback schema):
- **`scores.convincing` (1–5):** would an interviewer believe them and want to move them forward? This looks for a clear view, backed claims, a "so what", ownership and conviction.
- **`convincingNote` and `confidenceNote`:** one sentence each. The confidence note quotes the student's own hedging words.

**What the student sees:** a "How you came across" panel on each answer (confidence, plus "did you come across as convincing?"), new language and pause chips, and a confidence column in the session summary.

## Not in this version (ideas for later)
- **Eye contact and looking at the camera:** needs on-device face tracking, e.g. MediaPipe.
- **Monotone vs varied voice:** needs pitch analysis.
- **Smiling and energy.**

## v1.2: set-up check and answer guide
- **Step 1: check your set-up.** This is now its own screen, before anything else. The student clicks "Run the check" and says "I'm ready for my interview at <firm>". Three rows show the result:
  - Camera
  - Microphone (live level meter)
  - Transcription (shows the words we heard)

  They can play back a 7-second test clip. Each failure gets a plain-English fix:
  - access blocked
  - no device found
  - device in use by Zoom/Teams
  - page not https
  - transcription not supported or blocked

  A warning shows if the page is open inside another app (an iframe), which can block devices. "Continue" unlocks when the microphone works. If transcription fails, they continue and type their answers. "Skip the check and type my answers instead" is always available.
- **Step 2: choose your interview.** This has the format cards plus two toggles: read questions aloud, and show the answer guide (on by default; untick for exam conditions).
- **"How to answer this".** After each question is asked, a short guide appears. It is built from the candidate's own CV and report by `buildGuide()` in the core, at no model cost:
  - CV walk-through: their actual education and roles in order
  - Competency: the evidence from their competency repair
  - Technical: the model answer
  - Motivation: firm and division

  In live formats the student reads it, then clicks "Start my answer". Video mode keeps the 30-second timer with the guide visible. While recording, the guide collapses to one line.
- **Visible errors.** Any unexpected script error shows a red banner on screen, so testers can report exactly what failed.
- **Tests.** The tests now check that every question in every format has a brief guide, and that the CV walk-through guide uses the CV.

## v1.3: camera fixes and phone-first check
- **The check is now one tap, with two rows.**
  1. Camera: a live preview, which stays on.
  2. Say something: a level bar and the words we heard.

  It passes as soon as a voice is heard. "Continue" appears only once the mic works.
- **Camera bugs fixed:**
  - The camera turned off after the check and was requested again at Start, which re-prompted on Safari and Firefox. Now we ask once and keep one stream for the whole session.
  - A camera failure (no camera, in use, refused) also killed the microphone. Now we fall back to audio only and say so.
  - On iPhone the audio meter started "suspended", so the mic read as silent and Continue never unlocked. There is now one shared AudioContext, created and resumed inside a tap.
  - Video elements now call `play()` explicitly with `playsinline`/`muted` (iOS), and we use ideal (not fixed) camera sizes for phones.
  - On iPhone, the read-aloud question is unlocked inside the tap.
  - Tracks are released on `pagehide`.
- **Device-specific fixes:** separate instructions for iPhone ("aA → Website Settings"), Android (padlock → Permissions) and desktop, plus a warning for the camera being in use or the page not being https.
- **iPhone tip:** after a passed check, iPhone users see how to stop Safari asking every visit.
- **Phone layout:** single column, a shorter camera box, full-width buttons, and the question shown at 26px.
- **Testing:** the camera and mic only work on an https page. A downloaded .html file opened on a phone will not get camera access. Test on thedesk.vercel.app.

## v1.4: choose the firm, and the interviewer pushes back
- **Choose the firm and division (Step 2).** The student's report target is the default. They can switch to any of 18 firms or type another:
  - UK banks
  - US banks
  - European banks
  - advisory boutiques
  - Big Four

  `withFirm()` re-targets the context: questions, guides and feedback all use the chosen firm. The report's "Why <firm>" skeleton is dropped when the firm changes, because it was written for the other firm.
- **A firm-values question.** In video and partner formats, the interviewer quotes the firm's own published values (`FIRMS` in the core). For example: "At Goldman Sachs, our core values are Partnership, Client Service, Integrity and Excellence. Which one do you live up to best?"
  - The guide suggests which value to pick, from the student's strongest evidence.
  - Competency guides add "Link it to <firm>'s <value>".
  - Values were checked against each firm's own site in October 2026, with the source kept in `src`.
  - Deutsche Bank, Lloyds, NatWest, Rothschild, Lazard and Evercore have no values listed on purpose (not verified), so they get no values question. Citi's leadership principles came via a secondary source: **please confirm on citigroup.com**.
  - Model-written questions get the values too, with "quote them exactly; state no other firm facts".
- **Push-back follow-ups.** In the live formats (first round, superday, partner), after each answer the interviewer asks one follow-up aimed at what the student actually said, then gives 60 seconds to answer. Video interviews have no follow-ups, because one-way interviews don't do them.
  - Rule-based triggers: brief answer; "we" more than "I" → "What exactly did you do yourself?"; a number → "You mentioned 12 UK software companies. How did you get to that number?"; no result; heavy hedging; "Why <firm> rather than <peer>?"; generic closer.
  - Otherwise a random question from a pool for that question type.
  - No follow-up repeats within a session.
  - Paid users get a model-written follow-up via `POST /api/interview-feedback` with `stage:'followup'`. It shares the feedback limit and falls back to the rules. The sample always uses the rules (no cost).
  - Feedback covers the answer and the push-back together, and adds "How you handled the push-back" (`followUpNote`, or a quick note).
- **No new API function was added.** The follow-up reuses the feedback endpoint.

## v1.5: usage events
Interview practice sends anonymous events through `/desk-track.js` (see ANALYTICS.md):
- view
- device check result (camera, mic, words heard, transcription supported)
- type-only
- start (format, firm, division, toggles)
- each answer (type, follow-up, typed or transcribed, word count, seconds)
- follow-up source (rules or model)
- feedback (full or quick, score)
- retry
- complete
- mock-interview call to action

No answer text is ever sent. The device check also now finishes about 2 seconds after words are heard, instead of always taking 8 seconds.
