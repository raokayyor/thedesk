# Combined updates integration — 26 October 2026

Base: live release `28e8f518d4446e5e0e7bb9f623595fd02afd91de`. The supplied all-updates ZIP was merged selectively, preserving the approved assessment input, PDF fix, loading screen and results design. Latest specialist wording is included.

## Switches and configuration

- `RESULT_EMAIL_GATE_ENABLED=true` enables the signup gate. It is off by default.
- `EMAIL_ALERTS_ENABLED=true` permits weekly delivery. It is off by default.
- `ANALYTICS_ENABLED=true` permits event storage. It is off by default.
- The cron is deliberately not enabled. Supplied schedule: Monday 07:00 UTC at `/api/alerts?run=weekly`, authenticated by `CRON_SECRET`.
- `RESEND_API_KEY` and `EMAIL_FROM` require a verified sending domain.
- Optional `OPENAI_API_KEY` enables server voice. Browser and typed modes remain available without it.
- `INTERVIEW_SIGNING_KEY` is optional; the existing `ANTHROPIC_API_KEY` is the fallback signing secret.
- `privacy.html` remains marked DRAFT and contains operator details to complete. Finish it before enabling the signup gate, analytics or alerts.
- `desk-config.js` has no booking URL until the owner supplies one.

## Corrections beyond the bundle

- A typed email or Stripe checkout email never authenticates a browser or marks an email verified. Sessions follow one-time email verification.
- Existing email claims do not expose or sign in to that account. Cross-device access requires a verified linked session.
- Discount totals are checked against the GBP79 subtotal, discount and assessment references.
- Interview feedback requires an expiring, context-bound signed question. Tampering is rejected.
- Paid practice checks expiry and refunds.
- Invalid preference firms/types are rejected rather than silently expanding to every firm.
- Confirmation requests are throttled; alerts require verification and opt-in.
- A DB lease and durable batch outbox prevent overlapping sends. Stable provider keys cover retries within 23h. Older uncertain batches are flagged for manual reconciliation rather than blindly resent. Opt-outs are checked before delivery.
- Empty digests do not advance delivery timestamps. Rolling matches do not trigger unrelated fallback. Future dates are not labelled newly opened.
- Raw error text is not sent or stored in analytics.
- The free gate promises one CV improvement rather than a complete line-by-line repair. Teasers are described as practice questions, not employer predictions.

## Verification

12 passing test entries across assessment/payment regression, Full Cycle v3, interview practice, analytics, application answers/drill, alerts and PostgreSQL account/alert integration. Syntax checks passed for 68 JS/module files.

PostgreSQL tests cover unverified/concurrent claims, single-use and expired links, cross-device ownership, preference validation, refunds/expiry, payment-email safety, scheduler overlap/retry and unsubscribe.

Browser tests cover the free gate, optional alert checkbox, confirmation, My Desk preferences, paid answer saving, typed interviews/feedback/saving, tampered question rejection, market drills/saving and mobile layouts.

Tests used fictional CVs, an isolated local database and simulated email/model transports. No real email, paid model call, Stripe transaction or production database migration was made. The local preview server is ignored by Git and is not deployed.
