# Route question banks

Add each approved bank to `lib/question-banks.mjs`, under the exact `profile.targetSector` value. No missing route falls back to another bank.

Each bank has a stable `id` and `commercial` / `numerical` arrays. Each question contains `topic`, `question`, four `options`, integer zero-based `answer`, and `explanation`. The first five questions from each group are used by both the form and server grading. Increment the bank ID when changing questions or answer order; the server rejects a submitted old ID so answers cannot silently be graded against a different test.

Current original questions remain available for General Finance and Investment Banking / IBD. The other offered routes are explicitly pending their approved banks, including Accounting / Audit. Their assessments pause before the quiz and the API rejects direct submissions without calling the model.
