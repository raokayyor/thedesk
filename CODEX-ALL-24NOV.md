# The Desk: fix pass, 24 Nov (phone + laptop)

**Ground rules (apply to everything below)**
- **Phone first.** Most students find us and judge us on phone. Build and test every screen at **390×844 first**, then **1280×800**.
- **Phone = quick, one thing per screen. Laptop = the deep workspace.** Same features on both; laptop uses the width for more depth. The interview desktop layout (answer left; camera, tip and firm brief right) is the model.
- **Sticky bottom bars are phone-only (under 768px).** On desktop, primary actions sit inline or in a toolbar.
- **Never invent facts.** Generated text uses only the CV, the student's own words (transcript, gap answers, story facts) and our firm data.
- **Every Kayyor tip is "What the interviewer is really asking"** (`reallyAsking`).

---

## A. Interview coach

1. **The transcript is a source.** Anything the student said (numbers like "2:1", outcomes like "didn't miss a shift") passes validation. Never replace a sentence she said with a gap. Saved gap details and `story_facts` outrank the transcript. Test: the 77-scoring Pho House answer must keep its result and timetable lines.
2. **Strong answers (70+):** the heading reads "Ready to save". Primary button "Save to my answers", secondary "Practise once more". Only show "changed" tags where wording actually changed.
3. **Deterministic scoring.** Hash the transcript and cache the score; the same text always gives the same score. **Cap:** no specific action + no result + vague phrases ("just tried", "got through it") caps at 49, labelled "Needs work". Typed answers get no Delivery score.
4. **Build-answer template by question type:**
   - Leadership ("led others") uses a leadership CV line (trained / led / organised, e.g. "trained 3 new colleagues"), with gaps "What did you decide?" / "How did they respond?".
   - Competing responsibilities uses the balancing template.
   - Test both on Amelia's CV and on the sample CV.
5. **Gap chips match the gap's purpose:**
   - actions/prioritise: "Told my manager early · Swapped shifts in exam weeks · Weekly timetable · Said no to extra shifts"
   - result: "Grade/mark · What changed after · Feedback I got · Not known yet"
   - reflection: "What I'd do again · What I'd change"
6. **Small fixes:**
   - The story picker shows the story name (Pho House), never "Your fixed answer".
   - Tidy saved gap text (capital letter, full stop).
   - Gap saves are optimistic (show instantly, save in the background, retry on failure).
7. **Speed:** phone load under 5 seconds (currently about 12). Show the skeleton straight away; defer non-critical scripts until after first paint; bundle the interview scripts.

## B. Homepage and routing (all users)

1. **No flash of the visitor version.** Render the signed-in header and CTA before first paint (cookie hint, or hide them until `/api/desk-home` resolves).
2. **Header:** visitor = Membership · Log in. Free = avatar "My Desk" + "Upgrade" pill. Member = avatar "My Desk". Avatar initials in uppercase.
3. **Main CTA:**
   - visitor: "Get my free assessment"
   - free: "See my result"
   - member: "Go to My Desk"
   - hide "Free · 10 mins · no card" when signed in
4. **Members:** no pricing pitch or "Start my free review" lower on the page; use the one line "You're a member. Today's question is ready →". (Already live; keep it.)
5. **`try.html`** redirects signed-in users to `/my.html` (live; keep it). Login always lands on `/my.html`.

## C. Free users: the same app, with trial versions of each tool (supersedes all earlier free-tier notes)

**Model (Rao's decision, final):** every signed-in user gets **the same My Desk dashboard and the same menu** as a paid member, whether or not they've done the assessment. Only **where the links go** differs:
- **Free (not paid £89):** each tool link opens the **free trial mode** of that tool. The free user should feel they are inside the paid app, seeing real snippets of what each tool does, **personalised to them** (their CV, their target firm, their name).
- **Member (paid):** the same links open the **full** tool.
- Paying flips every link from trial to full. Nothing else about the layout changes.

1. **One dashboard component, `my.html`, for both.** Same cards, same order, same left menu (laptop) and bottom nav (phone). No separate "free dashboard", no "Free account" label, no "What members get" wall of cards, no long free-tries grid.
2. **A link map by tier, in one place** (e.g. `lib/tool-links.mjs`):

   | Tool | Member link | Free link (trial mode) |
   |---|---|---|
   | Interview coach | `/interview.html` | `/interview.html?trial=1` |
   | Assessment centre | `/assessment-centre.html` | `/assessment-centre.html?trial=1` |
   | Group exercise / Case study / Inbox | full | `?trial=1` |
   | Numerical & commercial / Reasoning tests | `/tests.html` | `/tests.html?trial=1` |
   | Applications (drafts) | `/applications.html` | `/applications.html?trial=1` |
   | CV | `/cv.html` | `/cv.html?trial=1` |
   | Crib sheet / Firm packs | full | `?trial=1` |
   | Saved answers / Story bank | full | `?trial=1` (shows what they'd keep) |
   | Tracker, Community, Live sessions, News | same for both | same for both |

   Every menu item, dashboard card and button reads from this map. **The server decides the tier**: a free user hitting a full URL is served the trial version. Never trust the URL alone.
3. **What a trial version is:** the real tool, same design, cut down, never an upsell page.
   - It runs on **their data**: their CV (if they've done the assessment), their target firm, their name. With no CV yet, it uses the sample CV with one line, "Using a sample CV. Do your free assessment to see this on yours →".
   - It does one meaningful piece of work and shows the personalised result in full:
     - interview: one question, the answer built from their CV, the fixed answer + score
     - applications: their "Why {firm}" opening drafted
     - tests: 5 questions + result
     - assessment centre: one group-exercise round
     - CV: one line fixed, before → after
     - firm pack: their firm's overview
     - crib sheet: their firm introduction
   - It shows what the full version would carry on with, visibly, as a soft fade below the result. For example: "Members practise all 6 questions for Barclays", "Members get drafts for all 11 J.P. Morgan questions", "Members get unlimited tests from 2,000+". Then one button, [Unlock · £89], with `return=` to the same tool.
   - Small label at the top: "Trial" (not "locked", not "free mode").
   - Each tool's trial can be used again on a different input up to a light limit (e.g. 3 runs), then: "You've seen what it does. Unlock the full tool · £89". Never a blank screen; always show what they made.
4. **Dashboard cards are the same for both tiers, filled with their data:**
   - question of the day: free users get it too (links to the interview trial)
   - score card: with an assessment, their score; without one, the same card says "Get your score: 10 mins" [Start my free assessment]
   - applications due, next interview, progress, library: same cards; for free users the buttons open trial modes
   - only one small difference: a slim "Unlock everything · £89" bar at the top of My Desk for free users, plus the "Upgrade" pill in the header
5. **The assessment** stays free for everyone and is the main thing a new free user is nudged to do (via the score card), because it's what personalises every trial.
6. **Sign-up:** a free account can be created either by finishing the assessment (email at the end) or by signing up directly. Both land on the same My Desk.
7. **Payment flips the links.** After paying, return to the tool they came from (`return=`), now in full mode, with whatever they made in trial kept and carried over.
8. **Test:** with a free account, click every menu item and every dashboard button. Each must open a working trial version personalised to that user, never a "members only" page, a 404 or Amelia's data (unless no CV, in which case the sample is labelled). Then upgrade and confirm the same clicks open the full tools.

9. **Explore mode: browse the dashboard without the assessment (phone first).**
   - Any "Explore", "Explore membership", "Skip for now" or "Look around first" link (homepage, assessment start, signup) opens **the same My Desk dashboard** in explore mode. **No sign-up needed to look.**
   - Explore mode uses the sample student's data (labelled), and every tool link opens that tool's trial on the sample CV.
   - **One persistent prompt, phone-first:** a slim bar pinned under the header on every explore screen, "**Start your free assessment** to make every tool personal to you · 10 mins →". It's the only nudge: no pop-ups, no blocking.
   - Inside each trial, the sample label reads: "This is a sample CV. Start your assessment to see this on yours →".
   - Finishing the assessment from explore mode keeps them where they were and switches the dashboard and trials to their own data (score card filled, trials re-run on their CV).
   - **Phone checks at 390×844:**
     - explore dashboard loads in under 3 seconds
     - the prompt bar is visible without scrolling and never covers content
     - bottom nav works on every screen
     - every tile opens a trial within one tap
   - Saving anything they make in explore mode asks for an email ("Save this to your Desk"), which creates the free account.

10. **Trial pattern for "document" tools: full page, headers visible, text blurred. Crib sheet first.**
    - **Crib sheet (Assessment centre → Crib sheet), trial mode:**
      - Build **their** crib sheet as normal (their CV, their target firm).
      - Show **the whole page**, laid out exactly like the member version.
      - **Unblurred:** the **30-second intro** ("Tell me about yourself", 30 secs) in full, plus **every section header** on the page (e.g. "Why {firm}", "Your 3 best stories", "Numbers to quote", "Questions to ask them", "Weak spots to prepare"), so they see exactly what they'd get.
      - **Blurred:** all body text under every other header.
      - One button under the intro and one at the bottom: [Unlock my full crib sheet · £89] with `return=` back to this crib sheet, which then shows unblurred.
    - **Security:** the blurred text must **not** be the real content in the page. The server sends the real text only for the unblurred parts. Blurred blocks hold placeholder text of a similar length, so nobody can unblur it in dev tools. After payment, fetch the real content.
    - **Look:** blur about 6px, with text-shaped placeholder lines (not a grey box), so it reads as "your content is here". Headers stay crisp. No lock icons on every section; one small "Trial" label at the top.
    - **Phone first (390×844):** the intro is fully readable in the first screen. Headers and blurred sections scroll naturally below. Sticky [Unlock · £89] bar at the bottom on phone only.
    - **No assessment yet (free user or explore mode):** don't try to build it. Show a card at the top:
      - "**Your crib sheet is built from your assessment.** We can't build yours until you've done it: 10 mins, free."
      - buttons: [Start my free assessment] and [See a sample crib sheet]
      - **sample:** Amelia Chen's crib sheet, clearly labelled "Sample · Amelia Chen, Economics, Bristol → Barclays", in the **same trial pattern** (30-second intro open, all headers visible, body text blurred), so the sample doesn't give away a full template
      - keep the "Start my free assessment →" bar pinned above the sample
      - after the assessment, return to the crib sheet and build theirs automatically
    - The same "built from your assessment → start it / see a sample" pattern applies to every personalised tool (interview answer builder, application drafts, firm pack "your angle", CV line fix), always with Amelia Chen as the labelled sample.
    - **Reuse the same component for the other document-style tools:**
      - firm pack: the overview unblurred, other headers visible, text blurred
      - application drafts: the first draft unblurred, other question titles visible, drafts blurred
      - full assessment report: score + first fix unblurred, other fix headers visible, text blurred
      - one component, e.g. `TrialDoc({ open: [sectionIds], ... })`

## D. Member experience

1. **My Desk, phone: one screen**
   - greeting with progress: "Afternoon, Amelia. You're {done} of {total} fixes in."
   - question of the day + streak
   - progress card: score + "Next fix: {next}" [Do it · x mins] + perk "Ask the panel: 1 question included"
   - next application deadline (or the closed state)
   - library line: "{n} answers saved · {m} of 10 story facts"
   - everything else under "More tools"
2. **"More tools" clean-up:**
   - one score only (merge "reference" and "deep", or label them "CV score" vs "Full score")
   - one community card, one news card
   - Newsflow shows cached headlines or hides; never "Loading…" for more than 2 seconds
3. **Application drafts must be firm-specific:**
   - "Why {firm}" opens with the firm angle from `WHY_FIRM[firm]` (angle/hooks), as a sentence for her to make her own, then one CV link
   - no full CV walkthrough
   - **deduplicate:** never repeat the same facts (the Redcliffe paragraph currently appears twice)
   - 120–180 words, at most 2 amber gaps
4. **Draft primary button:** gaps > 0 shows "Fill {n} gaps"; gaps = 0 shows "Copy my draft". "Mark as submitted" is a secondary link.
5. **Counts from one source:**
   - "drafted" = drafts with no fabricated content; "ready" = drafts with 0 gaps
   - the gaps total = the sum of per-question gaps
   - grammar: "1 gap"
   - **past deadlines** show "Closed 20 Nov" in grey and sort last; "next deadline" = the next future date, else "None tracked: add a firm →"
   - My Desk "Applications due" reads the same tracker data
6. **Story bank:**
   - opens straight on her CV stories (Redcliffe, Pho House, LVMH project) with a "{m} of 10" bar
   - keep "Used in: {n} answers" (great motivator)
   - chips and placeholder match the question: "what changed" offers "What happened next / Feedback I got / Not known yet"; "what you learned" offers "What I'd do again / What I'd change"
7. **Saved answers when empty:** hide "Download PDF". Show "Your first saved answer is one practice away" [Practise today's question].

## E. Laptop layer (1024px and up)

1. **Persistent left menu on every member page.** It's currently missing on `applications.html`, `saved-answers.html` and `your-story.html`.
   - order: My Desk, Interview, Applications, Saved answers, **Story bank (add it)**, Tests, Assessment centre, Community, More
   - "Coming soon" items go into More
   - free users see the same menu, with a "Member" tag on locked items
2. **`my.html`, two columns:**
   - **left:** question of the day → next fix [Do it] → progress
   - **right:** next deadlines (closed ones greyed) → saved answers count → story bank "{m} of 10 · each fact improves {n} answers" → live AMA
   - no full-width thin strips
   - free accounts: identical layout; buttons open trial modes; slim "Unlock everything · £89" bar at the top
3. **`applications.html`, 3 panes:**
   - **left:** firms and their questions (ready / gaps / closed)
   - **centre:** full-height draft editor, inline gap editing, underline = from your CV
   - **right:** "What they're really asking" + `WHY_FIRM` angle/hooks + story facts (click to insert) + reported source
   - actions in a toolbar above the editor (Fill gaps · Shorter · More like me · Check it · Copy · Mark submitted)
   - **no sticky bottom button**: it currently covers the draft text
4. **Saved answers and story bank:** list on the left, detail on the right (beats + best score + "Practise again" / fact + "used in" answers).
5. **Interview:** keep the current desktop layout. On the result screen put the fixed answer on the left and the score, fixes and "Practise this answer" on the right, all visible without scrolling.

## F. Proof (send screenshots, both sizes)

Test as three users: **signed out**, **free** (a fresh assessment completed on a new email, with its own CV) and **member** (Amelia). At **390×844 and 1280×800**, send:

1. **Homepage header + CTA:** signed out, free and member.
2. **My Desk:** free (straight after finishing the assessment) and member.
3. **Free tries:** each one's before/after card and used-up state (phone).
4. **Interview:** the weak answer fixed, then the stronger answer at 70+ showing "Ready to save".
5. **Applications:** the J.P. Morgan "Why J.P. Morgan" draft, on phone and in the 3-pane laptop layout.
6. **Library:** the story bank first screen and saved answers.
7. **Load times:** each free try and the interview, on throttled "Fast 4G".
