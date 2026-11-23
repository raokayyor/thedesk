# Codex: make the interview rewrite actually fix the answer

## The bug (live, 23 Nov)
The weak Barclays intro answer (65/100) produced this as "Your answer, rewritten to 80+": *"I'm a final-year Economics student at Bristol, [Add your own missing detail] [Add your own missing detail]"* (19 words).

The no-invention check validates the draft as one block, so it wipes real CV facts too (12 companies, 4 flagged, recurring revenue). Earlier, the opposite failure happened: raw CV fields pasted as speech ("Modules: …"), an unrelated LVMH project, and a gap note cut off mid-word.

## The fix: `lib/answer-rewrite.mjs` (tested: `node test/answer-rewrite.test.mjs`)
- **`REWRITE_SCHEMA` + `rewritePrompt()`:** the model returns sentences, each citing its sources ("T" = transcript, or CV evidence IDs E1…), plus up to 2 gap parts and up to 3 numbered changes with reasons. 150–220 words, spoken, first person, only evidence relevant to the question, weak verbs turned into the student's own actions.
- **`validateRewrite()`:** checks **each sentence** separately (every number and proper noun must appear in its cited sources).
  - Only an unsupported sentence becomes a gap. The rest of the answer survives.
  - CV fragments ("Modules:", "2023–2026") are dropped.
  - Max 2 gaps, prompts max 40 characters, never cut mid-word.
  - The answer is OK if it has 90+ sourced words and a first-person action.
- **`fallbackRewrite()`:** no model needed. It builds a full answer from the transcript intro plus the strongest experience lines (prefers numbers; skips "supported / helped"; skips unrelated projects), a responsibility line from activities, the "why {firm}" opener, and 2 gaps. Use it whenever validation fails or the model errors, so a student **never** sees an empty rewrite.
- **`toClient()`:** returns `{ parts:[{gap,text,change}], changes:[{n,reason}], words, text, gaps, source }`, which is the shape `interview-simple.js` already renders.

## Wire-up in `api/interview-feedback.js` (practice mode, paid, and the free-taster preview)
1. Build `evidence` from the student's CV evidence catalogue (the same IDs the assessment uses): `{id, kind: education|experience|project|activity, org, role, text}`.
2. After scoring, call the model with `REWRITE_SYSTEM`, `REWRITE_SCHEMA` (tool `submit_rewrite`), `rewritePrompt(input, evidence)`, `temperature: 0`.
3. `let rw = validateRewrite(tool.input, {transcript, evidence, firm}); if (!rw.ok) rw = fallbackRewrite({transcript, evidence, firm, question});`
4. `feedback.rewrite = toClient(rw)`. Cache it with the score (same transcript hash, same rewrite).
5. **Free:** send `parts` but blur everything after the first 2 text parts client-side, with "Members get the full rewrite →".

## Acceptance test (run it live as Amelia, Barclays intro, the weak answer)
- The rewrite is 120+ words and mentions the Redcliffe internship, "12 UK software companies" and "4 … recurring revenue".
- No "supported the team", no "Modules:", no LVMH.
- Exactly 2 gaps: "what happened next?" and "one thing about Barclays you've looked into".
- Changes 1–3 are shown with their reasons.
- The same answer twice gives the same score and the same rewrite.

Send Rao a 390px screenshot of the result.
