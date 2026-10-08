# Route question banks

Add each approved bank to `lib/question-banks.mjs`, under the exact `profile.targetSector` value. No missing route falls back to another bank.

Each bank has a stable `id` and `commercial` / `numerical` arrays. Each question contains `topic`, `question`, four `options`, integer zero-based `answer`, and `explanation`. The first five questions from each group are used by both the form and server grading. Increment the bank ID when changing questions or answer order; the server rejects a submitted old ID so answers cannot silently be graded against a different test.

The supplied Test Hub banks are at `data/numerical.json` and `data/technical.json`. The versioned five-question selections in `lib/route-bank-selections.mjs` serve General Finance, Investment Banking / IBD, Accounting / Audit, Markets and Asset Management. Technical selections use only the matching route; numerical topics also suit the route. Both the form and model API use these same selections. Corporate Banking, Consulting and Equity Research remain pending rather than silently borrowing another route.

The public Test Hub uses the full banks for practice. Assessment result links open the relevant topic and carry the owned assessment ID for a return link. Practice history stays in that browser; it does not alter the readiness score. A later verified recheck is the place to recognise demonstrated improvement.
