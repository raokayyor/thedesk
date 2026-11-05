# Value pack (November 2026)

This includes the knowledge base, the HireVue guide and the four Full Cycle upgrades. See `KNOWLEDGE.md` and `HIREVUE-GUIDE.md` for the first two.

## 1. Real feedback on spoken answers, with push-back (`interview-feedback.js`, `api/interview-feedback.js`)
- **The interview coach's "Assess this answer" now asks the model**, not the old word-count check. Students get:
  - **four scores:** structure, evidence, relevance, delivery
  - **a recruiter-style verdict**
  - **up to three fixes,** each tied to their own words ("You said: …")
  - **what to keep**
  - **a stronger first sentence,** built only from their facts, with [brackets] for anything missing
  - **"~X seconds before you got to your point"**
- **Then the interviewer pushes back.** A follow-up aimed at their vaguest claim, read aloud if voice is on. Their answer is scored for **handling push-back**.
- **Quotes are checked against the transcript;** anything the model invents is dropped. The old check is still used for maths and reasoning questions, and as a fallback if the model is unavailable.
- **Limits:** 3 detailed feedbacks a day free, then 60 a day with Full Cycle. Every answer and its feedback is saved to My Desk.
- **Model:** `INTERVIEW_MODEL`, which defaults to the Full Cycle model.

## 2. Sign-in and My Desk (`lib/accounts.mjs`, `api/account.js`, `my.html`)
- **Sign-in is by an email link,** with no password.
- **How devices are joined:** signing in gives that device the account's key, and anything the device already had moves onto the account.
- **So every existing page** (results, Full Cycle report, interview context, practitioner questions) works on phone and laptop with no other changes.
- **Signing out removes the account from that device.**
- **My Desk shows** assessments (with result and report links), saved interview answers with feedback (which can be deleted), the call card and "How did it go?". Pages gain a "My Desk / Sign in / Save my work" link in the header.
- **Needs** `RESEND_API_KEY` and `EMAIL_FROM` (a verified sender domain in Resend).
- **Optional:** `DESK_ACCOUNT_KEY` encrypts the stored account key. Otherwise it's derived from `PRACTITIONER_SUPPORT_KEY`; set it once and never change it.
- **Until email is on,** staff can make a one-time sign-in link at `/proof-admin.html`.

## 3. The 5-minute call (human touch)
- Set `CALL_URL` (e.g. your Calendly event) and optionally `CALL_LABEL`.
- **Only Full Cycle customers see the link.** It appears on My Desk, at the top of the Full Cycle report and under interview feedback.
- Calendly controls how many slots you offer.

## 4. Proof: "How did it go?" (`lib/outcomes.mjs`, `desk-me.js`, `proof-admin.html`)
- **A two-minute form after a real interview.** It's on the HireVue firm cards ("Had yours? Tell us how it went") and on My Desk. It asks for:
  - firm, programme, stage and month
  - for HireVue: number of questions, thinking time, answer time and retakes
  - what they were asked, in their own words
  - how it went, and whether they practised on The Desk
  - an optional quote, shown with first name and university only if they tick consent
- **Staff review at `/proof-admin.html`.** Approve a report so its format shows on the HireVue firm card ("Confirmed: reported by 3 students, latest Nov 2026"). Approve a quote separately, editing only typos. "Send questions to the knowledge base" turns the questions into points for review.
- **Public proof:** any element with `data-desk-proof` (one is already at the top of the HireVue guide) shows approved quotes, plus counts once they're meaningful (50+ practice answers in 30 days, 5+ students who moved on). Add `<div data-desk-proof></div>` and `<script src="/desk-me.js" defer></script>` to the pricing or home page to show them there.
- **Quotes are never invented or rewritten.** That's required by UK consumer law and by trust.

## Setup checklist
1. Apply the patch (`git am --keep-cr patches/*.patch`) or copy `files/`.
2. In Vercel, set `RESEND_API_KEY` and `EMAIL_FROM`, `CALL_URL`, and optionally `DESK_ACCOUNT_KEY`, `OPENAI_API_KEY` (reel transcription) and `STAFF_EMAIL`.
3. The new tables create themselves: `desk_accounts`, `desk_login_tokens`, `desk_sessions`, `desk_items`, `desk_quota`, `desk_outcomes`, `desk_knowledge`, `desk_knowledge_mentions`.
4. **New functions:**
   - `api/account.js`
   - `api/interview-feedback.js`
   - `api/knowledge.js`
5. **New staff pages** (both use the practitioner key):
   - `/knowledge-admin.html`
   - `/proof-admin.html`
6. **Privacy notice:** add accounts (email), saved practice, interview feedback (answers are sent to the AI provider), and the interview reports form.

## Tests
- `node --test tests/value-pack.test.mjs tests/knowledge.test.mjs` (11 tests).
- **Checked end to end** in a browser against a real Postgres database (PGlite), with the model mocked:
  - feedback, then follow-up, then push-back score
  - the free limit
  - the outcome form, staff approval, format on the firm card and quote on the guide
  - signing in on two devices, which both then see both assessments
  - the call card on My Desk and the report
  - sign-out
  - no errors and no sideways scroll on phone
- `tests/free-preview.test.mjs` already fails on `main` before these changes.
