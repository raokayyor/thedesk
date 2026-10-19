# Controlled questionnaire variation tests

`deep-dive-variants.mjs` creates three **fictional alternatives** for the same Alex Morgan CV: limited recollection, detailed personal contribution with an exact source count, and tutor-guided work with an estimated source count. These are test facts, not claims about a real student.

`check-deep-dive-variants.cjs` runs the deployed Claude follow-up service, answers its questions using only the variant's fact card, then requests verdict, repair and plan from the deployed Full Cycle service. Its deterministic responder deliberately says that facts outside the card cannot be confirmed. This makes evidence changes reproducible instead of introducing a second model's inventions into the test input.

Run the fixture regression with `node tests/deep-dive-variants.test.mjs`.

The live runner requires `DATABASE_URL` and the existing private fictional paid Alex test fixtures. Set `TEST_ORIGIN` and `TEST_SHARE` to a protected preview deployment. Credentials and record IDs stay under `.private`; never publish them. It creates isolated child assessment records linked to the existing paid test root, without issuing payments, changing its report or consuming rechecks. This is **not** an end-to-end checkout or questionnaire-submission test: confirmed fixture details are installed directly into the isolated test records after applying the same questionnaire validator.

Each variant retains the original CV, profile, quiz and assessment result. Only additional confirmed experience changes. The runner checks the original record remains unchanged and supports resuming saved checkpoints. Provider requests interrupted by the network may still finish server-side; consult the saved database report before repeating a generation.

Run `node audit-deep-dive-variants.cjs` and `node render-deep-dive-variants.cjs` to build the comparison page. The audit is a small regression aid, not a semantic fact checker. Manually compare every candidate assertion with the CV and the variant's answers. Pay particular attention to exact versus estimated numbers, independent versus guided contribution, invented preparation habits, withheld drafts and CV rewrites that silently revert to their originals.

The static comparison includes only fictional CV data and generated outputs. No owner cookies, database URLs, payment links or assessment identifiers are included.
