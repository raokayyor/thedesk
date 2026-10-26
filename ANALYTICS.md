# Usage analytics

**What it is:**
- `/desk-track.js` is a small script on the main pages. It sends anonymous events to `POST /api/track`.
- Events are stored in the `desk_events` table in Neon (created automatically on first use).
- `/analytics.html` is a private staff dashboard, backed by `GET /api/analytics`.

**What is collected:**
- Event names and a short whitelist of choices and counts (see `EVENTS` in `lib/analytics-core.mjs`).
- The page path, the referrer's domain, and utm tags.
- Coarse device type: phone/tablet/desktop, the OS, and the browser (including "In-app" for Instagram/LinkedIn browsers).

**What is never collected:**
- CV text, answers, transcripts, recordings, names, emails, or firm names a student typed (those are stored as "other").
- Error messages have emails and long numbers removed.

**Identity:**
- There are no cookies or device storage. A visitor is a hash of IP + browser + a salt that changes daily, computed on the server, so a visitor can't be followed across days.
- Students with an assessment carry a hash of their assessment id, which shows whether they came back.
- Global Privacy Control is respected.
- Events are deleted after about 13 months.

**Sales numbers** are read straight from `desk_assessments`: free assessments, checkouts started, paid, refunded and rechecks. They are exact, not tracked.

**Setup:**
- `ANALYTICS_KEY` (optional) is the staff key for the dashboard. If it isn't set, `PRACTITIONER_SUPPORT_KEY` is used.
- `ANALYTICS_SALT` (recommended) is any long random string, used for the daily visitor hash. Without it the database URL is used as the salt.
- Add `?utm_source=bristolfinsoc&utm_campaign=oct` to links you share, to see which channel works.
- To test locally, add `?track=1`. Tracking is off on localhost otherwise.

**Before launch:** The Desk has no privacy notice page yet. One is needed anyway (CVs and payments). It should mention this anonymous usage measurement.

**Tests:**
- `node tests/analytics.test.mjs` covers the whitelist, scrubbing and device parsing.
- The report SQL was run against a real Postgres (PGlite) during development.
