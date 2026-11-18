# Handover to Codex: My Desk, membership, tests, library, trading game

Branch: `claude/assessment-test` (GitHub: raokayyor/thedesk). Built on `origin/codex/hirevue-value-release-nov5` (commit 2494599).
Nothing has been pushed to `main` or deployed to production.

## Read this first: production is ahead of GitHub

The live site (thedesk.vercel.app) contains interview work that was deployed from Codex and never pushed to GitHub
(for example interview-answer-builder.js, interview-audio-capture.js, interview-live-transcript.js,
interview-navigation.js, interview-practice-modes.js, interview-recording-*.js, interview-spacing.css,
interview-training-layout.js, lib/interview-frameworks.mjs, and changed versions of interview.html, interview-bank.js,
interview-session*.js, hirevue-guide.js and others). **If this branch is deployed to production as it is, that live
interview work is lost.**

### Order of work

1. **Push live first.** From your workspace, commit exactly what is deployed to production today and push it as a new
   branch, e.g. `codex/live-2026-11-09`. Don't change anything in this step.
2. **Integrate.** Create `integration/my-desk` from that live branch and merge `claude/assessment-test` into it.
   Rule for every conflict: **keep the live behaviour, then add the small change from this branch on top** (listed below).
3. **Check on a Preview deployment** (checklist at the end), then deploy to production.

### Small edits this branch makes to existing files (re-apply on top of live if they conflict)

| File | Change |
|---|---|
| `interview.html`, `interview-start.html`, `tracker.html`, `result-final-design.html`, `fullcycle.html` | Add `<script src="/desk-nav.js" defer></script>` before `</head>` (shared top bar). |
| `fullcycle.html` | **Bug fix:** the Word-CV download built a string containing `<script src="/desk-me.js" defer></script></body></html>`, which ended the page's inline script early and left the report stuck on "Loading your saved assessment…". The string now ends `'</body></html>'` and the desk-me tag sits before the real `</body>`. Also: in `progress()`, save `{id, done, tot}` to `localStorage['desk-progress']` (My Desk shows it). The live version didn't have this bug when checked, but keep the progress line. |
| `fullcycle-plan.html`, `result-final-design.html` | Price copy: "£89 a year" / "Membership · 12 months"; "Rechecks all year (up to 12)". |
| `api/analyse-mot.js` | Rechecks: 365 days and up to 12 (was 30 days and 2). Message text updated. |
| `api/assessment-result.js` | Same: recheck window 365 days, `12 - rechecks_used`. |
| `api/interview-feedback.js`, `lib/interview-feedback.mjs`, `interview-feedback.js` | **Free = 30-second teaser:** `FREE_PER_WEEK = 1` (counted over 7 days from saved items, plus the existing per-device daily cap); free answers are cut to the first ~90 words / 30 s, follow-ups return 402, and the response keeps one strength and one fix with `teaser: true`. Front-end copy: "left this week". Members unchanged (60 a day). |
| `lib/value-accounts.mjs` | New helper `countItems(p, kind, days)`. |
| `lib/practitioner-questions.mjs` | `PRACTITIONERS` adds `'Chris Sharkey'` (he's on the panel shown in the report). |
| `tracker.html` | Shortlist (`localStorage desk_mylist`) also syncs to `/api/desk-home` (`tracker-sync`) and is pulled back if the browser has none. |
| `vercel.json` | `api/test-run.js` maxDuration 300. |
| `interview.html`, `interview-start.html` | Add `<script src="/interview-firm-packs.js"></script>` **straight after** `<script src="/interview-bank.js"></script>` (must run before the firm list is built). |
| `interview.html` | Add `<script src="/interview-interviewer.js" defer></script>` after the coach layer tag. |
| `interview-start.js` | Reads `?firm=` (e.g. from My Desk application rows) and preselects that firm. |
| `interview.html` | Add `<script src="/interview-coach-layer.js" defer></script>` before `</body>` (loaded last). Written and tested against the **live** interview page (it reads `#question`, `#questionType`, `#cvText`, `.qbox`, `#answerCvEvidence`). |

## What's new (all on this branch)

### My Desk (`my.html`, `api/desk-home.js`, `desk-nav.js`)
- **One home page** for members and free accounts; the same top bar on every student page:
  My Desk · Report · Interview · Tests · Trading · Tracker · Library · News.
- **Readiness score that only moves on evidence:** assessments and rechecks, plus tests (each section counts the
  best of the last 3 results; the assessment's own quiz counts as the first). Interview scores are shown separately.
- **Next 3 actions** from deadlines, report/priority, tests and interview practice.
- **Practitioner layer:** panel band (5 practitioners, route lead highlighted, ask-the-panel status, call link),
  practitioners' notes on actions, "Advice our practitioners disagree with". Notes come only from **approved**
  knowledge items (`desk_knowledge`), with the approver's name. Nothing shows until practitioners approve points.
- **Applications:** one list with the tracker shortlist plus firms added by hand; add a whole group (e.g. all Big Four)
  or one programme; stage changes; deadline flags; 5 shown with "Show all".
- **Members** link straight to their Full Cycle report and to the interview coach with their assessment loaded
  (`/interview-start.html?id=…`).
- **Free accounts:** assessment result, a sample member report (`/fullcycle.html?sample=amelia`) and a weekly
  30-second interview check. Tests, applications, news and practitioner notes show locked. The trading game is open to all.

### Tests (`tests.html`, `/api/desk-home?view=test&section=…`)
- Numerical, Commercial & technical (10 each) or Mixed (5+5), fresh questions from `data/numerical.json` and
  `data/technical.json` (2,064 questions), answers withheld until marked, working shown for misses. Members only.

### 30-second interview check (`interview-teaser.html`)
- One question ("Why <firm>?" if known), 30-second timer, browser speech-to-text (typing fallback), then a short
  read with one strength and one fix, and the member upsell.

### Library (`library.html`)
- Applications, online tests, interviews, 14 brain teasers with answers, market basics, firm guides, get help. Search box.

### Trading game (`trading.html`, `trading-admin.html`, `api/game.js`, `lib/trading-game.mjs`)
- **Real markets, simulated prices.** 125 investments: ~80 big UK (FTSE 100) names, 32 big US names, FTSE 100/250,
  S&P 500, Nasdaq 100, Bitcoin, Ethereum, Brent, gold, copper, GBP/USD, GBP/EUR, EUR/USD, UK 10-year gilt.
- Everyone gets £100,000 and up to 10 investments; part-units allowed; league table.
- Staff "news desk" publishes the day's stories (19 presets or custom). Each story moves risk appetite, asset groups,
  sectors and/or one company; prices move on publish with volatility-scaled noise. Each story has a "why it moved"
  signed by a practitioner.
- Staff set starting levels when a game starts (paste `TICKER price` lines). Defaults are placeholders.
- A running game automatically gains any investments added to the list later.

### Interview coach layer (`interview-coach-layer.js`)
- Under each question: **"Your CV for this question"**, the 3 CV points that best answer it (best point from each experience first),
  key words highlighted, why each works, a "check the detail" flag on lines with `[CONFIRM: …]`, and the full CV with the points marked.
  Re-picks on every question; pre-selects the best example in the existing answer builder.
- **"What the interviewer is listening for"**, by question type, credited to the practitioner panel.
- Calmer page: smaller hero, slimmer session bar, shorter transcript column (scoped CSS, `body.dc-on`).

### Trading game extras
- Bid/offer spreads (buy at offer, sell at bid, holdings valued at bid), cash earns Bank Rate interest each news day
  (BoE stories move the rate; staff can set it), stop losses, average price paid and P&L per holding, trade ticket.
- News desk: live BBC/Guardian business headlines (RSS) with "Turn into a story" (AI draft of text and moves; staff edit and publish).
  New table columns: `desk_game.cash_rate`, `desk_game_accounts.stops`, `.costs`, `.interest`.

### Weekly challenge (`challenge.html`, `challenge-admin.html`, `api/challenge.js`)
- Earlier format (weekly scenario, split £100k, staff score from public weekly moves). Still works but no longer in the
  top bar; the trading game replaced it. Remove if not wanted.

### Staff test runner (`test-compare.html`, `api/test-run.js`, `samples/test-personas.json`)
- Runs 10 fictional students through the real free assessment and Full Cycle and shows free vs paid side by side,
  with "Open free results page" / "Open paid report page" as that student. Preview deployments skip the staff key
  (they're behind Vercel login); production needs it.

### Firm interview packs (`interview-firm-packs.js`)
- Adds BlackRock, Rothschild & Co, Lazard, Evercore, Morgan Stanley, Citi, HSBC, Deloitte and KPMG to the firm list, and a pack for every firm
  (including the existing J.P. Morgan, Goldman, Barclays, UBS, DB, BofA, EY, PwC).
- Each session for that firm gets: the firm's own "why us" question, a firm case for the role, and two firm questions inserted after
  question 5 (so `applyContext`'s positional edits still line up). Tagged "Likely at <firm> (The Desk's view)".
- A "Your <firm> interview" brief card: what that firm's interviews test, things to know, and **what recent candidates reported** (format, topics with report counts, source links; from public reviews, Nov 2026). One question per session comes from candidate reports where we have them.
- `FIRM-PACKS-REVIEW.md`: sign-off sheet for the practitioners. Get it approved before launch.
- Wraps `DeskInterviewBank.buildSession`; works with the live and GitHub bank (same API, checked on live).

### Interviewer layer (`interview-interviewer.js`)
- AI interviewer tile on the video (firm initials, "Asking the question" / "Listening to your answer" / "Waiting", real voice and mic levels),
  live captions in step with the voice, and a tools bar: Captions, Framing guide (eye line), Mirror, mic level, which voice is used.
- Hooks: `.camera`, `#preview`, `#camStatus`, `#voiceStatus`, `#question`; detects ElevenLabs audio, device speech and MediaRecorder.
- `ELEVENLABS_API_KEY` is set on Production but **not Preview**; add it to Preview to hear the natural voice there.

### Sign-up page (`signup.html`)
- Three plans: Free, Member (£89 a year, paid once), 1:1 with a practitioner ("Talk to us", no price shown yet), plus a
  societies enquiry. Compare table and FAQ.
- Free: saves university/year/aim/society (`/api/desk-home` action `signup-profile`, kind `signup`) and emails a sign-in link
  (`/api/value-account` `request`). Member: same, then Stripe checkout if they have an assessment, otherwise sends them to
  the free assessment first. 1:1 and societies: `coaching-interest`, stored under principal `leads:coaching`
  (no staff screen yet: `SELECT data FROM desk_value_items WHERE principal='leads:coaching' ORDER BY id DESC`).
- Link it from the homepage and the free My Desk ("Join" / "Become a member").
- **Pay in 3 (Klarna)**: `GET /api/start-checkout` reports whether Klarna is active on the Stripe account; the page only shows
  "3 payments of £29.67" when it is. Turn Klarna on in Stripe Dashboard → Settings → Payment methods (Checkout uses dashboard methods;
  the webhook already handles `checkout.session.async_payment_succeeded`). The Stripe product description was updated (it still said
  "two rechecks within 30 days").
- **Founding price**: `FOUNDING` in `signup.html`, empty = hidden. Only set it if the price really rises on that date.

### Assessment centres (`assessment-centre.html`, `ac-crib.html`, `group-exercise.html`, `api/assessment-centre.js`, `lib/assessment-centre.mjs`)
- Hub: firm picker showing what recent candidates reported (from the firm packs), the four exercise types and how people fail,
  "What the assessor writes down" (group-exercise scoring sheet, The Desk's draft for practitioner sign-off), night-before / on-the-day checklists.
- **Crib sheet** (members): one printable A4 page built by Claude from the student's own CV (assessment `input.cvText`) for a chosen
  firm: 30-second intro, 6 STAR stories mapped to competencies (numbers only if they appear in the CV), questions to ask, likely probes,
  plus the firm's "tends to test" and reported formats. Saved as item kind `ac-crib`.
- **AI group exercise** (members): 3 fictional cases, 3 AI candidates (Dominic dominant, Priya quiet, Sam drifts) via a fast model
  (`GROUP_MODEL`, default claude-haiku-4-5-20251001); browser speech-to-text (Chrome/Edge) or typing; voices via ElevenLabs with one
  voice per character (`ELEVENLABS_GROUP_VOICES` = three comma-separated voice ids to override the defaults), device voice fallback.
  20-minute timer; the others carry on if the student is silent for 30 s. Feedback scored on 6 behaviours with exact quotes and
  measured stats (talk share, turns, invites, numbers). Saved as `ac-group`. Quotas: 400 turns, 10 feedbacks, 10 cribs, 300 voice lines a day.
- `lib/interview-voice.mjs`: `generateInterviewSpeech(text, {voice})` now takes an optional voice id.
- **Case study** (`case-study.html`, members): 2 fictional packs (Fenwick Tools takeover bid; Atlas Gyms expand vs pay down debt) with
  consistent numbers; 45-min timed write-up, 3-min presentation (camera preview stays on the device, speech-to-text in the browser),
  2 panel follow-up questions (Sonnet), then scored on 6 areas with "what you missed", fixes and a written model answer. Saved as `ac-case`.
- **Inbox exercise** (`inbox-exercise.html`, members): 15 emails in 30 min, priorities Now / Today / This week / Pass on / No action,
  3 traps (client asking for files to personal Gmail, phishing, confidential request across teams), a P&L with one error (EBIT),
  and two replies. Priorities and the error are marked by fixed rules; only the replies use AI. Model answer for every email. Saved as `ac-inbox`.
- All five tools are members-only server-side (402 for free); free users can read the hub, cases and inbox.
- Link the hub from My Desk (member tools) and the top bar's "More" menu. Library already links to it.

### New homepage (`home-preview.html` → becomes `index.html`)
- Rao has approved this as the new homepage. Replace the live `index.html` with it (keep the live footer links, analytics and
  the real practitioner photos from the live site; swap the initials for Kayyor's photo). Remove the preview version bar at the top
  and the `?v=` switch: use **version 1** only (headline "Find out why you’d be rejected, and let’s fix it before you apply.").
  Remove `<meta name="robots" content="noindex">`.
- Route buttons link to `/assessment-start.html?route=<key>`. **Carry `route` through to `/assessment.html` and preselect
  `#sector1`:** ib → "Investment Banking / IBD", markets → "Sales & Trading / Markets", am → "Asset Management / Investing",
  pe → "Investment Banking / IBD" (show a one-line note: "Most private equity careers start in investment banking: we’ll score you
  for that"), corporate → "Corporate Banking", big4 → "Accounting / Audit", insurance → "General Finance", unsure → leave blank.
- The main button goes straight to the assessment (not My Desk); "Or look around first" goes to My Desk. Logged-in users who
  already have an assessment should get "Go to My Desk" as the main button instead.
- Practitioner quotes in Kayyor's name are his to edit before launch.

### Result page options (`result-simple.html`, `result-hook.html`, `api/result-rewrite.js`)
- Two shorter versions of the free result page to test with students against `result-final-design.html`. `result-hook.html`
  (Rao's current preference) shows an estimated score route (e.g. 54 → 62–68, 30–50% of the points lost in each area, max 5 per gap,
  always labelled as an estimate), points per gap, a free "fix it now" rewrite of the weakest CV line (`POST /api/result-rewrite`,
  owner only, 3 a day per assessment, Haiku, only facts from the line and the student's answer), the next two gaps with reasons and
  the fix locked, and "a question <firm> could ask you" from the CV. Don't make either the default until Rao decides after testing.

## New database tables (created automatically on first use)
`desk_test_runs`, `desk_challenges`, `desk_challenge_entries`, `desk_game`, `desk_game_prices`, `desk_game_events`,
`desk_game_accounts`, `desk_game_trades`. Saved items reuse `desk_value_items` with kinds `test`, `test-pending`,
`application`, `shortlist`.

## Environment variables
- `PRACTITIONER_SUPPORT_KEY`: staff pages (news desk, challenge, knowledge, outcomes). Set for **Production and Preview**.
- `ANTHROPIC_API_KEY`, `DATABASE_URL`: as before (needed on Preview for the test runner and tests).
- `RESEND_API_KEY` + `EMAIL_FROM`: sign-in links (My Desk shows "keep your desk on every device").
- `CALL_URL` (optional): practitioner call link shown to members.

## Preview checklist before production
1. Free browser: `/my.html` shows assessment / 30-second check / sample report; tests return 402; the teaser marks once a week.
2. Member (use `/test-compare.html` → Open paid report page): My Desk shows report, interview (with `?id=`), tests,
   applications, practitioner panel; "Open your report" opens `/fullcycle.html?id=…`.
3. `/tests.html?section=numerical` marks 10 questions and updates readiness.
4. `/trading-admin.html`: start a game with real levels, publish a story; `/trading.html` buys and sells, league updates.
5. Live interview pages still behave exactly as before (the live work you pushed in step 1), with the new top bar.
6. Run `node --test tests/` with dependencies installed.

## Copy fix: no "hiring side" claims (12 Nov)
Kayyor's 20 years are in banking, not in hiring. Don't claim the team "has hired" until a practitioner who did hire (or an HR/recruiting person) is on the panel and has confirmed it.
- Already changed on this branch: home-preview.html, tools.html, signup.html, result-hook.html, result-simple.html.
- Live pages to change too:
  - index.html + homepage-translations.json `expertise`: "Built on experience from the hiring side of the table." → "Built on 20 years' experience inside finance."
  - mentor.html Kayyor bio: drop "Has hired, assessed and mentored candidates…" and check the firm list (says Barclays; elsewhere UBS · Commerzbank · BGC · Knight · Stifel).

## Pricing: three tiers + practitioner photos/logos (12 Nov)
- **Tiers** (signup.html, home-preview.html price section): Free · Member £89 · **Member + Practitioner £199** (two 30–45 min calls: CV/applications review, then a mock interview or AC prep, written notes) · 1:1 support £3,000. The old £399 "Membership + Coaching" is gone everywhere.
  - £199 is a placeholder until practitioner call pay is agreed. Every place it appears has `data-plus-price`, so it's one find-and-replace.
  - No Stripe product yet: `plan=plus` goes through the existing `coaching-interest` form (desk-home.js now stores `type: 'plus'`), and we email a payment link by hand. Later: add a Stripe price, plus "upgrade by paying the difference" (£110) from My Desk for existing members.
- **People**: new `data/firm-logos.mjs` holds `PRACTITIONERS` + `FIRM_LOGOS`; the homepage renders the people grid from it. Kayyor's photo is at `assets/people/kayyor-rao.jpg`; the others show initials until their photos arrive (add `photo:` to their entry).
  - Logos: every value is `null` for now, so firm names show as text chips. To show a logo, drop an official file in `assets/logos/` and set the path. Use each firm's own brand/press-kit file, and keep the footer line "Firm names and logos show where our practitioners previously worked… not endorsed".

## Homepage version C: calmer look + stronger hook (12 Nov) → `home-c.html`
Rao has approved this direction. Replace the live index.html with home-c.html. It's self-contained: it does NOT load public-polish.css or mobile-home.css, so drop those from the homepage only.
- **Look:** EB Garamond for headlines and Figtree for text (Google Fonts). Dark ink buttons with 8px corners instead of orange pills, background #f4f1ec, small grey uppercase labels. Orange (#c4562a) is used only for score numbers and small accents.
- **Hero:** headline unchanged. New line under it: "140 applications for every graduate job, the most ever recorded" (ISE Student Recruitment Survey 2025, footnoted). The "This is where I'd stop reading" red-pen card with Kayyor's photo now sits top right, above the sample card, so it's the first thing people see. The button stays above the fold on desktop and phone.
- **Sample card changes with the route chosen:** IB/PE/corporate → Jamie, markets → Priya, AM → Tom, Big Four/insurance → Aisha. All illustrative, and the footer says so.
- **ChatGPT section:** heading "Don't let a chatbot decide your future." Adds the ISE stat that 48% of employers think candidates' AI use misrepresents their abilities. Table cut to 4 rows. "Sat on the other side of the table" removed.
- **People:** Kayyor large with photo; the other four as a text row with no initials circles. Logos sit in a fixed 72×22 box, greyscale at 72% opacity, so they all look the same size. It reads `/data/home-practitioners.mjs` (live) and falls back to `/data/firm-logos.mjs`.
- **Pricing:** same three tiers. On phones, Member shows first.
- **Photo:** uses `/assets/kayyor-rao.jpg` and falls back to `/assets/people/kayyor-rao.jpg`.
- Same fonts and button style later for signup.html, tools.html and My Desk, so the site feels like one place.
- **Logo sizing fix (after reviewing preview thedesk-3ralh6er8):** a fixed 72×22 box still made Commerzbank, Lancashire and EY tiny (their files have a lot of built-in whitespace or a very wide shape). home-c.html now sizes each logo to the same visual area (`sizeLogo`, height = √(1150/aspect), clamped 13–26px) with per-file corrections in `BOOST`. Take the updated home-c.html.
- **Headline weight:** Rao wanted headings a bit bolder. Garamond headings, the logo, names and prices are now weight 600 (Rao chose semi-bold; the Google Fonts link loads 600). Italic quotes stay 400.
- **Sample reports linked (12 Nov):** home-c.html links Amelia Chen's existing samples. Free report: `/amelia-result.html`. Member report: `/fullcycle-amelia.html`. Links appear under the sample card ("See a full sample report: Free · Member"), under the hero button ("see a sample report first") and on the £89 tier ("See a sample member report →"). Add the same two links to the signup.html comparison table. Before promoting them, fix these on the sample pages:
  1. fullcycle-amelia.html: replace the "V3 design preview" tag and the internal disclaimer with one line, "Fictional sample student. Your report is built from your own CV." Also hide or rename "Start your own assessment →" so it points to /assessment-start.html.
  2. fullcycle-amelia.html opens with "Check this first: your profile says 1st Year but your CV says final year." Make the sample profile and CV agree (penultimate year) so this warning doesn't show. It looks like a bug.
  3. amelia-result.html has no "sample" label. Add the same fictional-sample line at the top.
  4. The two reports disagree: free says 67/100, member says 71/100 for the same student. Make them match, or show the member report as a recheck after fixes ("67 → 71 after her first rewrites").
  5. Restyle both in the version C fonts and buttons.
- **Hero "red pen" card rebuilt (12 Nov):** the top-right card is now a 4-step story drawn by `redpen(route)` in home-c.html:
  1. a weak CV line with a verdict chip
  2. what Kayyor thinks reading it
  3. the question we ask and the student's answer, as a chat
  4. the same line rebuilt only from that answer, with the old line struck through, "+points", "How it reads now", and the 3 interview questions it now answers.

  The steps fade in one after another, which is switched off for users who prefer reduced motion. Default (and "Not sure yet") is the barista line; IB/PE/corporate shows the comps line; markets and AM show society treasurer; Big Four and insurance show the generic opener. The dark score card underneath no longer repeats the rewrite, and its default sample is Sam (49 → 55–60). **Kayyor to rewrite the quotes (the `read:` fields in `LINES`) in his own words before launch.** Every rewrite uses only facts from the student's answer. Keep it that way if you edit them.

## My Desk navigation: bottom tab bar on mobile, sidebar on desktop (13 Nov)
Design reference: `design/mydesk-tabbar-mock.html` plus the two PNGs next to it. The icons are simple inline SVG line icons; reuse them.
- **Mobile (<768px):** replace the "Your Desk ☰" top menu with a fixed bottom bar of 5 tabs: **Desk · Practise · Applications · Community · More**.
  - Each tab is an icon with a label. The active tab is ink-coloured with a small bar above it; the others are muted. A dot on Community marks new replies.
  - Allow for the phone's home bar (`padding-bottom: env(safe-area-inset-bottom)`) and pad the page bottom so the bar never covers content.
  - Hide the bar while an input has focus and during live interview, group, case or inbox sessions.
- **Group screens:** tapping a group tab opens a list of large tiles (icon, title, one-line description, chevron). Highlight whatever is urgent: e.g. "Interview coach · 2 days" in the warm alert style.
  - Practise = Interview coach, Group exercise, Case study, Inbox, Numerical tests, Crib sheet.
  - Applications = Tracker, Application help, Firm packs.
  - Community = Ask & answer, Trading league, Society Cup, Events.
  - More = Report, Library, News, Account.
- **Desk (home):** greeting, readiness score card (score, change since last check, progress bar, points to the next band), the next interview card with action buttons, and "Next three things" with the points each one is worth.
- **Desktop (≥1024px):** the same 5 groups as a left sidebar, with each group's sections listed underneath.
- **Header:** logo plus account initials only.
- **Style:** homepage version C throughout (EB Garamond 600 headings, Figtree body text, ink buttons with 8px corners, background #f4f1ec, orange only for scores and urgent items).

## Free result v2: free shows the diagnosis, membership is the fix (13 Nov)
Visual reference: `design/free-result-v2-mock.html` and `design/free-result-v2.jpg` (Amelia, at phone size). Rebuild result-final-design.html in this order. Every section gives the student a real, specific finding from their own data for free; what's locked is the fix (the rewrite, the model answer, the worked answer). Never lock a finding with nothing visible.
1. **Verdict:** "You'd get read, but not shortlisted yet." Then "Three things are holding you back. Fix them and you go from [score] to about [range]." Show the score with "after the fixes ~[range]", a band bar (Developing / 65 Borderline / 75 Competitive), and the five parts.
2. **"If you applied to [firm] today"** (dark card): a skim view of their own CV. Show their real headings, highlight in their actual text the 2–4 phrases a screener's eye lands on (the first words of each bullet, plus any negative endings like "No outcome was confirmed"), dim the rest, and add a handwritten-style margin note, e.g. "Research, but no result. Every line ends on what didn't happen. No leadership. Next." Label it "Illustrative, based on your CV". Below: 140 applications per graduate job (ISE 2025, footnoted), "[N] points below our competitive benchmark (75)", and "[N] days until [firm]'s deadline" only if a real deadline exists.
   - The margin note must come from the model's assessment of their CV, never a fixed string. Use a new short field `skimNote` (≤20 words) in the free assessment output.
3. **What a practitioner sees:** a balanced quote (one real strength, then what stops a shortlist), plus 2 ✓ strengths and 2 ✕ gaps.
4. **What's holding you back:** the 3 gaps ranked by points, each with a one-line reason from their data and a +points estimate.
5. **Fix one line now, free:** the line, "Why it's holding you back", one question, their answer, and the rewrite from `/api/result-rewrite`.
6. **Your CV:** "[N] more lines we'd change" (real count from `weakLines`). For each: the line's opening words in quotes, plus **"The problem:" in one sentence (free)**. The repaired line is blurred and locked.
7. **The 7 things interviewers score:** all 7 bars, with the weakest 2 coloured. For the weakest 2: a one-sentence finding (free), with the model answer locked.
8. **Your tests:** for each missed topic, what it is and why it's asked (free), with the worked answer and practice locked.
9. **ATS:** score plus what it means (free); matched terms as green chips and missed terms as red chips (show 1 missed term free, count the rest); which lines to add them to is locked. Compute the terms from the actual job and route vocabulary. Don't hard-code them.
10. **Feature tasters** inside sections (white cards with an icon and a "Members ·" label): the firm pack after the CV section; the interview coach with their weakest competency question after competencies; the 2,000+ test bank and the assessment centre tools after tests. Each one should be relevant to that section, not a generic advert.
11. **Offer (dark card):** "Go from [score] to about [range] before [firm] closes in [N] days" (drop the deadline part if there isn't one), then an 8-tile grid of what members get (CV repaired, interview coach, assessment centres, 17 firm packs, 2,000+ test questions, model answers, application tracker, ask a practitioner), "Unlock everything · £89", and "Paid once · no auto-renewal · 12 months". Below it: the sample member report, the £199 practitioner calls, and "Email me my result".
12. **Fixed bottom bar** throughout: "[score] → ~[range] · Unlock · £89".
- Lock buttons never show a price. Copy rules: British English, no invented facts, use only the student's own CV text.
- **Free result v2, upsell additions (13 Nov):**
  - **Feature tasters** now carry an "Added to your plan" tag. Add an **Application answers** taster after the free fix ("Now do the same for 'Why [firm]?'").
  - Add a **free Community card** before the offer: "You're not the only one applying to [firm]." Show 2 real recent Ask & answer questions for that firm or route, and only if they exist; otherwise show the card with no examples. Button: "Join the network free →".
  - **The offer becomes "Your plan, built from this result":** 10 ticked rows, each with a reason taken from this student's data. CV repair ("[N] more lines …"), model answers (two weakest competencies with scores), interview coach (the question for their weakest competency), application answers ("Why [firm]?"), test bank ([N] topics missed), firm pack ([firm]), assessment centre practice, tracker (only show "closes in [N] days" if a real deadline exists), ask a practitioner, 12 rechecks. Then "10 tools, all for your result. A CV rewrite alone usually costs around £99." If a reason has no data behind it, show the row without the reason. Never make one up.
  - The result should be that, by the bottom, each feature has already been linked to something specific in their result above.

## About page + "sounds like a machine" copy pass (16 Nov)
**About page:** add `about.html` (in the bundle; references design/about-page-*.jpg). Link it from the header ("About") and the footer on every public page.
- Before it goes live, Rao must confirm every [bracketed] item: each practitioner's "At The Desk" role, LinkedIn URLs, social links, contact email, company name, number and registered office.
- Each person must approve their own bio, and Rao must rewrite the founder story in his own words.
- Rao's firm list: the site says UBS · Commerzbank · BGC; elsewhere Barclays appears. Use one confirmed list everywhere.
- Photos: Kayyor uses /assets/kayyor-rao.jpg; the others show initials until their photos arrive.

**Copy pass, rule:** student-facing marketing and UI copy talks about people, practitioners, the panel and coaching, not "generated", "engine", "instant", "tool" or "model". **Legal and transparency text stays explicit and unchanged** (site-privacy.html, the how-we-score.html line "This assessment is automated; no individual practitioner has reviewed your CV", and the "AI" labels on AI candidates in the group exercise and on the About page's "How the tools work, honestly" box).

| Where | Now | Change to |
|---|---|---|
| Free result, sample banner | "Fictional sample candidate · Generated by the live assessment engine" | "Sample result · Amelia Chen · fictional student" |
| Free result, under the verdict | "Generated using The Desk's practitioner-developed framework." | remove (the section is already headed "What a practitioner sees") |
| Free result, fine print | "Your free result is generated instantly by applying The Desk framework to your CV and test answers." | "Your free result applies our practitioners' framework to your CV and test answers. No practitioner has personally reviewed it. Scores are preparation guidance, not a hiring decision." |
| Free result, ATS callout | "Use our ATS tool in Full Cycle to identify relevant target-role keywords" | "Members see which role terms to add, and where, using only what you've done." |
| Homepage, membership fine print | "Feedback in membership comes from our tools, built on our practitioners' framework." | "Every score and piece of feedback follows our practitioners' framework, applied to your own CV." |
| Homepage link | "See every tool, round by round →" | "See how we coach you, round by round →" |
| tools.html title + H1 | "Every tool, round by round. All built on your CV." | "How we coach you, round by round. All built on your CV." |
| tools.html | "Every tool uses your own CV and the role you're going for." | "Everything uses your own CV and the role you're going for." |
| signup.html intro | "Start with your free score and sample tools." | "Start with your free score and see how we'd coach you." |
| signup.html, practitioners and FAQ | "Their preparation frameworks inform/shape the scoring and feedback." | "They set the standard every score and piece of feedback is measured against, and they answer members' questions." |
| fullcycle loading | "Building your CV from validated repairs…" | "Preparing your CV…" |
| fullcycle-amelia | "V3 design preview" and the "hand-written examples… not newly generated v3 results" note | "Sample report · Amelia Chen · fictional student" |
| Any "Loading your tools…" | | "Opening your desk…" |

Also do a search for "generated", "engine", "instant", "tool" and "model" across student-facing pages for anything this table misses. Change it if it's marketing copy; leave it if it's a legal or transparency disclosure.

## Situational judgement + verbal reasoning practice (16 Nov)
New files: `practice-tests.html` and `data/aptitude-practice.mjs`. Preview image: `design/practice-tests.jpg`.
- **Formats:**
  - Situational judgement: pick the most and least effective of 4 actions; 1 point for each match with the key; 12 situations; about 20 minutes; scores broken down by competency.
  - Verbal reasoning: True / False / Cannot say on short business passages; 4 passages × 4 statements; 16 minutes, timed.
  - Every answer has an explanation, and the results page shows them all.
- **Content** is original and written by The Desk. Never present it as a real firm's questions. The page already says so. Practitioners must sign off the SJT keys before launch. Add them to FIRM-PACKS-REVIEW.md.
- **URLs:** `/practice-tests.html` (hub), `?type=sjt`, `?type=verbal`, `?firm=db` (adds the Deutsche Bank note with a link to DB's own guidance). Add more firms to `FIRM_NOTES`, using only what each firm says publicly.
- **Membership:** free users get the first 4 items (`FREE` in the data file), then the lock card. `member` comes from `GET /api/assessment-centre?view=info`. Swap in the site's standard member check if there is one. `?preview=member` is for testing only; remove it before launch or restrict it to staff.
- **Wire it in:**
  - add "Situational judgement" and "Verbal reasoning" to tests.html / test-hub.html and the Practise tab
  - link from deutsche-bank.html (its "ability tests and situational judgement" section) and from tracker prep for firms whose steps mention SJT or verbal tests: DB, UBS, Aviva and others
  - save results via the existing test-result storage so rechecks can count them
- **More content:** the data file is built to hold more tests. Aim for 3 SJT tests (36 situations) and 3 verbal tests (12 passages) before marketing it as a full product.

## Homepage: "One membership. Every round." tools section (16 Nov)
Goal: the homepage currently reads like a CV checker. Keep the CV hook as the way in, and show the whole personalised toolkit straight after it. Full spec is in Rao's Codex prompt of 16 Nov (same text as below).

## Free assessment v2: the journey (17 Nov)
Design reference: `design/free-assessment-v2-mock.html` and `design/free-assessment-v2.jpg` (5 phone screens). Rebuild assessment.html (and retire assessment-start.html as a page) in the version C style. Keep the existing back end (profile → CV extract → 10 questions → generate); this is a front-end and flow rebuild.

**Today:** an intro page, then 8 steps. Four of the steps are just "intro" or "confirm" screens (s3 "What happens next", s4 and s6 section intros, s8 "Ready to generate"). Step 1 has 10 fields, including three separate route dropdowns. The old Fraunces/DM Sans style. No email, so the result only lives in "My Desk Preview".

**New flow: 4 steps, about 8 minutes, phone first:**
1. **About you:**
   - fields: university (autocomplete), course, year (chips), grade (chips: First / 2:1 / 2:2 / Other, "predicted is fine"), route (chips: one choice plus "+4 more" and "Not sure", which links to the role checker), dream firm (optional)
   - programme type is worked out from year ("So you're applying for summer internships. Change"), not a separate dropdown
   - drop the name field here (it's asked in step 4), and drop the 2nd and 3rd route choices (ask later in My Desk if needed)
   - prefill the route from `?route=` on the homepage link
2. **Your CV:**
   - a big upload area (PDF/Word from the phone, Files, Google Drive), with "Paste your CV text instead" as a link
   - after upload, call the existing CV extract and show **"We found: [N] roles (names), [N] projects, [N] bullet points to check"**. This proves we've read it. If extraction fails, ask them to paste instead.
   - consent checkbox inline, with "We never share your CV with employers."
3. **10 quick questions:**
   - one question per screen; the commercial and numerical sections run straight through, with no intro screens
   - each question shows a small section label (Commercial / Numerical), a soft "aim for about 45 seconds" guide bar (not a hard cutoff), the question in EB Garamond, any data as a small table, and four large tappable options
   - progress reads "Question 7 of 10 · About 3 min left"
   - Previous/Next; no review screen at the end
4. **Keep your result:**
   - first name and email (required), "No password needed: we email you a link" (use the existing account system; if magic links don't exist yet, create the account the current way and add the link later)
   - optional, unticked checkbox for deadline reminders, stored as marketing consent
   - button "Build my assessment →", with "Free · no card · we never share your CV" underneath
5. **Waiting screen** (replaces "Putting your application into perspective"):
   - heading "Reading your application the way a banker would."
   - a live checklist: CV read ([N] lines), test answers marked ([N] of 10), checking each line against our practitioners' standard, working out your score and fixes
   - a dark "First thing we noticed" card, as soon as the first real finding is available (e.g. the top `weakLines` issue or `skimNote`). If nothing is ready yet, show a rotating real tip instead. Never make up a finding.
   - open the free result (result v2) automatically when ready

**Throughout:**
- a progress bar plus "Step X of 4 · about N min left"
- "Save & exit" (autosave answers locally and offer "Pick up where you left off" on return)
- a sticky bottom button bar
- big tap targets (at least 44px)
- inputs at 16px so iOS doesn't zoom
- no sideways scroll at 375px

**Homepage buttons go straight to step 1** (/assessment.html?route=…). /assessment-start.html redirects there.

**Analytics:** track step_viewed and step_completed per step, cv_uploaded vs cv_pasted, extract_failed, question_answered (index), email_submitted, result_opened, and time per step, so we can see exactly where students drop out.

---

## Free result v3: visual polish (design/free-result-v3-mock.html, free-result-v3-*.jpg)

Keep the current structure (two columns on desktop, collapsible on phone). Change:
1. **Use one CV source.** The Amelia sample mixes the original CV with rewritten lines ("Applied a recurring-revenue model screen…"). The free result must show the ORIGINAL lines only. Rewrites appear only as blurred/locked.
2. **Skim card = paper CV on a dark card.** Highlight each bullet's first words (`.on`, peach), mark the negative ending in red with a wavy underline (`.neg`), and grey out the rest. Add a handwritten margin note (Caveat 500, yellow, rotated 2.5deg) from a `skimNote` field. On desktop the note sits in a 200px right gutter of the paper. On phone it sits inline under it.
3. **Practitioner view: two sentences, specific to the CV, no mention of quiz results.** Pattern: what's genuinely good (with a number from the CV) + what stops the shortlist.
4. **Gap rows get +points chips** (green pill, right-aligned).
5. **Interview taster card** (camera tile + the question for their weakest competency) links to the free interview: `interview.html?taster=interview&trial=1&competency=leadership&firm=<firm>`.
6. **Sidebar:** score card (big Garamond number, "After the three fixes ~66–72", band bar, five parts) + dark "Your next step" plan card, sticky top:24px.
7. **Phone:** a score card under the H1, the sidebar score hidden, and a fixed bottom bar "58 → ~66–72 · Unlock · £89".
8. **Header:** align the logo and the sample label to the same 1120px container as the content.

## Free interview taster v2 (design/free-interview-v2-mock.html, free-interview-v2-*.jpg)

The live `interview.html?taster=interview&trial=1` currently looks like a different product. Problems found:
- Wrong person and firm: it shows "Jamie Patel's interview · Goldman Sachs · HireVue". The taster must use the signed-in/sample candidate and the firm from their free result (Amelia → Barclays).
- **The question isn't shown before you start.** For the taster the question IS the page.
- Browser-default buttons ("Enable camera + mic", "Microphone only", "Hear question" are 10–11px black on grey). There's a green "Ready · Start answer" inside the video AND a "Start interview" below it, and a blue "Finish interview". So there are three CTA colours and two start buttons.
- An empty grey skeleton bar, three nested `<details>` (sound / mode / firm), and the tip hidden in another `<details>`.
- A green rounded "Free mode" banner with a default blue underlined link, and a green taster box at the bottom. Neither matches the site.
- A floating round icon on the right edge overlaps the content.

### Screen 1: before you answer
- Header: logo + a "Free taster · 1 question" pill + Exit. No green banner.
- Kicker: "Interview coach · Barclays · Competency". The H1 is the question itself, in Garamond 600, 42px desktop / 31px phone.
- Chips: "Leadership · your weakest area (23)" in accent, then "2 minutes to answer" and "30 seconds to think".
- One line of instruction, then the camera stage: 16:9 on desktop, 4:5 on phone. Camera and mic status sit inside the stage as small text, plus a timer track.
- **One primary button:** "Start my answer" (ink). Fallbacks as text links: "No camera? Answer with mic only or type it". The permission prompt fires on click, so there's no separate "Enable camera" button.
- "Nothing records until you press start. Only you can see your recording." (Check this against the real retention policy before shipping.)
- Settings collapse to two rows: Mode · Practice, retake once; Sound and settings · Change.
- Sidebar (stacked under the stage on phone):
  - "From your CV · Use one of these": 2–3 evidence points from the free result, each with a one-line why. Say when NOT to use one.
  - Practitioner tip: visible, not collapsed, with the KR avatar and Garamond italic.
  - "What you'll get back": three ticks, the third marked (members).

### Screen 2: feedback (the conversion moment)
- Kicker "Your answer · 1:46 · Barclays · Leadership". The H1 is a one-line verdict ("You took charge. You didn't say what changed.").
- A big score with the comparison to their paper score ("Leadership on paper was 23. Out loud you're already at 48.") and four dimension tiles (Structure / Your role / Result / Delivery). The lowest one is in accent.
- Free: one "worked" and one "fix" card, each quoting the student's own words, with the weak phrase highlighted.
- Locked (blurred real text + overlay): "2 more points for members" and "Your stronger version, built from your answer".
- Sidebar: the dark plan card ("Practise every Barclays question like this", 5 rows, white £89 button, "Paid once · no auto-renewal · 12 months"), then "You've used your free question. Back to your result →".
- Phone: a sticky bottom bar "Every question, full feedback · Unlock · £89".
- Remove the member tab bar (My Desk / Practise / CV / Community / More) for non-members on this page, or keep it only if free My Desk is live. Right now it suggests access they don't have.

---

## 1:1 page and new practitioner pricing (one-to-one.html)

New page `/one-to-one.html`. Every "Need more help?" and "Explore 1:1 practitioner support" link goes here instead of `/mentor.html`:
- fullcycle-plan.html
- deutsche-bank.html
- the free result
- the homepage pricing tile (done in home-c.html / home-preview.html)

Pass context so the hero can show it: `/one-to-one.html?from=result&firm=Barclays&score=58`.

**Three options** (in signup.html, home-c.html and home-preview.html):

| Plan key | Name | Price | Includes |
|---|---|---|---|
| `single` (new) | One practitioner session | £79 | 45-min video call, mock interview for their firm and round, practitioner reads CV + Desk result first, written notes within 24h. No membership needed. |
| `plus` | Membership + 3 sessions | **£249** (was £199 with 2 calls) | £89 membership for 12 months + 3 sessions: CV and firm choice; mock first round; AC/Superday prep. Same practitioner, written notes. "Worth £326 bought separately" (89 + 3×79). |
| `coaching` | 1:1 support, application to offer | £3,000 / season | Named practitioner, weekly calls, every application checked, mocks before every round, messaging between calls, membership included. Starts with a free 15-min call. |

**Code changes:**
- `signup.html`: new `single` entry in COPY (shows the note field, posts `coaching-interest` with `type:'single'`). The plus copy now says three sessions. `data-plus-price` is £249.
- `api/desk-home.js`: `coaching-interest` accepts `type:'single'`.
- **Live:** if Stripe products exist for plus, update the price to £249. Add a £79 single-session product when you're ready to take payment directly. Until then it's a lead form, like plus.

**Placeholders for Rao:**
- the reschedule policy (FAQ)
- "[x] places a season" on the £3,000 tile

**Mismatch:** fullcycle-plan.html lists Rao as "UBS · Barclays · BGC", while firm-logos.mjs says "UBS · Commerzbank · BGC". Use one list, Rao to confirm.
