# Tracker wave 1 integration

Added 43 programmes across 27 firms in the supplied wave, while preserving 61 existing programmes (21 bank, 13 Big 4 and 27 insurance). Total: 104 programmes in six sectors.

The package was based on an older commit. The preview also includes the newer firm guides and numerical-practice dashboard; tracker guide links now point to those pages and retain assessment context.

Corrections:
- Describe the supplied 13/15 October data as snapshots, not a live feed or a claim that every official page was independently verified.
- Distinguish listing-sourced details from the actual link destination. Nomura and other listing links now say “View listing”; Grant Thornton’s official search destination says “Check on firm site”.
- Keep source links accessible for closed entries so students can check the source.
- Keep PKF explicitly unverified; do not display a checked date for a row saying it was not checked.
- Nomura’s listing contains inconsistent deadline and graduation-year information. Keep status unconfirmed, remove its unverified eligibility/sponsorship chips and direct the student to confirm with the employer.
- Replace fixed sector summaries and absolute availability statements with counts and source-snapshot explanations.
- Label entry as external applicants rather than “open to anyone”; separate entry eligibility still applies.
- Correct literal backslash-n text in the supplied CSS.
- Preserve rounded styling, saved-list keys, stages and export.
- Support a direct sector link and return to the current Full Cycle dashboard.

Source spot checks on 15 October 2026:
- Rothschild’s official London 2027 summer page matches the rolling window and eligibility. Its row is marked reviewed.
- NatWest’s official Commercial Banking graduate page shows September 2027, a two-year programme and a registration-of-interest section. Its row is marked reviewed.
- Nomura’s Higherin listing shows two different deadlines and inconsistent graduation years. It remains unconfirmed.
- Several other portals could not be reliably retrieved. Their imported claims were not promoted to independently verified facts.

Validation: all six sectors and 104 rows, 43-row JSON/inline equality, programme filters, listing labels, closed-source links, HSBC guide routing, saved-stage persistence/export, mobile overflow and JavaScript errors. No automatic applications, messaging, live monitoring or AI calls were added.

