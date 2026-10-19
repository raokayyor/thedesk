# Full Cycle experience deep dive

The paid flow now asks for additional evidence before generating a new report. Existing saved reports remain readable and gain a link to review experience details.

The questionnaire covers university learning, sport/societies/other responsibilities, interests and motivation, then asks about exact quoted CV points. Claude prepares source-specific recruiter questions, followed by a cached second pass over the student's own responses. Students can skip, say not remembered/not recorded/not applicable, and distinguish exact from estimated quantities.

Completed details are stored in the owned assessment input separately from the original CV. Original E sources remain the only replaceable CV bullets; C sources support the linked CV point; B sources describe confirmed background; F sources hold answers to recruiter follow-ups. Unknown responses are excluded. Completion invalidates saved paid sections only after explicit confirmation; draft saves leave current reports available. Original scores, quiz results and recheck counts are not changed. Active generation and stale-tab writes are blocked.

This improves evidence collection and allows shorter drafts. It does not make student statements independently verified, and the existing heuristic draft guard is not a complete semantic fact checker. Generated answers still require source review; this change must not be described as eliminating hallucinations.

Preview-only rollout. The interactive Alex demo uses fictional public inputs and illustrative questions, makes no payment or model call, and does not alter a real assessment.

Validation: source binding/estimates/unknowns and unchanged-score tests; API ownership/origin/revision/probe-cache/generation-conflict checks; full demo flow and mobile browser check. Existing Full Cycle v3 and output-safety regressions remain passing. Real paid-path verification is recorded separately after preview deployment.

## Evidence-first report changes

New reports assess all seven competencies but do not require seven invented spoken answers. Missing examples can have null drafts and specific recruiter questions. All sources used by an answer should be cited (up to six); quantities are checked against those sources. The interview selection includes work experience when available.

A separate Claude review checks every generated CV bullet and available competency answer against the original CV and confirmed details. Incomplete or malformed reviews fail generation; unsupported drafts are withheld and replaced by a question. This remains model-assisted checking, not independent verification or a guarantee against hallucinations. It adds latency and a provider call to report generation.

Unchanged CV bullets are explicitly marked as needing details and are not counted as successful rewrites. Finished bullets must use confirmed facts with questions kept separately. Existing saved reports are not silently regenerated or upgraded to reviewed status.
