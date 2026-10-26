# New features (October 2026)

**Contents:**
- Accounts and My Desk
- Application answer builder
- Daily market drill
- Discount codes and book-a-call
- Free-result interview teaser
- Optional server transcription and voice

## 1. Accounts and My Desk
- **How accounts are created.** Buying Full Cycle creates the student's account from the email they used at Stripe, links the assessment, and signs that device in (`verify-checkout` sets an HttpOnly `desk_session` cookie, valid for 90 days). The webhook also links the account, in case the student closes the tab.
- **Access.** Full Cycle features last **12 months** from the latest non-refunded payment linked to the account (`entitlement()` in `lib/accounts.mjs`). A refund removes access.
- **Other devices.** Students sign in on `/signin.html` with a one-time email link that expires in 30 minutes.
  - It needs **`RESEND_API_KEY`** and **`EMAIL_FROM`** (for example `The Desk <hello@yourdomain>`; the domain must be verified in Resend).
  - Until those are set, the page tells students to contact you. You can make a sign-in link yourself on `/analytics.html`, in the "Send a student a sign-in link" box.
- **What's saved.** Interview practice uses the student's own assessment when they're signed in (no `?id=` needed) and saves every answer. It stores the transcript, score, fixes and **practice measures**: fillers per minute, hedging, answers with a result, within time, "I" versus "we", and follow-ups answered with specifics.
- **`/my.html`** shows:
  - access and expiry
  - the four tools
  - trends: first answers versus latest, once 6 answers exist
  - answers practised per week
  - recent answers
  - the drill streak
  - sign-out
- **Assessments on any device.** `ownedRecord()` now also accepts a signed-in session for assessments linked to the account, so reports open on any device.
- **Tables** are created automatically: `desk_accounts`, `desk_account_assessments`, `desk_login_tokens`, `desk_sessions`, `desk_items`, `desk_daily_usage`.

## 2. Application answer builder (`/answers.html`, `POST /api/answers`)
- **Input.** The student picks the firm, division and programme, pastes the question and sets the word or character limit.
- **Plan my answer.** This gives a plan tied to their CV items, a draft, and "research before you write".
  - Every sentence with a number, amount or claim that isn't on the CV is **removed** (`stripUngrounded`).
  - The only firm facts allowed are the firm's published values (from `FIRMS`).
  - Gaps show as highlighted `[confirm: …]`.
- **Live checks while typing:** word or character count against the limit, overused phrases ("passionate", "prestigious"), machine-sounding words ("leverage my", "moreover"), "we" versus "I", unfilled gaps, and whether the firm is named.
- **Check my answer.** This gives recruiter-style coaching:
  - five scores, a verdict and fixes
  - line edits that quote the student exactly, applied with one click
  - claims to be ready to defend
  - anything not on their CV
- **Save.** Saved answers appear on the page to reuse for other applications.
- **AI-use note.** The page tells students some firms want answers in their own words, and positions the draft as a plan.
- **Fair use:** 30 drafts and 60 checks per student per day.

## 3. Market drill (`/drill.html`, `GET/POST /api/drill`)
- **Questions.** There are 36 evergreen commercial-awareness questions (`lib/drill-core.mjs`): rates, FX, bonds, credit, M&A, private equity, ECM, banking, energy, AI capex, trade, the economy, asset management, insurance, audit and tax.
  - They contain no dated facts, so nothing goes stale.
  - Everyone gets the same question each day, chosen to suit their division where possible.
  - Students can also "bring your own story" (a headline). The feedback then judges reasoning only and lists facts to check.
- **Answering.** 60 seconds out loud (live transcript) or typed. The four parts (what, why, who wins and loses, your view) light up as they're covered.
- **Full Cycle feedback:** four scores, fixes, and "a stronger 60 seconds" (any figure the student didn't say is removed). It's saved, and the streak shows on My Desk.
- **Without Full Cycle:** a structure check only, at no model cost.
- **Fair use:** 40 per day.

## 4. Discount codes and book-a-call
- **Discount codes.**
  - Checkout now has `allow_promotion_codes: true`. Create codes in Stripe (Product catalogue → Coupons → add a promotion code, e.g. `BRISTOL20`).
  - **Payment verification now accepts discounted totals.** It previously required exactly £79.00, which would have rejected any discount.
  - The code used and the amount paid are stored (`paid_amount` and `promo_code` columns, added automatically). The dashboard shows revenue taken and **sales by code**.
- **Book-a-call.** Put a Calendly or Cal.com link in **`desk-config.js`** (`callUrl`). A "Book a free 5-minute call with Rao" card then appears at the end of interview practice and on My Desk, and clicks are counted on the dashboard. If it's left empty, the card is hidden.

## 5. Free-result interview teaser
- **What students see.** The free result page (`result-final-design.html`) shows "Three questions a <firm> interviewer is likely to ask you": a CV question (it must quote something really on the CV), a motivation question and one on the weakest competency. Questions only, with no practice or feedback. A link points to Full Cycle.
- **How it runs.** It's generated once per assessment and cached (`desk_interview_teasers`), at about 1p each. The framework set is used as a fallback. There's an IP limit of 20 per day. It goes through `POST /api/interview-questions` with `{ teaser: true }`, so no new function was needed.

## 6. Server transcription and interviewer voice (optional)
- **How to switch it on:** set **`OPENAI_API_KEY`**. It is off without one, and everything falls back to the browser as before.
- **Who gets it:** Full Cycle students, through `POST /api/voice`.
- **Transcription.** The answer's audio is recorded separately (32kbps) and transcribed after each answer by `gpt-4o-mini-transcribe` (change it with `TRANSCRIBE_MODEL`), with a finance vocabulary hint. The server transcript replaces the browser's. **Audio is not stored by The Desk.**
- **Voice.** The interviewer's voice uses `gpt-4o-mini-tts` (`TTS_MODEL`, `TTS_VOICE`) with British-English instructions. It plays through the audio context already unlocked by a tap, so it works on iPhone.
- **Approximate cost:** a 2-minute answer is under 1p to transcribe, and a spoken question is about 0.2p.
- **Choice and consent.** Students see a toggle: "Better transcription and a natural interviewer voice (your audio is sent securely to be transcribed and is not stored)". The privacy line updates to match.
- **Privacy notice.** Add OpenAI to the privacy notice as a processor.
- **Fair use:** 300 transcriptions and 400 voice clips per day.

## Before launch
- **Privacy notice page:** still missing. It needs to cover accounts, saved answers, anonymous analytics, and OpenAI and Anthropic as processors.
- **Product copy:** the Stripe product description and the result-page bullets still say "Two rechecks within 30 days". Update them to the 12-month offer when you decide its wording.

## Tests
- `node tests/answers-drill.test.mjs`
- `node tests/interview-practice.test.mjs`
- `node tests/analytics.test.mjs`

During development we also ran:
- the real API handlers against a real Postgres (PGlite), with the model and OpenAI stubbed;
- a full browser run: sign-in link → My Desk → interview practice with server transcript, follow-up, feedback and save → answer builder (an ungrounded sentence removed, line edit applied, saved) → drill feedback → My Desk trends → free-result teaser → staff link.
