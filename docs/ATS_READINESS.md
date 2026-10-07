# ATS readiness v1

`lib/ats-readiness.mjs` computes a deterministic, auditable text-readiness result from extracted CV text. The assessment endpoint exposes the same object at `result.atsReadiness` and `result.page.atsReadiness`.

## Scoring rules

- Text readability: 25 points, split equally between sufficient extracted content and low replacement-character rate.
- Section structure: 25 points, split equally between recognisable education, experience/projects and skills headings.
- Contact and chronology: 15 points, split equally between an extracted email address and year dates. Contact values are never returned.
- Target-role terms: 35 points, evenly split across unique supplied target keywords or the built-in Desk route dictionary. Phrase boundaries and documented aliases apply; repeated keywords add no credit.

Each component returns earned/max and pass/fail checks. Internal values retain one decimal; the dial score rounds the sum once. These are proposed Desk heuristics, not empirically calibrated bank screening criteria. Presence of a term is not evidence of proficiency. No candidate university, name, gender or degree subject influences this score.

## Inputs

Existing extracted `cv.text` or PDF/Word upload and candidate `profile.targetSector`, `targetDivision` or `track`. Optional `targetKeywords` is an array supplied from the chosen job specification. It is available in JSON and multipart requests. Without supplied terms, supported routes are investment banking, markets, asset management, accounting and research. Missing/unsupported route returns a partial result with null score, not a fabricated overall ATS number.

## Overall weighting

The agreed proposed five-part readiness model is application 30, ATS 10, competency 25, numeracy 15, commercial/technical 20. ATS contributes `score / 10` internally. `weightedContribution.appliedToOverall` remains false: the current production backend produces a holistic LLM overall score and does not expose those four independently calculated components. Do not silently add ATS to that score or subtract ten points from it. Activate the five-part model only once the original component contributions can be recomputed at their new maxima, sum to 100, and all labels, bands and progress indicators share the same total.

## UI contract

Read `score`, `band`, `components`, `matchedKeywords`, `missingKeywords`, `suggestedActions` and `limitations`. Use score for the dial; show null as not assessed. Never relabel missing terms as missing experience. Ask the candidate to add terminology only where supported by their actual CV facts. The static result-final-design.html prototype is not wired to this response yet.

## Limits and verification

Extracted text cannot prove layout compatibility, column reading order, header/footer placement or vendor acceptance. File-level analysis and calibration against real parser fixtures remain future work. This is not a rejection probability or bank pass mark. Heading checks can miss unconventional but valid headings; vocabulary lists are a starting dictionary and require review per role.

Run `node tests/ats-readiness.test.mjs`. Covers incomplete input, unsupported role, exact matching, aliases, explicit terms, repetitions, keyword changes, weight calculation and contact-data minimisation. Backend integration syntax is checked; no paid model request is required for these tests.