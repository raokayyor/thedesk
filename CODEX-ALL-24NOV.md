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
   - visitor: "Start my free review"
   - free with no assessment or report: "Start my free review" (**not** "See my result")
   - free with a report: "See my result"
   - member: "Go to My Desk"
   - hide "Free · 10 mins · no card" when signed in
4. **Members:** no pricing pitch or "Start my free review" lower on the page; use the one line "You're a member. Today's question is ready →". (Already live; keep it.)
5. **`try.html`** redirects signed-in users to `/my.html` (live; keep it). Login always lands on `/my.html`.

## C. Free account (phone is where they decide to pay)

1. **Free My Desk on phone: about 2 screens, in this order**
   - **No assessment:** hero "Get your score: 10 mins, free". One line: "Add your CV + 2 short tests → your score and 3 fixes". Button [Start my free review]. It fills the first screen.
   - **With an assessment:** the hero is her score + "Your 3 fixes" as three tappable one-liners.
   - Then: question of the day (compact) → "Your free tries" → tracker / community / AMA as one-line rows → one "Members get" card.
   - Remove the separate "Explore membership" button. The upgrade lives in the header pill and after each free try.
2. **"Your free tries" as a 2-column chip grid:**
   - 8 chips, each an icon + short name (Interview, Why this firm, CV line, SJT, Verbal, Group, Firm pack, Crib sheet) + ○ available / ✓ used
   - tap → straight into the tool
   - without her own CV, add one line: "Using a sample CV. **Add yours** to see your own fixed →"
3. **Every free try uses the same 3 steps:**
   - **one input on one screen** (no setup forms; default to her target firm or "General")
   - **the win:** a **before → after card** that fits one phone screen ("Yours" above "Fixed" in green, plus a change like "48 → 74", big type)
   - **then the upgrade:** "That's 1 of your free goes. Members fix every answer, every firm, unlimited." with [Unlock · £89] [Back to My Desk]
   - the win always shows before any upgrade prompt; never lock the result
4. **Per-tool phone checks** (no sideways scroll, main button in thumb reach, 48px+ tap targets):
   - **Interview:** the fixed answer and score are visible together without scrolling.
   - **Why this firm:** firm chips (not a dropdown) → a 3-sentence opening with the firm hook highlighted.
   - **CV line fix:** opens a single-line CV fix, **not** the assessment page.
   - **SJT / Verbal:** 5 questions, one per screen → "3/5 · here's the one that trips most people".
   - **Group / Firm pack / Crib sheet:** one screen of content + "Save to my phone".
5. **Free try load:** the first usable screen in **under 3 seconds** on phone. Load only that tool's scripts.
6. **Used-up state:** the chip shows ✓ "Used". Tapping it shows her saved result plus "Members get this unlimited · Unlock · £89". Never a blank or blocked screen.
7. **One allowance model:**
   - one go per tool; question of the day 3 a week ("3 daily questions left this week")
   - remove the "Practise HireVue & interviews · Member" card for free users
   - the tag is "Member" everywhere, never "Members"
8. **"Members get" as one compact card:**
   - 6 one-liners with a lock icon: unlimited interview practice + fixes · application drafts for every firm · 2,000+ test questions · answer library and story bank · practitioner panel · live sessions
   - one button: [See membership · £89]
9. **Upgrade return:**
   - Unlock on a locked sheet returns to that feature, unlocked (`return=/members-only.html?feature=tests`).
   - Unlocking from a free try returns to that tool with her result kept.

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
   - free accounts: left = hero (assessment or score) + free tries grid; right = members-get card + AMA
3. **`applications.html`, 3 panes:**
   - **left:** firms and their questions (ready / gaps / closed)
   - **centre:** full-height draft editor, inline gap editing, underline = from your CV
   - **right:** "What they're really asking" + `WHY_FIRM` angle/hooks + story facts (click to insert) + reported source
   - actions in a toolbar above the editor (Fill gaps · Shorter · More like me · Check it · Copy · Mark submitted)
   - **no sticky bottom button**: it currently covers the draft text
4. **Saved answers and story bank:** list on the left, detail on the right (beats + best score + "Practise again" / fact + "used in" answers).
5. **Interview:** keep the current desktop layout. On the result screen put the fixed answer on the left and the score, fixes and "Practise this answer" on the right, all visible without scrolling.

## F. Proof (send screenshots, both sizes)

Test as three users: **signed out**, **free** (`free-test-login`, both no assessment and with assessment) and **member** (Amelia). At **390×844 and 1280×800**, send:

1. **Homepage header + CTA:** signed out, free and member.
2. **My Desk:** free with no assessment, free with assessment, and member.
3. **Free tries:** each one's before/after card and used-up state (phone).
4. **Interview:** the weak answer fixed, then the stronger answer at 70+ showing "Ready to save".
5. **Applications:** the J.P. Morgan "Why J.P. Morgan" draft, on phone and in the 3-pane laptop layout.
6. **Library:** the story bank first screen and saved answers.
7. **Load times:** each free try and the interview, on throttled "Fast 4G".
