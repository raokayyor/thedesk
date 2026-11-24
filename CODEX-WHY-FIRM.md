# Codex: "Why this firm?" that knows it's a different firm

References: `design/why-firm-mock.html` and `design/why-firm.jpg` (Barclays vs Rothschild, same student). Data: `data/why-firm.mjs`.

## Idea
Most of a "why us" answer is generic structure (firm angle → your link → your proof → what you'd bring). The nod that makes a student think "it knows this is a different firm" comes from three firm-specific things we already hold in `interview-firm-packs.js` (`why`, `know`), now shaped in `data/why-firm.mjs` for 11 firms:
1. **The angle:** what this firm is really asking. Barclays: "Why a UK bank with international reach, rather than a US bank?" Rothschild: "Why independent advice, rather than a big bank with a balance sheet?"
2. **Hooks:** 2–3 firm facts (from the packs, sourced from the firm's own site), each with how a student might link to it.
3. **Avoid:** phrases that fit any firm, so they score nothing there. Barclays: "a great British bank", "global reach". Rothschild: "prestige", "boutique", "famous family".

Plus one practitioner tip per firm (with Kayyor's photo).

## Where it appears
1. **The "Why {firm}" gap sheet** in the interview feedback, and the "Why {firm}" beat on the think screen. This replaces the generic quick picks.
   - Header: firm logo tile (use the existing firm logo assets) + "Why {firm}?" + "{firm} · {division}".
   - Dark card "What {firm} is really asking": `angle` + `listen`.
   - "Pick your angle": the `hooks` as radio cards (fact in bold, link line muted).
   - A live green draft linking the chosen hook to **the student's own evidence** (CV, transcript, gap answers), with an amber gap for the personal reason.
   - "Fits any {bank|adviser|firm}, so it scores nothing here": the `avoid` chips, struck through in red.
   - Tip with photo. Button: "Use this in my answer".
2. **The feedback scorer:** if the student's answer contains any `avoid` phrase or `GENERIC_AVOID` phrase, the "Why {firm}" fix quotes it ("You said 'a great bank'. That fits any bank.") and suggests the firm's angle.
3. **Application drafts:** the "Why {firm}" question uses the same angle and hooks.
4. **Think screen:** the "Why {firm}" beat line shows the angle in small text: "{firm} wants: {angle}".

## Rules
- **Firm facts only from `hooks`** (and, for "know a recent result", only from our dated firm news if we have it; otherwise ask the student to add one and check it's current). Never let the model add other firm facts.
- **The draft must use the student's own evidence for the proof sentence,** and leave the personal reason as a gap.
- **Firms without a `WHY_FIRM` entry:** build one from their pack (`why` → angle, `know` → hooks) and use `GENERIC_AVOID`. Add entries for db, bofa, ubs, pwc, deloitte, kpmg next (their packs use a different shape; normalise them).
- **Keep "Check it's true before you say it in an interview"** under every draft.

Send Rao 390px screenshots of the sheet for Barclays and Rothschild with the same student.
