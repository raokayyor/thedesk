# Full Cycle v3 integration

Imported from the user-supplied `the_desk_fullcycle_v3.zip`, based on repository revision 081574e.

- New generation uses the v3 contract, deterministic score facts, optional validated STAR drafts, profile warnings and server-built weeks 2–4.
- Existing saved report sections remain cached and readable. No existing student report is overwritten or silently regenerated.
- `fullcycle.html?id=...` verifies checkout where required, reads the owned assessment, generates only missing sections and calls the existing paid CV endpoint.
- Rechecks use server-returned remaining entitlement and the root assessment ID. Practitioner questions use the existing private queue and one-question limit.
- `fullcycle-amelia.html` and `fullcycle-report.html` show the supplied v3 preview. A prominent notice identifies its hand-written target answers; it is not presented as a freshly generated v3 report. Paid actions are disabled in the preview.
- The supplied preview intentionally includes contradictory academic-stage data so its profile-warning banner can be reviewed. Do not use that profile to generate a production sample without confirming and correcting the input first.
- Removed unimplemented automatic human sign-off and scheduled live-Q&A promises. Confirmation answers and checklist progress are browser-local conveniences, not messages to a practitioner or proof of review.
- Firm-process notes are imported dated tracker snapshots. The prompt and display require checking current vacancy/invitation details. No live vacancy or sponsorship guarantee is made.

Validation: v3 contract unit checks; 15 scoring/evidence/payment tests; desktop/mobile browser checks with mock API responses for sample, first generation, saved sections, payment return, unpaid gate, CV download, practitioner submission and recheck navigation.

No live Claude generation was run as part of this import. The application continues to use its configured Anthropic credentials in production; no model or billing settings changed.