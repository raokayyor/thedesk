# Email step on the free result, free accounts and weekly deadline alerts

## The free result (`result-final-design.html` + `result-gate.js`)
- **What shows before the email.** The verdict, the student's name and the readiness score show straight away. Everything below (CV changes, screening check, tests, competencies, the interview teaser and the offer) appears once they give an email: *"Where should we save it?"* Samples and demos are never gated.
- **The tickbox.** A separate, **unticked** box reads: "Email me weekly deadline alerts for my target firms. Unsubscribe any time." Getting the result never depends on it (UK GDPR/PECR).
- **New email:**
  - a free account is created, the result is saved to it, and this device is signed in;
  - a **"Confirm your email"** link is sent (it lasts 7 days).
- **Email that already has an account:** nothing about that account is opened or changed from here. The owner is emailed a link that adds the result (and switches on alerts if ticked). This stops anyone typing someone else's email to get into their account or sign them up for alerts.
- **Soft gate.** The full result is still returned by the API; the email step is in the page only. That's fine for lead capture, but it isn't a security boundary.
- **Tables:** `desk_result_unlocks`, `desk_accounts.verified_at`, and `desk_login_tokens.assessment_id` and `purpose`.

## Deadline alerts
- **Double opt-in.** Alerts are only sent to **confirmed** emails. Paying students are confirmed by the payment; everyone else by clicking the link.
- **Preferences** are on **My Desk → Deadline alerts** (`/my.html#alerts`): on/off, programme types and firms. Firms come from the tracker, grouped by sector. Choices are checked against the real tracker list. Ticking the box on the result page defaults them to their target firm and programme type.
- **The programme data** is read **straight out of `tracker.html`**: the block between `var CHECKED=` and `var londonParts` runs in an isolated Node sandbox (`lib/programmes.mjs`). Alerts always match the tracker, with no second copy of the data. When tracker wave 1 is applied, its programmes are included automatically.
- **The weekly email** (`lib/alerts-core.mjs`) has these sections:
  - closing in the next 14 days
  - newly opened since the last email
  - opening in the next 21 days
  - open with rolling review (for chosen firms)

  If none of their firms has anything, it shows market-wide closing dates instead, so an email is never empty. Every email:
  - gives the date the tracker was last checked;
  - tells students to confirm on the firm's site;
  - carries `List-Unsubscribe` + `List-Unsubscribe-Post` (one-click unsubscribe in Gmail and Outlook) and an unsubscribe link to `/unsubscribe.html`.
- **The schedule** is a Vercel cron: **every Monday 07:00 UTC** → `GET /api/alerts?run=weekly`, authorised by `CRON_SECRET`.
  - It sends in batches of 100 (Resend batch API) and up to 500 per run.
  - Each student gets at most one email in 5 days, so re-running is safe.
- **Staff preview:** `GET /api/alerts?preview=<student email>` with the staff key shows that student's email for this week without sending it.

## Setup
1. **Resend** (resend.com): add and verify your sending domain (SPF and DKIM DNS records), then set:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` = `The Desk <alerts@yourdomain>`

   Without these, emails are still collected and accounts still work, but nothing is sent.
2. **`CRON_SECRET`**: any long random string. Vercel sends it with the scheduled call.
3. **The privacy notice** (`privacy.html`) is a **draft**: fill in every highlighted field (company, address, ICO number, contact email, retention, age) and have it reviewed. Then delete the red "Draft" banner. **Don't switch on the email step until this is live.**
4. **Keep the tracker current.** Alerts are only as good as the tracker dates. The weekly change-check task already flags changes for you to verify.

## Dashboard
The staff dashboard shows the email step funnel:
1. Free assessments
2. Saw the email step
3. Gave an email
4. Ticked alerts
5. Confirmed
6. Alerts live

## Tests
- `node tests/alerts.test.mjs` covers tracker parsing, digest sections, the fallback and email content.
- Also run during development, on a real Postgres:
  - locked/unlocked, a new account and its confirmation, double opt-in, the weekly send, no repeat sends, one-click unsubscribe, the existing-email safety case, preference validation and the staff preview;
  - a browser run of the email step, saving, My Desk alerts and confirmation.
