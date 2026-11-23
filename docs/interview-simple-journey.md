# Responsive interview journey

Setup and interview use the same steps at phone and desktop widths. No orientation gate is present. The member navigation and legacy workspace stay hidden; the existing recorder, microphone capture and recorded/live transcription remain the media engine.

`/api/interview-guide` reads only an owned assessment, the latest saved CV, matching completed deep evidence, and that principal’s earlier interview transcripts. The guide is extractive, not a new model-written story. Candidate facts are exact source spans; the only speech conversion adds “I” to an implicit first-person CV action. Unknown results and learning remain gaps. New detail is explicitly confirmed by the student and stored separately from the original CV, scoped to principal, CV hash, question hash and example. Changing a CV does not silently reuse old confirmations.

Free tasters use the consistent fictional sample and never receive full answers in the guide response. Existing feedback quotas and the one-question limit remain in place. The responsive feedback view retains the existing score/dimensions while grounding candidate statements in exact transcript quotes. The four-beat check is labelled as a transcript structure check, not independent verification or a separate score.

The 30-second thinking timer pauses while a sheet is open or the tab is hidden. Recording runs for up to 120 seconds and can be ended with Done. On desktop, Space starts or ends an attempt except while typing or interacting with a focused control. Transcripts remain editable before feedback. All streams are stopped when leaving the page.

Answers with sparse source evidence stay short and show gaps; students must supply those details to build a 60–90 second response. Do not pad them with invented settings or outcomes.

Verification covers source-span rejection, account isolation, free answer locking, confirmation scoping, question counts, recorder/transcription continuity, missing-result feedback and practice/real mode visibility. Browser screenshots use a synthetic camera feed; provider transcription and model feedback are stubbed in the layout capture, with the deployed API checked separately.


## Every question has an answer structure
The preparation guide must use `answerStructure` from `lib/interview-frameworks.mjs`. Apply it to the actual question, not the interview format: HireVue is a delivery format and does not mean every answer uses STAR. Introductions, motivation, behavioural questions, technical questions, commercial awareness, judgement, cases, reasoning and follow-ups have distinct four-part plans.

Fill sections only with the student's saved CV, completed deep answers, saved earlier interview answers or explicitly confirmed gap details. Missing facts remain amber gaps. Never import an example speaker's achievements. Even without matching CV evidence, display the worked structure and prompts. Recording shows the same plan in the collapsed answer-guide strip; Real interview mode hides it. Feedback applies the same question-specific framework. Follow-ups retain the original CV example and read the prior answer from the signed-in student's saved answers.

New interview sessions default to a fresh guide from the saved CV and confirmed CV assessment details. Earlier interview transcripts and saved interview gap details are excluded unless the student explicitly selects **Use saved answers**. The checkbox starts off for every new session and is not persisted between logins. A deliberate follow-up still uses its own preceding answer as context. New details typed into the current guide appear immediately; they do not silently become the next session's default.
