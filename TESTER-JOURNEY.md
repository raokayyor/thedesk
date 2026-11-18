# Personal student testing

## Give a tester

- Portal: `/tester-access.html`.
- Private invitation code: supplied separately to Rao; never embed the plaintext code in public HTML, documentation or tests. The deployment stores only its strong hash.
- Invitation accepts up to 10 verified accounts until 18 December 2026. Each receives 14 days of full member access from activation. This uses a `student-test` ledger grant, never a fake Stripe payment or `paid_at` value.

## Journey

1. Tester enters their own name, email, university, course, year and career interest, plus the invitation code.
2. They verify their own email using a single-use, 30-minute link. No membership is granted before email verification. Signup markers alone grant no access.
3. Their own My Desk opens, showing membership active and a clear **Start my assessment** action. No sample CV or sample test answers are seeded.
4. They upload/paste their own CV and answer all ten free-assessment questions. The initial CV/test result is saved to their account.
5. Members and testers continue directly to the probing deep-assessment questions. Ordinary free users go to their free result and membership offer.
6. They complete the follow-ups and generate their full personal report. Member tools use their own assessment. Old free-taster URLs redirect members into the corresponding personal workspace.
7. Signing in again by their own email restores their saved work across devices.

A free account already signed in can redeem the invitation from the same portal after verifying its email. A current paid member keeps their existing membership and work.

## Isolation and ordinary users

- Ordinary **Get my free score** → CV and questions → free result → £89 Stripe checkout remains intact.
- Ordinary free tools retain Amelia’s preloaded examples and free limits.
- Normal `/signin.html` is now secure email sign-in. Legacy temporary demo access is separate at `/sample-access.html`; it still uses the existing demo code and does not become a real account login.
- Tester signup skips browser/demo assessment adoption. Verification rotates the browser owner token and clears old demo navigation/draft caches. Linking guest assessments also excludes records already belonging to another account.
- Codes are checked server-side, expire, have a global redemption cap and rate limits, and cannot be activated through query parameters. Existing preview-only legacy tester codes remain preview-only.
- Existing paid-access APIs continue enforcing account ownership and membership. Testing grants expire automatically; they do not disable Stripe or unlock other people’s reports.

## Releasing / further invitations

This branch starts from the live homepage revision and excludes the deferred booking/email changes and the separate programmes-database preview. Rotate or replace `lib/student-test-config.mjs` through a reviewed release for a new batch of invitations. Revoke existing tester grants through the membership ledger if needed; do not set `paid_at` manually.

## Checks

Automated checks cover invitation validation, verified-email gating, capacity and expiry, secure account signup, ownership, member tool routing, free tasters, Stripe checkout and CV follow-up questions. A local PostgreSQL flow checks real token redemption, profile persistence, session restoration, demo isolation, own-CV linkage and the ten-person redemption cap without sending email, making payments or changing production data. Live recording/transcription and phone visual QA still require a browser/device test.

## Normal upgrade journey

Testers can sign up and sign in normally, complete the free assessment, then enter the private invitation under **Have a student tester code?** on `/membership-start.html`. It activates the membership ledger without a Stripe charge. My Desk guides them to the deep assessment. The invitation portal also supports direct member onboarding for Cydney: her single-use invitation activates 365 days for one verified email, opens My Desk and asks her to start her own assessment. No shared account or password is created.

## Cydney direct entry

`/cydney.html` accepts her private password without email verification and opens a single Cydney account. It reuses her invitation account if already activated. This is explicitly requested password-only access, not the normal student login. It expires on 18 November 2027, has IP/global rate limits, rotates browser ownership and never seeds sample data or records a Stripe payment. Keep the password private: anyone who knows it can access this account. The ordinary email-verification and tester-code flows stay in place.
