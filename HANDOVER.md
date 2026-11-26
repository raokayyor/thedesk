# START HERE — 26 November 2026: phone capture and early preparation

Branch: codex/sidebar-consistency. This implementation follows 7a7dbedde1024445925125470fbaaa330c51117f (restored both question-count cards). The next release-record commit will identify the implementation SHA and verified deployment.

- Phone first: compact aims header/spacing, with Next: add my CV fixed above existing phone navigation. At 390×844 the standard aims content and Next fit without scrolling. Very short phones initially show fewer firm suggestions; More firms expands the optional list/custom input and can require scrolling. Keep all routes and typed firms available.
- Question screens use the visible viewport height with compact typography and table styling. Restored bank table metadata discarded by the old mapping; questions referring to a table now render the real bank table. No question/scoring changes. All 60 route/section/question combinations checked in local browser at 390×844 and 320×568: no document overflow or answer behind action bar. This is browser emulation, not a physical phone/browser-toolbar test.
- CV success now says only ✓ CV loaded. Filename receipt hidden; removed We found summary and shared-device/save-and-exit explanatory paragraph. Draft/resume and Save & exit button retained.
- Removed visible first-name input/requirement; backend accepts absent name without fabricating one. On Ready to see your score, optional next-goal choices: Sending applications, Online tests, Interviews or assessment centres. Choice saved in draft and pending-result context; it does not change scoring or restart generation. Further use to tailor next-step recommendations remains future work.
- Preparation starts on entering final review after valid CV, consent and completed/skipped tests. Build reuses that exact pending/completed request. No redirect or loading overlay until Build. Failed background request can retry; edits/back cancel client request; altered inputs generate a new request. Server's existing owner/fingerprint cache is unchanged. No artificial waiting added; actual time saved depends on time spent on review.
- Checks: 32 focused tests passed (preparation, table, route targets, intro, upload lifecycle, free-result routing, signup, document preview); syntax checks passed; showcase fingerprint matches; reviewed diff and CRLF-aware whitespace check passed. Local full ten-question path reaches new optional choice with Build visible. Tests verify background start before click, one request on click, completed-result reuse, retry, changed CV, and consent/cancel behaviour.
- User reported a live “Your assessment couldn’t finish” error BEFORE this implementation was deployed. Exact smaller error message was requested; no matching production error/warning or analyse-mot logs were returned for the preceding hour. Root cause remains unconfirmed; do not claim this UI/speed batch fixed that failure. Next: reproduce live generation with fictional CV, inspect exact response/reason and verify retry. Preserve user's real draft.
- Publication: implementation not deployed at time of writing. Prior production: dpl_3M7mhrn3CLcR9SmQdpoG3R75kCbo serving 9cae873a281f9a37a5a00ea332bdc885549c29c5 at https://thedesk.vercel.app/assessment.html. Release verification will be prepended after deployment.
- New decisions: capture is mainly on phones; keep primary content/action within screen wherever possible; no scrolling questions. Calculator remains allowed, no timer, 5 numerical + 5 commercial cards retained, only 8-minute bubble removed. Preserve sidebar.

---

# START HERE — 26 November 2026: assessment entry and test buttons

## Latest user correction: preserve the question-count bubbles
- Restore the original **5 numerical questions / 5 commercial questions** bubbles on the numerical introduction. The user intended only the **8 min** bubble to be removed, not the two question-count bubbles. Keep the concise paragraph, calculator permission and visible Start button.
- Implemented two equal-width count cards using the existing card styling. No scoring, navigation or firm-picker changes in this correction. Production verification and final implementation SHA will be recorded after release.

This section updates the older handover below. Branch: `codex/sidebar-consistency`. Latest implementation commit: `9cae873a281f9a37a5a00ea332bdc885549c29c5`.

## Completed in this batch
- Expanded firm suggestions (including 19 investment banking firms); six suggested chips appear initially, with More firms for the rest. Added Add a firm text input, usable with Add or Enter. Keeps up to three firms, normalises known names, deduplicates case-insensitively, persists custom names across browser/server storage and tool return links. Changing route retains the user's selected firms. Custom firm selection does not create or invent firm research.
- Replaced the long numerical introduction with: Five questions to understand your numerical ability. You can use a calculator. There’s no pass or fail. Commercial introduction is similarly short.
- Removed the 8-minute label, remaining-time estimates and per-question 45-second guidance. Removed the Skipping is fine explanation; the skip link remains available and scoring for skipped tests is unchanged.
- Fixed the missing Start action: all phone assessment step action bars now sit above the existing bottom navigation, instead of behind it. This also fixes Next/Back on question screens. Sidebar/navigation files are unchanged.

## Evidence and checks
- Live baseline reproduction at 390 x 844: numerical-start action was fixed at bottom 0 under the phone navigation; hit testing at its centre returned Community. Local fix: button bottom 758px; navigation top 758.2px; hit test returns Start numerical test, and clicking opens Question 1.
- Local browser uses the actual repository HTML/JS/CSS with fixture-only API endpoints (no real account or assessment generation). Tested route/firm selection, typed Example Partners, reload persistence, More firms, pasted synthetic CV, processing consent, numerical intro and Start to question one. No horizontal overflow at 390 x 844.
- Focused tests: `node --test tests/assessment-targets.test.mjs tests/assessment-quiz-intro.test.mjs tests/phone-cv-upload.test.mjs tests/free-result-journey.test.mjs tests/signup-auth.test.mjs tests/signup-profile.test.mjs tests/document-preview.test.mjs`: **26 passed, 0 failed**.
- `node scripts/build-amelia-showcase.mjs --check`: matches current scorer. JavaScript syntax checks passed. Reviewed diff; whitespace check with existing CRLF handling passed (`git -c core.whitespace=cr-at-eol diff --check`).
- Phone screenshots in `docs/verification/assessment-26nov/`. Also verified the desktop assessment resumes to Question 1 at 1280 x 800 without overflow. Full live generation/signup testing and a physical phone keyboard test are not claimed by this batch.

## User decisions this morning
- Add more firms and allow a typed firm name.
- Make the numerical introduction simple; remove the Skipping is fine explanation.
- Remove the 8-minute label and question time guidance because it may discourage people.
- Calculator allowed: recommended in chat and used in this change; replaces the earlier no-calculator wording.
- Make Start visible. User wants to continue on the updated live assessment; publish and verify READY before saying it is live.

## Publication and remaining work
- Implementation `9cae873a281f9a37a5a00ea332bdc885549c29c5` and initial handover `98ebc14987a519a537ecfa962a43801160541df2` pushed successfully to `origin/codex/sidebar-consistency`; remote fetched and confirmed. This final release-record commit follows them; report its SHA after pushing.
- **Production READY**, deployment `dpl_3M7mhrn3CLcR9SmQdpoG3R75kCbo`, serving implementation `9cae873a281f9a37a5a00ea332bdc885549c29c5`. Confirmed `thedesk.vercel.app` in its aliases. URL: https://thedesk.vercel.app/assessment.html ; immutable deployment: https://thedesk-ol6jlwrux-raokayyor.vercel.app . Handovers committed after the implementation are pushed documentation, not a different deployed code revision.
- Live browser at 390 x 844 reloaded the updated firm entry, resumed the saved synthetic-CV assessment, displayed the short numerical introduction with calculator permission, and clicked Start numerical test into Question 1. Hit test confirms Start receives the tap; document width 390px; time label hidden. Screenshot `assessment-numerical-live-390x844.jpg`. User told the page is ready to continue only after these checks.
- Next: follow the user's review as they continue, then resume yesterday's priorities: upload failure/retry, back/resume, complete tests → result → free signup → returning to result; improve the usefulness and paid-value explanation of the free report using only CV-backed facts. Preserve sidebar and layouts. Do not claim the whole journey is bug-free.

---

# Cross-PC continuity sync

The laptop fetched and preserved remote head `9301da6540a56b6d6b9a46bf51d4a293b7d14427` while merging its documentation/evidence batch. The original PC's latest priorities and handover below are retained intact; the older crib verification appended at the end does not supersede them.

- Branch: `codex/sidebar-consistency`. Latest implementation: `853c35c501f5c1aad322a29b198cfaa9127ad1b9`; later remote commits through `9301da6` are handover/priority updates.
- Production rechecked through authenticated Vercel tooling during this sync: **READY**, deployment `dpl_CJDSXAA6on2W8QTK6JbQ4kgSc5c9`, serving `853c35c501f5c1aad322a29b198cfaa9127ad1b9`, https://thedesk.vercel.app (immutable: https://thedesk-jslk5ai6k-raokayyor.vercel.app). No deployment was initiated by the laptop documentation batch.
- This sync preserves the newer phone assessment/CV/signup fixes, three-second sample-crib preparation state, and next-session assessment-quality priority. No application edits were made by the laptop agent.
- Before each new batch: fetch the branch, read this file and `AGENTS.md`, inspect status/history, preserve uncommitted work, and reconcile divergence safely. After each completed batch: run relevant checks, review the diff, update this file, commit, push to `origin/codex/sidebar-consistency` without force, verify remote SHA and report it. Never commit secrets. A push is not deployment confirmation.
- After merging: `node --test tests/document-preview.test.mjs tests/phone-cv-upload.test.mjs tests/assessment-targets.test.mjs tests/assessment-quiz-intro.test.mjs` passed **13/13**. Reviewed incoming crib changes (three-second preparation state and assessment return firm), gateway changes and own-CV target handling. The only conflict was add/add `HANDOVER.md`, resolved by keeping the complete remote handover and appending the earlier laptop snapshot.
- Reviewed the documentation/evidence delta against `origin/codex/sidebar-consistency`; its whitespace check passes. A check against the older local parent also reports pre-existing CRLF/trailing-whitespace warnings in incoming application files. These were retained without unrelated formatting edits.
- Last fetched/pushed remote baseline: `9301da6540a56b6d6b9a46bf51d4a293b7d14427`. The final response reports this batch's verified pushed merge SHA; Git history identifies this documentation revision. The first laptop push was correctly rejected because newer work existed; it was fetched and merged rather than force-pushed.

---

# START HERE — laptop handover, end of 25 November 2026

This section supersedes the historical notes below. Read this before changing anything.

## Next session: Thursday 26 November, on the laptop
The user's final verdict: **the flow is starting to work, but the free assessment result is rubbish and does not make them want to pay.** Tomorrow's priority is improving the actual free assessment/report, its usefulness and its paid-value explanation. Preserve the working journey and existing layouts while doing that. Do not restart a dashboard redesign, simplify desktop, invent scores, or add generic upsell copy as a substitute for useful feedback. No report redesign was implemented tonight; this remains the next task.

**Final user clarification: PHONE FIRST.** Remaining bugs still exist in Add CV, the free-assessment journey and free-account sign-up; do not describe this journey as bug-free. Tomorrow first reproduce and repair the whole phone path (route/firm taps → upload or paste → processing consent → visible/enabled Next → tests → result → free-account sign-up → returning to the result). Test success, failed upload/retry, back/resume and the mobile keyboard/bottom toolbar. The user has not supplied exact remaining bug reproductions, so inspect the flow rather than assume the last Next-button fix solved all of them. Then improve the assessment output: the phone result must be genuinely decent and useful; this is the main product priority, not merely getting through the form.

Start by reviewing what a fresh phone user actually receives after uploading their own CV and completing the assessment. Compare the promises in the entry flow (score, three weak lines, tools prepared for chosen firms) with what is actually delivered. Inspect the generation/output and free-versus-member gating before proposing concrete improvements. Use CV-backed facts only. Check whether missing education/profile fields in the new taps-first entry affect report quality; never fabricate these fields. The user has not yet specified tomorrow's final report design.

## Laptop checkout and continuity
- Repository: https://github.com/raokayyor/thedesk.git
- Branch: `codex/sidebar-consistency`.
- Laptop checkout previously confirmed: `C:/Users/raoka/Documents/Codex/thedesk`.
- Fetch and inspect status first. If clean, switch to this branch and pull with `--ff-only`. If the laptop has edits, preserve them and reconcile; never reset/overwrite them.
- Read this file, then repository guidance including `CODEX-ALL-24NOV.md`. Old notes below are a history, not a request to undo newer work.
- GitHub carries code and this handover; the chats themselves do not automatically share full conversation context.
- The current handover commit comes after the latest deployed code; a documentation-only commit does not require deployment.

## Current production and final fix
- Production: https://thedesk.vercel.app
- Latest deployed implementation: `853c35c501f5c1aad322a29b198cfaa9127ad1b9`.
- Deployment `dpl_CJDSXAA6on2W8QTK6JbQ4kgSc5c9` is READY with the production alias, verified in this chat.
- Final user bug: uploading a CV on phone did not show Next. Fixed: CV step keeps **Next: short tests →** above the bottom toolbar; disabled until readable CV plus consent, shows Reading your CV while busy. Upload completion emits `desk:cv-state` after clearing the busy flag. Phone layout verified live at390×844; upload lifecycle regression test passes. Physical iPhone upload was not separately tested.

## Preserve the now-working assessment journey
- `/assessment-start.html` redirects to `/assessment.html`, retaining query parameters.
- Step1: What are you aiming for? Six route chips; optional up to3 filtered firm choices; More; Next enabled after route choice.
- Step2: Add your CV, firm-specific copy, native upload/paste/email option, sample report link. Phone bottom toolbar stays visible. Back to Your aims available.
- Step3 numerical, Step4 commercial. First name remains on final review; no education details are invented. Legacy input IDs retained hidden for scoring compatibility.
- Route/firm choices persist locally and via scoped `/api/assessment-targets`; verified server read returned chosen IB/Barclays. They feed own tool contexts and dashboard defaults. Amelia sample stays Barclays.
- Consulting explicitly uses commercial fundamentals, not a consulting case test.
- Analytics map views/completions to the four actual phases; starting a test does not count as finishing it; pagehide records step_left.

## Latest homepage / Explore state
- Homepage bottom: See inside before you start. / Try the tools on a sample CV. No sign-up. / Explore The Desk: it's free → / or start my free assessment →.
- Live public wording uses free assessment, not free review. Pricing secondary link mentions the three lines that would get you rejected.
- Phone Explore hero uses full-width Start my free assessment →. Signed-out header Log in.
- Proof stays collapsed on reload. Actual saved scores40→73; no automatic desktop rescoring. Five segments,5px high; change chips12px with3px9px padding; visible arrow.
- Phone swipe labels: Interview, Crib sheet, Application help, CV fix, Tests, Assessment centre, More. More goes to Practise. Desktop retains its existing layout; user will revisit its visual design later.
- Closing soon filters big-name front-office roles; excludes tech/data/operations. Only verified eligible rows, even fewer than3. Current saved seed is Deutsche Bank RISE Investment Banking & Capital Markets, closes29Nov2026, sourced from official application table. Older Barclays technology/Lloyds data/HSBC relationship-management seeds were removed.
- Logo provenance from stored practitioner biographies, sent to user for confirmation: UBS—Kayyor Rao and Neil Robertson; Commerzbank—Kayyor Rao; Barclays—Jim Staples; J.P. Morgan—Peter Cheley; EY—Chris Sharkey. Do not treat these as newly independently verified biographies.

## Checks and files
- Broader focused suite45passed; final upload/navigation/entry suite19passed. Showcase fingerprint matches current scorer.
- New areas: `assessment-targets.js`, `assessment-targets.css`, `lib/assessment-targets.mjs`, `lib/assessment-target-store.mjs`, `api/assessment-targets.js`; phone button in `assessment-phone-entry.js/.css` and `assessment-submit.js`.
- Tests: `tests/assessment-targets.test.mjs`, `tests/assessment-quiz-intro.test.mjs`, `tests/phone-cv-upload.test.mjs`, `tests/explore-deadline.test.mjs`.
- Original PC proof: `C:/Users/Home/Documents/Codex/output/free-flow-polish-25nov/cv-next-live-phone.png`. Screenshots are local, not guaranteed present on laptop; live site and repository are the shared sources.
- Still outstanding: real phone microphone/transcription verification, news-source rebuild/Marketaux pilot. Do not claim those completed.

---
# Historical notes (superseded where they conflict with START HERE)

# Handover — 25 November 2026

Branch: codex/sidebar-consistency. Always fetch before work on either PC; do not overwrite newer remote changes.

## Latest batch
Explore showcase: samples/amelia-interview-showcase.json stores the real weak answer, actual rewrite returned by production /api/free-tasters, and both scored submissions. Actual scores: 40 to 73. User explicitly approved sending these illustrative CV-derived sample answers to The Desk live Anthropic-backed scorer. No contact details sent.
Phone Explore: hero, weak/strong sample showcase, Closing soon, AMA. Desktop retains full shared dashboard and three tool cards; showcase replaces QOTD there too. QOTD remains on assessed non-explore dashboards. Do not simplify desktop again.
Scorer fingerprint is verified by scripts/build-amelia-showcase.mjs --check (Vercel build command). To refresh after scorer changes, deploy changed scorer first using a temporary approved deployment workflow, run generator against that scorer with SHOWCASE_BASE_URL, commit refreshed scores, then publish. Never invent scores.

## Validation
4 showcase tests and 7 shared-dashboard tests passed. Live scorer run completed. Published and verified: implementation commit ac1b67f; deployment dpl_APMkhv1xnVdDqBy8mie9nfydJTYs READY and aliased to thedesk.vercel.app. At 390x844 showcase height494px, no horizontal overflow, animation revealed, no QOTD. CTA tested through CV choice to fixed analysis question. At1280x800 all three desktop tool cards remain. Proof screenshots are on original PC under Documents/Codex/output/free-flow-polish-25nov/amelia-weak-strong-phone.jpg and explore-showcase-full-phone.jpg. User approved public GitHub/site publication of illustrative transcripts and scores.

## Preserved work
Full member-style Explore dashboard restored after unwanted simplification. Three cards: Interview coach, Assessment centre, Application help. Interview help, news/AMA row, Community retained on desktop. Hero sample-report link spacing fixed.
Crib: Use own CV or sample; dropdown Barclays available, other firms grey Member. Amelia saved Barclays sample full and PDF; own free document introduction only, remaining placeholder blur.

## Outstanding
Real iPhone microphone not physically verified. Newsflow source rebuild and seven-day Marketaux pilot are not complete. Do not claim those done.


## Latest steering after showcase (25 November)
Phone Explore final: dark hero, heading What a strong answer looks like, collapsed weak sample with See it fixed reveal (session remembered), six 130px swipe tool tiles plus More, three verified big-name deadlines, one firm-logo / Kayyor AMA card. No made-up practitioner photos. Sample proof has no large CTA on phone; revealed text links to assessment. Current scores remain40/73 from real endpoint. Tool names: Interview, Crib sheet, Application question help, CV line fix, Tests, Assessment centre. Standalone Group exercise removed; it remains in Assessment centre hub. More opens /desk-section.html?view=practise (verified).
Desktop uses six tiles in3x2; user is rethinking this section, leave alone beyond requested label changes. Desktop stray QOTD race fixed; assessed dashboards keep QOTD. Membership CTA centred (verified).
Official-source deadline supplement: data/explore-verified-deadlines.json, expires naturally by date, Barclays27Nov/HSBC29Nov/Lloyds29Nov verified25Nov. See sources in each row; no fake countdowns. Existing tracker API had only Aon dated.
Phone spacing verified390x844: 1334px total closed (~1.6screens), no horizontal overflow; team/event159px, deadlines223px, toolrow161px. Reveal remembers open. Proof at output/free-flow-polish-25nov/phone-tools-bottom-tight.jpg. Latest minor tile rename deployment pending; inspect latestVercel before reporting live. Previous verified live implementation e369731.

Latest verified release: implementation6ae52c1, deploymentdpl_zWwqrj27jLqyeZrM78Gj1fBXD7JA READY/productionalias. Browser verified Community has no explorePrompt. Tool labels verified: Interview / Crib sheet / Application question help / CV line fix / Tests / Assessment centre / More. Standalone Group exercise tile removed. Handover-only commits may follow without redeploy.

Latest phone corrections (supersedes earlier reveal instructions): starts COLLAPSED on every load (user corrected "not expanded"); reveal link retained, no remembered-open restoration. Removed Amelia first-try subtitle and Sample built from Amelia copy; retained Find the weak lines in yours link. Phone hero Start arrow label and personal finance careers coach tagline. Kayyor photo in phone AMA row. Desktop scores static40/73. Saved sample crib has3second preparing state (verified loader then PDF result). Latest verified implementation cc85e87; deployment dpl_5kdP2PzxCHEwgovM862nCasZnPFj READY and aliased. Browser verified390x844 collapsed=true, retained link after tap, photo assets/kayyor-rao.jpg. Final screenshot output/free-flow-polish-25nov/phone-ama-with-photo.jpg.

Latest release bd07bd9 (dpl_CsWtcaGwiTFeGXJQdjh2XDjW8cAp READY, production alias verified): homepage bottom CTA Explore more -> /my.html?explore=1, route-picker no longer overwrites it. Free report/CV nav always assessment-start; assessment profile/CV steps offer See a full sample report linking fullcycle.html?sample=amelia (no cvonly); browser clicked through and verified full Amelia sample. Trial assessment hub scoring blur has Full scoring guide / Unlock with membership card, sticky only from first locked rubric row to section bottom. It is injected server-side for nonmembers only; return URL assessment-centre after upgrade. Browser verified CSSsticky,6rows, bounding atscrollY1475; screenshot scoring-membership-unlock.jpg. Phone CV entry screenshot phone-cv-full-sample-option.jpg. Nav4 and phone-entry10 tests passed; syntax checked gateway.


## 25 Nov — assessment aims first + 15:45 homepage polish
- New four-phase assessment: aims (six routes, optional up to three firms) → CV → numerical → commercial. Profile legacy IDs retained hidden for compatible scoring; education is not invented. Name remains on review.
- Targets persist immediately in browser and through scoped `/api/assessment-targets`; own tool contexts and dashboard profile consume them. Amelia sample remains Barclays. Consulting explicitly uses commercial fundamentals (not a case test).
- Step views/completions now map numerical to 3, commercial to 4; pagehide records step_left.
- Homepage bottom CTA: See inside before you start / sample CV no sign-up / Explore The Desk: it's free / or start assessment. Live root source uses assessment instead of review.
- Phone Explore full-width assessment CTA, 5px proof meters, 12px change chips; Application help label. Deadline rows show firm names. Big-name eligible front-office filter excludes tech/data/operations/relationship management. Existing verified seed contains none eligible, so no fabricated deadlines.
- Practitioner logo provenance from data/home-practitioners.mjs: UBS Kayyor Rao + Neil Robertson; Commerzbank Kayyor; Barclays Jim Staples; J.P. Morgan Peter Cheley; EY Chris Sharkey. Awaiting user confirmation of stored biographies.
- 31 focused tests pass; scorer fingerprint unchanged. Local phone UI verified at390×844 (aims fits screen, Barclays personalised CV and bottom nav visible). Deployment and final production evidence recorded in chat.

Deadline follow-up: official Deutsche Bank UK application table confirms 2027 RISE Investment Banking & Capital Markets closes29Nov2026; saved as the eligible front-office seed. Removed the three tech/data/relationship-management seeds. Source https://careers.db.com/students-graduates/your-application/ . Show only verified eligible rows, even fewer than three. Final focused suite45pass.

Production verification: e981ed49241603e2f0fe3163e7c60ce055844afb READY, deployment dpl_5i1T2ZELPiYugWRKL1R5Zz7Fwszp, alias thedesk.vercel.app. Browser verified persisted target API ib/Barclays, personalised CV Step2 + bottom toolbar, full-width Explore CTA, collapsed proof on reload,5segments/5px,12px chips/3px9px, no viewport overflow. Live closing row Deutsche Bank RISE Investment Banking & Capital Markets4days. Homepage bottom CTA and pricing copy verified.

## Phone CV Next-button fix (user follow-up)
853c35c: removed the CSS rule hiding actions until extraction. CV step now keeps a fixed Next: short tests action above phone nav; disabled until readable CV+consent, Reading your CV while busy. Upload finally dispatches desk:cv-state after clearing busy to prevent stale phone readiness. Local390×844 UI verified; upload lifecycle regression test passes. Deployment dpl_CJDSXAA6on2W8QTK6JbQ4kgSc5c9 READY on thedesk.vercel.app; live390×844 CV screen verified with Next fixed above toolbar. Screenshot C:/Users/Home/Documents/Codex/output/free-flow-polish-25nov/cv-next-live-phone.png.


---

# Earlier laptop verification snapshot (implementation ee2b84d)

## Start here on either PC

- Repository: https://github.com/raokayyor/thedesk
- Working branch: `codex/sidebar-consistency`.
- At the start of future work, fetch the remote branch, read this file and `AGENTS.md`, inspect status, and compare local and remote history. Preserve uncommitted work; reconcile divergence safely. Never force-push.
- After each completed batch: run relevant checks, review the diff, update this handover, commit, push this branch, verify the remote SHA, and report it. Never commit secrets. Distinguish pushed from deployed; verify readiness before calling a requested deployment live.
- Work on the user's local computer, not a cloud workspace. The laptop checkout is `C:\Users\raoka\Documents\Codex\thedesk`; use the other PC's own checkout path there.

## Earlier batch: laptop setup and crib sheet verification

### Changes and reasons

- Cloned the repository on the laptop and checked out the requested branch at the exact requested commit.
- Read repository guidance, including `CODEX-ALL-24NOV.md`, the other root `CODEX-*.md` files, and `design/CODEX-INTERVIEW-PHONE.md`.
- Verified the existing crib sheet implementation; no application code or sidebar changes were needed in this batch.
- Added this handover and root `AGENTS.md` to preserve the user's cross-PC workflow for future sessions.
- Saved phone screenshots and the rendered PDF under `docs/verification/crib-laptop/` so evidence travels with Git.
- Node 24.17.0 and npm 11.13.0 are available. Installed dependencies locally with `npm install --ignore-scripts --package-lock=false --no-audit --no-fund`; no lockfile or manifest changes. There is no committed lockfile, so `npm ci` is not currently usable.

### Revision at the earlier verification

- Branch: `codex/sidebar-consistency`.
- Latest implementation commit: `ee2b84db18b3e14416903ed1c2fab0ddf6ac7ede` (`Show trial crib firms in dropdown with member options`).
- This batch adds documentation/evidence only. Its final commit is discoverable with `git log -1` after fetching; the final response reports the pushed SHA.

### Checks and results

- `node --test tests/document-preview.test.mjs`: **4 passed, 0 failed**, after dependency installation. Covers source-grounded Amelia content, fully open sample sections, placeholder-only own-CV previews, shared paper layout, and the single-page PDF.
- Live browser at **390 x 844**, `/ac-crib.html?trial=1`:
  - Entry retains **Use my CV** and **Continue with sample CV**.
  - Firm dropdown shows Barclays selected; other firms appear grey with **Member** badges. These member options are upgrade triggers, not native disabled options; they do not select a different trial firm.
  - Amelia's saved Barclays document opens all **6 sections**, with **0 locked sections** and **0 blurred elements**.
  - DOM measurements: viewport **390 x 844**, document width **390** (no sideways overflow).
  - Existing phone navigation remains visible. No navigation source files changed.
  - **Download PDF** downloaded successfully from `/samples/amelia-barclays-crib.pdf`.
- Downloaded PDF: `pdfinfo` confirms **1 A4 page** (595.28 x 841.89 points). Rendered and visually checked: all sections fit, no clipped content. Poppler emitted missing display-font warnings for Symbol/ArialUnicode; the rendered English document remained legible and complete.
- Own-CV server response path reviewed: `api/free-try.js` applies `freeDocumentPreview` for non-member, non-sample saved/new results, and `lib/document-markup.mjs` uses the same paper layout with an open introduction plus five placeholder sections. Sensitive full content is not used as blurred placeholder text.
- `git diff --check` passed before handover creation; repeat after editing and before committing.
- Full application suite was not run: this batch changes documentation/evidence only.

### Deployment at the earlier verification (superseded by current status above)

- Vercel's authenticated deployment lookup for **thedesk.vercel.app** confirmed:
  - **Production / READY**, deployment `dpl_Eg4W7Dopj2Mi4KjY7yqrb6jRbv4y`.
  - Deployed implementation SHA: `ee2b84db18b3e14416903ed1c2fab0ddf6ac7ede`.
  - Immutable deployment: https://thedesk-cl6c2oa4n-raokayyor.vercel.app
  - Production crib sheet: https://thedesk.vercel.app/ac-crib.html?trial=1
- No new deployment was created by this batch. Do not describe the new handover/evidence commit as deployed merely because it was pushed. Recheck Vercel if reporting its deployment later.
- Push target for this batch is `origin/codex/sidebar-consistency`; verify the server's branch SHA after pushing. No force-push.

### Evidence

- [CV choice, 390 x 844](docs/verification/crib-laptop/crib-cv-choice-390x844.jpg)
- [Firm dropdown, 390 x 844](docs/verification/crib-laptop/crib-firm-dropdown-390x844.jpg)
- [Sample paper document, 390 x 844](docs/verification/crib-laptop/crib-sample-390x844.jpg)
- [Full sample phone document](docs/verification/crib-laptop/crib-sample-full-phone.jpg)
- [Rendered one-page PDF](docs/verification/crib-laptop/crib-pdf-page.png)
- The downloadable PDF is already tracked at `samples/amelia-barclays-crib.pdf`.

### Outstanding work and limitations

- **Supporting crib check still outstanding (follow the newer priority above first):** sign into an authorized free account that already has its own assessment/CV, then exercise build/save/reload at 390 x 844 and capture the own-CV document. This session's live browser was signed out; no real account's own-CV journey was tested.
- Own-CV placeholder behavior passed automated checks and code review. A synthetic local layout fixture was attempted, but the in-app browser timed out connecting to the local server even after starting it outside the restricted shell. **No own-CV browser screenshot or authenticated end-to-end pass is claimed.** Do not change network/security settings to bypass this.
- No full member account journey or desktop screenshot was required for the current phone check; preserve the existing sidebar.
- An older `tests/crib-trial.test.mjs` targets the legacy static page and has expectations that do not match the current Amelia fixture. It was read but not run or changed in this batch; the active public route is rewritten through `api/tool-entry.js` to `trial-tool.html`.
- Initial test attempt happened during dependency installation and failed on an incomplete `pdf-lib` tree; rerun after installation passed all four tests. A Python PDF-render attempt lacked `fitz`; system Poppler was used successfully instead.

## User decisions from this chat

- Keep the current sidebar.
- Phone crib dropdown: Barclays available; other firms grey and labelled **Member**.
- Keep **Use my CV / Continue with sample CV**.
- Amelia's saved Barclays sheet is fully open, uses a printable one-page paper document, and offers PDF download.
- Own-CV free sheets use the same layout, with only the 30-second intro open and placeholder blur elsewhere.
- Test at 390 x 844 and send screenshots.
- Confirm actual deployment readiness before saying changes are live.
- Keep work easy to continue from the other PC through the mandatory fetch/read/check/handover/commit/push routine above.
