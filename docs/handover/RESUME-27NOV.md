# Resume the assessment work —27 November2026

## Start safely

Fetch origin/codex/sidebar-consistency, inspect status and divergence, and read root HANDOVER.md. Latest LIVE application is95a8516258e590d1a5c211c63e5c6d9aa4b03361, deployment dpl_6wUHEwpe7CngKvSpa7BNwx7sqGV3 READY, exact SHA + thedesk.vercel.app alias verified. URL https://thedesk.vercel.app/ . Homepage edits are live; assessment WIP below is NOT live.

The portable patch is based on95a8516258e590d1a5c211c63e5c6d9aa4b03361. The following documentation commit changes no patch-target code. On a CLEAN other-PC checkout, run:

    git apply --check docs/handover/27nov-assessment-in-progress.patch
    git apply docs/handover/27nov-assessment-in-progress.patch

If lib/assessment-evidence-contract.mjs already exists or the working tree already has these changes (as on the laptop), do NOT reapply or reset them. Inspect and preserve work. Patch SHA256:4d6e88d40a5b0d2210b8d7ea2c23eb3779345920c109521f5a8e21ed2af40faf.

## What is already live

- Explore first:16px with44px tap area on phone, primary assessment CTA retained.
- Live seminar heading above AMA, including its dynamic dated/fallback rendering.
- Replaced360k Goldman sentence with “How do I submit an application that gets through?”; removed unused footnote.
-4 relevant tests passed.390x844/1280 browser checked without horizontal overflow. Final production SHA/alias verified; live DOM capture still worth checking after resume.

## Assessment WIP in the patch

1. New lib/assessment-evidence-contract.mjs requests only six criterion marks and seven competency marks with exact source IDs. It resolves source quotes and uses existing calculateScores. Missing experience/education-only input is valid. Invalid marks, absent support for positive marks, foreign quotes, duplicate categories and resilience rules still fail. No fabricated default score. Same80/20 weights/rubric/cache remain. Rules supply findings; deterministic source descriptions replace AI prose. The API no longer rejects numeric evidence solely because it cannot write four named competency explanations or a CV preview. Provider retries are bounded to two; retryable errors are classified. Review compatibility with prepared/shared cached rows.
2. New shortSupportingRewrite handles only a short Helped/Assisted with noun-task fragment. It materially changes wording, preserves a supporting role, invents no facts and puts unknown contribution/scale/outcome in amber gaps. Example James bookkeeping. API can save this deterministic scaffold without unreliable AI paraphrasing. Full fix cards explicitly say to fill amber details before using it. Other rewrites retain mechanical + independent factual validation. Before-email preparation remains metadata-only; chips work regardless of rewrite generation.
3. Compact-summary draft: tests merged under score band; university/course block and practitioner removed pre-email (still full report); reason no-number sentence shortened at source; Your weakest line; Missing chips; blurred placeholder and extra-line count on same row; approved Cydney quote unchanged; email heading See your fix + reason3; email/button; short fix-all89 text link; Free/no-card only. No4-item unlock list or comparison small print. Zero flags must not invent fixes. Target~150 visible words and email within1.5screens at390x844. Not visually verified yet.

## Next exact work

1. Replace/update tests/engine-retry.test.mjs: old harness expects obsolete AI-prose retries and res.body.result (API returns entry); it also expects Consulting unavailable, now false. Write meaningful API tests: valid sparse evidence saves in one call without prose; invalid marks/foreign quotes reject after bounded retry; transient provider failure retries once; unsupported route rejects before model. Use owner-scoped mocked storage and no real keys.
2. Update old layout assertions for the latest requested template: test/cv-framework-integration.test.mjs Your tests heading; test/cv-summary-route.test.mjs topics-you-would-be-asked wording; test/summary-membership-cues.test.mjs old long upsell; tests/assessment-summary-entry.test.mjs old separate numerical/commercial labels; test/cv-summary-desire.test.mjs old Missing label. Keep source/quote/gate/score validation tests meaningful. Do not weaken rewrite guards to make tests green.
3. Run relevant checks, source/diff review, then render compact James and Amelia with current code. Check word count, full quote, email/button bottom<=1266px at390x844, no sideways overflow; desktop1280 check.
4. Commit patch-applied implementation + updated HANDOVER, push, deploy exact SHA and verify READY/alias before saying live. Do not deploy this WIP before the above checks pass.
5. Run portable verification runner after deployment: node docs/handover/verify-assessment-resume.mjs . It uploads five fictional CVs, grades actual answers, checks current framework findings/teaser/hidden third reason and missed-topic count, requires private fix preparation success, reopens owner-scoped result, repeats score. Cookies remain memory-only. Use --cold to add an explicitly fictional Languages English line to force new evidence hashes and exercise the new model contract; don't present those as unchanged CV scores. Test repeated fresh owners and skipped tests; photograph phone summary for each.

## Evidence so far, without overclaiming

-23 checks passed before compact template changes: evidence-only contract5, prepared/scoring4, owner/loading2 and rewrite/gate12. New code has not been live-tested. Latest compact markup has not had its assertions/phone checks finished.
-Before fixing production, Tom succeeded this morning at13/100 after previously failing (59.7s for whole test), showing intermittency; James summary35/35 but private rewrite503 rewrite_validation. This is NOT proof all five fixed. Existing cached CVs may bypass the new model; exercise cold fictional inputs.
-Prior strong-CV outcome exemptions, deterministic finding order, stable scores and20% test weight must remain. Different answers legitimately change test points; identical CV+answers must not drift. No prestige scoring or invented achievements.

## User decisions / boundaries

EMAIL EXPLICITLY DEFERRED on27Nov: user said skip for now, email not set up. Do not ask for test inbox again, provision credentials, or claim delivery fixed. Main button stays honestly disabled while unavailable. No secrets/private real CVs/cookies are in this package. Cydney quote must remain exact approved repository wording with Exeter attribution; don't independently claim her outcome was reverified. Preserve sidebar. Keep work local to user's computer. Update HANDOVER after every batch, push origin/codex/sidebar-consistency without force and report final SHA. User is moving to the other PC; resume from this package.
