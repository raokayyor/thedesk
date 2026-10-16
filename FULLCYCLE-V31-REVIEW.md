# Review of supplied v3.1 bundle

The archive is based on bc774e8. It must not be applied wholesale over the newer opt-in firm-prep dashboard and CV-download validation fixes.

Applied:
- Correct options and structured worked answers from either question-bank format.
- Content-based priority links, accurate practice-topic links and date-safe CV cut highlighting.
- Lossless handling of a generic summary and a detailed adjacent source that would otherwise duplicate one another. Keep the complete detailed source once.
- Prompt instruction to preserve findings and limitations.
- Revalidated fictional live report, keeping its original score and generation provenance. No fresh model answers or hand-authored student claims were added.

Changed from the bundle:
- Do not delete a detailed source line on 50% word overlap: that can lose findings or qualifications.
- Keep the corrected validated repair object when building a downloadable CV. The bundle discarded the returned object.
- Retain whole-source fallback for incomplete rewrites and withholding of unsupported STAR drafts. Heuristic sentence deletion cannot establish that the remaining answer is factually supported.
- Do not strip every sentence starting with “No” or “Not”; these can be important qualifications.
- Keep employer recruitment-process material out of the personal report. Firm guide shortcuts remain opt-in.
- Do not implement the proposed number-word validator unchanged: treating conversational “one” as a numerical outcome creates false positives, while compound counts need proper parsing.

Guide expansion:
- Thirteen new guides, plus existing Deutsche Bank: seven other banks; PwC/EY; RSA/Intact and L&G; Insight Investment and BlackRock.
- Public role explanations and fictional work exercises, with official careers sources.
- Full Cycle preparation pack retrieved only after server-side ownership and paid-access checks. No AI call is made by reading or saving a guide.
- Add firm uses the existing browser preference store. This is a shortcut, not an entitlement or purchase.
- Numerical practice is now a distinct dashboard section. Practice does not alter the saved assessment score.

Checks: Full Cycle unit/regression checks, all guide routes and source links, desktop/mobile layout, opt-in guide flow, numerical practice and live paid/anonymous access checks.

