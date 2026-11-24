# Codex: "Why this firm?" that knows it's a different firm

References: `design/why-firm-mock.html` and `design/why-firm.jpg` (Barclays vs Rothschild, same student). Data: `data/why-firm.mjs`.

## Idea
Most of a "why us" answer is generic structure (firm angle → your link → your proof → what you'd bring). The nod that makes a student think "it knows this is a different firm" comes from three firm-specific things we already hold in `interview-firm-packs.js` (`why`, `know`), now shaped in `data/why-firm.mjs` for 11 firms:
1. **The angle:** what this firm is really asking. Barclays: "Why a UK bank with international reach, rather than a US bank?" Rothschild: "Why independent advice, rather than a big bank with a balance sheet?"
2. **Hooks:** 2–3 firm facts (from the packs, sourced from the firm's own site), each with how a student might link to it.
3. **Avoid:** phrases that fit any firm, so they score nothing there. Barclays: "a great British bank", "global reach". Rothschild: "prestige", "boutique", "famous family".

**"What they're really asking" is Kayyor's tip.** The dark card shows his photo, "What {firm} is really asking", "Kayyor Rao · 20+ years in banking", and the `tip` text in his voice. There is no separate tip line anywhere else in the sheet.

## Where it appears
1. **The "Why {firm}" gap sheet** in the interview feedback, and the "Why {firm}" beat on the think screen. This replaces the generic quick picks.
   - Header: firm logo tile (use the existing firm logo assets) + "Why {firm}?" + "{firm} · {division}".
   - Dark card with Kayyor's photo: "What {firm} is really asking" + "Kayyor Rao · 20+ years in banking" + the `tip` quote (Garamond). Keep `angle` for the think-screen line and the scorer.
   - "Pick your angle": the `hooks` as radio cards (fact in bold, link line muted).
   - A live green draft linking the chosen hook to **the student's own evidence** (CV, transcript, gap answers), with an amber gap for the personal reason.
   - "Fits any {bank|adviser|firm}, so it scores nothing here": the `avoid` chips, struck through in red.
   - Button: "Use this in my answer".
2. **The feedback scorer:** if the student's answer contains any `avoid` phrase or `GENERIC_AVOID` phrase, the "Why {firm}" fix quotes it ("You said 'a great bank'. That fits any bank.") and suggests the firm's angle.
3. **Application drafts:** the "Why {firm}" question uses the same angle and hooks.
4. **Think screen:** the "Why {firm}" beat line shows the angle in small text: "{firm} wants: {angle}".

## Rules
- **Firm facts only from `hooks`** (and, for "know a recent result", only from our dated firm news if we have it; otherwise ask the student to add one and check it's current). Never let the model add other firm facts.
- **The draft must use the student's own evidence for the proof sentence,** and leave the personal reason as a gap.
- **Firms without a `WHY_FIRM` entry:** build one from their pack (`why` → angle, `know` → hooks) and use `GENERIC_AVOID`. Add entries for db, bofa, ubs, pwc, deloitte, kpmg next (their packs use a different shape; normalise them).
- **Keep "Check it's true before you say it in an interview"** under every draft.

Send Rao 390px screenshots of the sheet for Barclays and Rothschild with the same student.

## Rule for every Kayyor tip, everywhere
Kayyor's tip is **always "what they're really asking"**, never generic advice. This applies to:
- the interview think screen (every question)
- the crib sheet
- feedback
- application drafts
- the free result

Format: photo + "What {firm | the interviewer} is really asking" + "Kayyor Rao · 20+ years in banking" + one or two sentences in his voice, starting "They want to know…".

Examples:
- Team question: "They want to know what *you* did. Every 'we' hides you."
- Intro question: "They want to know which one experience makes you relevant. Lead with it, not your degree."

Store as `reallyAsking` on each question in the question banks. Replace the current tip text (e.g. "Lead with relevant experience, then explain why this role.") with this format. Rao approves the wording.

## Implementation and release status (24 November 2026)

Built locally, held for Rao’s wording approval. Do not deploy this change to production until the copy is approved. `docs/really-asking-top-50-review.md` and `data/really-asking-review.mjs` are the approval list. The 50 prioritise core journey and firm-pack questions; they are not a measured popularity ranking.

Shared sheet: `why-firm-sheet.js`; canonical firm selection and extractive proof: `lib/why-firm.mjs`. The server resolves hook indices back to the firm data rather than accepting client-written firm facts. News/research tasks remain gaps. Firm questions from packs remain explicitly labelled practice wording.

Consumers: interview guide/beat and rewrite gap; avoid-phrase improvement plan; application gap flow; shared `reallyAsking` question fields and cards on think, feedback, crib and drafts. The local review page uses the same component and Amelia fixture; it never writes an account.

Publication approved by Rao on 24 November 2026. Current wording may be edited later in the review editor.
