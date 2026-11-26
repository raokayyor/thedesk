# The Desk handover

## Start here on either PC

- Repository: https://github.com/raokayyor/thedesk
- Working branch: `codex/sidebar-consistency`.
- At the start of future work, fetch the remote branch, read this file and `AGENTS.md`, inspect status, and compare local and remote history. Preserve uncommitted work; reconcile divergence safely. Never force-push.
- After each completed batch: run relevant checks, review the diff, update this handover, commit, push this branch, verify the remote SHA, and report it. Never commit secrets. Distinguish pushed from deployed; verify readiness before calling a requested deployment live.
- Work on the user's local computer, not a cloud workspace. The laptop checkout is `C:\Users\raoka\Documents\Codex\thedesk`; use the other PC's own checkout path there.

## Latest batch: laptop setup and crib sheet verification

### Changes and reasons

- Cloned the repository on the laptop and checked out the requested branch at the exact requested commit.
- Read repository guidance, including `CODEX-ALL-24NOV.md`, the other root `CODEX-*.md` files, and `design/CODEX-INTERVIEW-PHONE.md`.
- Verified the existing crib sheet implementation; no application code or sidebar changes were needed in this batch.
- Added this handover and root `AGENTS.md` to preserve the user's cross-PC workflow for future sessions.
- Saved phone screenshots and the rendered PDF under `docs/verification/crib-laptop/` so evidence travels with Git.
- Node 24.17.0 and npm 11.13.0 are available. Installed dependencies locally with `npm install --ignore-scripts --package-lock=false --no-audit --no-fund`; no lockfile or manifest changes. There is no committed lockfile, so `npm ci` is not currently usable.

### Branch and implementation revision

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

### Deployment status: separate from Git push

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

- **Next step:** sign into an authorized free account that already has its own assessment/CV, then exercise build/save/reload at 390 x 844 and capture the own-CV document. This session's live browser was signed out; no real account's own-CV journey was tested.
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
