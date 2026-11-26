# Working on The Desk

Read `HANDOVER.md` before starting work. Fetch `origin/codex/sidebar-consistency`, inspect the working tree and compare local/remote history before updating the checkout. Preserve uncommitted work; resolve divergence safely. Never force-push or commit secrets.

Read the relevant `CODEX-*.md` guidance, particularly `CODEX-ALL-24NOV.md`. Preserve the existing sidebar unless the user explicitly requests changes. Run this user's work on their local computer, not a cloud workspace.

After each completed batch:
1. Run relevant checks and review the diff.
2. Update root `HANDOVER.md` with changes and reasons, branch/latest implementation commit, checks/results, pushed versus deployed status and URLs, outstanding work/issues/next step, and new user decisions.
3. Commit the batch and handover, then push to `origin/codex/sidebar-consistency` without force.
4. Verify the push and report the final commit SHA. If deployment is requested, verify the intended deployment is READY and serves the intended revision before calling it live. A successful push is not deployment confirmation.

The handover's latest implementation commit may precede its documentation commit. Do not try to put a commit's own SHA inside itself; report the final batch SHA after pushing and use Git history to identify the handover revision.
