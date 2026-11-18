# Central programmes database

## Review and data

- Staff UI: `/programmes-admin.html` (the shell is public; all data, saves and CSV operations require the existing knowledge-admin `PRACTITIONER_SUPPORT_KEY`). Enter your staff email for audit attribution. The shared key authenticates staff access; it does not verify ownership of that email.
- Public tracker and homepage read `/api/programmes` / `/api/home-summary`, backed by `programmes` in Neon. No programme rows remain embedded in the tracker HTML.
- Migration baseline: **66 programmes, 24 firms**, preserving the current legacy 16-character IDs. The supplied handover described an older 61-row/21-firm snapshot. The five newer asset-management rows retain their November check dates.
- CSV: `exports/programmes-migrated-2026-11-18.csv`. Export again from staff UI after edits. Historical dates and statuses have not been newly verified by this implementation.
- Existing IDs stay unchanged. New IDs include firm, programme name and cycle. Renaming an existing programme in the staff editor preserves its ID.
- Original application stages, eligibility and tracker notes are preserved as migration metadata. Blank location means the snapshot did not supply a confirmed location.

## Administration

Filter by firm, type, status, closing in 30 days and review/staleness. Oldest check dates appear first. Add/edit fields, mark a source checked, review a CSV before import, export CSV and inspect the field audit trail. Imports use exactly the same server validation as edits and cannot set the audit identity.

Firm and ATS hosts are configured in `data/firm-domains.mjs`. Official firm roots are allowed with their subdomains. Third-party ATS hosts must be firm-specific: no blanket `myworkdayjobs.com` or Oracle host permission. Add a reviewed ATS host when a firm links to it. No aggregator data is imported.

All 66 existing rows seed idempotently on first database use. Preview uses the existing isolated preview schema; production data is not migrated until a production deployment is requested. The loader has a ten-minute in-process cache, invalidated locally on edits. Other server instances may take up to ten minutes to refresh.

## Freshness job

Set **PROGRAMMES_BOT_CONTACT** to a real monitored public email before enabling the checker. Reuse the existing CRON_SECRET. No email has been invented or configured. The checker is disabled outside production.

Vercel invokes the Monday scheduler every ten minutes between 05:00 and 09:50 UTC. Only 06:00 Europe/London starts a weekly run; later invocations resume that run in bounded batches. This handles British Summer Time without a fixed UTC-hour error. Job leases prevent overlap. Requests are identified as `TheDeskBot (contact email)` and spaced at least five seconds per host, including robots.txt. Disallowed or inaccessible robots, redirects, errors and browser-only pages are flagged for manual checks. Redirects are not followed automatically.

Only visible-text fingerprints and review metadata change automatically. **Dates, status and last human check date are never auto-edited.** A source returning 404/410 or a changed fingerprint is marked needs review. Initial fingerprints also need human review. “Checked today” acknowledges the source, adopts its latest fingerprint and resets review flags without changing the programme dates.

## Homepage and trust

The homepage displays the nearest three qualifying deadlines only when at least three exist in the next 30 days. Default groups: bb, ib, uk, am, big4. Insurance is included only for the Insurance route; Asset management and Big Four selections narrow their groups. Hero chip changes refresh this card. Each row links to the official source and displays its human check age.

The tracker displays the oldest human check date as the last full check and distinguishes imported snapshot dates needing reconfirmation. Missing eligibility/dates must remain blank/unconfirmed rather than guessed.

## Team data work

Fill missing UK spring weeks, insights, summer internships, off-cycle programmes, placements and graduate schemes for the firms in CODEX-PROGRAMMES.md. Prioritise bank/advisory spring weeks and summer internships before January. The firm-domain config includes the handover firms; add exact firm-specific ATS hosts as needed. This implementation does not claim to have researched new live programme postings.

## Verification (18 November 2026)

- Preview API returned all 66 rows from the isolated Neon schema. Unauthenticated staff API and cron calls return 401.
- 14 automated tests passed for data, validation, source checks, deadline filtering and staff access.
- Local in-memory PostgreSQL integration passed: idempotent migration, atomic save plus field audit, restoring a row, checked-today, insertion and public response shape. No production records were used.
- Preview configuration download was rejected by automatic approval review because it would write credentials to disk; no credentials were downloaded. Authenticated writes were verified locally rather than with the preview staff key.
- Browser visual QA is unverified. Production remains unchanged.
