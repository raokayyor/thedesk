# Codex: interview feedback that makes students improve (and save the good one)

Tested live on 23 Nov as Amelia, typed answers to Q1 ("Give me a brief introduction… IBD at Barclays").

## Bugs found
1. **Beats tick everything.** A weak first answer (44/100) showed "4 of 4 answer sections supported ✓", all green:
   - "Why this role and firm" was ticked by "I've always been really interested in finance"
   - "Your contribution" was ticked by "supported the team with research and analysis", which is the exact weak phrase
   - the same sentence was used for two beats

   A 44 with four green ticks makes no sense to a student.
2. **On the 81 answer, "Your contribution" matched the Pho House sentence** instead of the Redcliffe action ("I set the rule… cut the 12 down to 4").
3. **Every "What can make this better" item says the same template line:** "Connect this point directly to the question and explain your reasoning." That's identical for all three items, on both the 44 and the 81 answer. No specific advice, and no better version.
4. **"What worked" praises trivia** ("Hi, I'm Amelia, I'm a final year economics student").
5. **No comparison on retry.** Attempt 2 scored 81 but nothing says "up from 44".
6. **There's no visible save.** A "Save this answer" button exists in the DOM but isn't shown on the feedback screen.

## The design (reference `design/interview-feedback-mock.html`, `design/interview-feedback.jpg`)

### Attempt that scores under 70
1. **Score card:**
   - big score /100 and a band chip: <50 "Not there yet", 50–69 "Getting there", 70–84 "Strong answer", 85+ "Excellent"
   - a meter with marks at 50 and 70 ("70 Strong")
   - on retries, a grey marker at the previous score
   - Remove the 4 dimension tiles from the top (Structure, Evidence and so on). Show them in a collapsed "Score breakdown" at the bottom.
2. **"{n} fixes to get to about {target}":** at most 3, biggest first, each with an estimated +points chip. Each fix has:
   - a plain title ("Say what *you* did", "Make 'why {firm}' specific", "Cut the filler opener")
   - "You said:" with the exact weak phrase from the transcript, struck through in red, plus why in a few words
   - a green "Try" box: a concrete rewrite using **only** their CV or their own words ("From your CV, try…"), or a specific instruction where we have no facts ("Name one thing about {firm} you've looked into…")
   - No generic template lines. If the model can't produce a specific fix, drop that fix.
3. **"Your 4 beats":** honest ✓ / ✕, each ✕ with a one-line reason. A beat counts only if the transcript meets its criterion:
   - **contribution** needs a first-person action with an outcome or number
   - **why firm** needs something specific to that firm
   - one sentence can't satisfy two beats
4. **"What you said":** the full transcript, green highlights for keep phrases, red for weak ones. Tap a red phrase to see its fix. Legend: "Green: keep · Red: tap to see why".
5. **Buttons:**
   - primary: "Try again with these fixes". This reopens the question, and the 3 fixes stay pinned on the think and recording screens.
   - secondary: "See a 70+ version of your answer". This builds it from the CV and the transcript only, with amber gaps for unknowns. Locked for free tasters.

### Attempt that scores 70+
1. **Score card** with the band "Strong answer". On retries, show "↑ {diff} points from your first try ({first})" in green, with the old score as a grey marker on the meter.
2. **"What you fixed":** a green list of the fixes that are now met.
3. **"To push past 85":** one polish tip.
4. **"Check before you use it":** shown when the answer makes a factual claim about the firm or a number not in the CV. "You said {claim}. Make sure you can back that up if they ask."
5. **The save card** (dark): "This is a keeper" / "Save as your {firm} {question type}" / "It goes into your answer library, and its beats become your crib sheet next time this question comes up." Button: "Save this answer".
   - Saving stores the transcript, score, firm, question, date and the derived 4 beats in the existing saved-answers store.
   - The next time the same or a similar question appears, the think screen preselects the saved answer's beats ("Your saved answer · 81").
6. Then "Next question →", with "Or try once more to push past 85" under it.

### Answer library
- "Your saved answers" in My Desk: grouped by question type, best score shown, last practised date.
- Each answer can be opened (transcript + beats), practised again, or deleted.

### Free taster
- Show the score, the band, fix 1 in full, and fixes 2–3 as titles only (blurred "Try" boxes).
- "Try again with these fixes" works once.
- Saving and the 70+ version are locked: "Members can save answers and see the 70+ version →".

Send Rao screenshots at 390px and 1280px of: a weak first attempt, the retry scoring higher (with "up from"), the save confirmation, and the answer library.

## Two modes, two jobs
**Practice mode is the improvement tool.** The loop is: answer → score → 3 specific fixes → "Try again with these fixes" (fixes pinned) → higher score → save. Everything in "The design" above belongs to Practice mode. Allow unlimited retries per question. Show attempt history on the question ("Attempt 3 · 44 → 63 → 81").

**Real interview mode rehearses what you've built.** Rules:
- **Questions come from the student's saved answers first** ("Run my saved answers"), then fresh questions for the same firm and type. A setup option: "Saved answers only / Mix in new questions".
- **Real conditions:** no CV card, beats, tips, fixes, full answer or pause. Think time and the answer clock match the chosen format (HireVue default: 30 seconds and 2 minutes). One take per question.
- **Feedback only at the end of the run**, not after each question, like a real video interview:
  - an overall score and a list of questions, each showing "Today {score} · Your saved best {best}"
  - for saved answers, a beat check against the saved beats ("You hit 3 of your 4 beats · you missed your result line")
  - a flag if they drifted far from the saved answer and scored lower
- **Next step from each row:** "Back to Practice on this question →" (opens Practice with the miss pinned as fix 1).
- **If today's take beats the saved best:** offer "Replace your saved answer with today's (88)".
- **On the run summary:** "Run again" and "Practise the weak ones" (Practice mode with only the questions under 70).
