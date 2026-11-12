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
