# HireVue guide (drop-in for the interview page)

**Files**
- `hirevue-guide.js` (the content and practice mode)
- `hirevue-guide.css` (styles)
- two lines added to `interview.html`: the stylesheet link after the Google Fonts link, and `<script src="/hirevue-guide.js"></script>` after `interview-firms.js`

**What it adds**
- **A guide section after "Which firm and role?"**, with these parts:
  - the 2-minute version (8 essentials)
  - how HireVue works
  - your firm: a format card per coach firm, plus knowledge-base points for that firm if the knowledge base is installed
  - six question types, each with a shape, timing and examples; three have a weak, an average and a strong answer with reviewer notes
  - your four stories (saved in the browser)
  - on-the-day checklists (saved, and printable)
  - a camera check
  - myths (plus knowledge-base myths)
- **The "HireVue format" practice mode** uses the coach's own camera, recorder and current question:
  - thinking countdown (30, 45 or 60 seconds)
  - automatic recording
  - answer countdown (1, 2 or 3 minutes) that stops by itself
  - retakes (0, 1 or 2)
  - The student then plays it back and gets feedback as usual.

**To fill in (in `hirevue-guide.js`)**
- `HV_FIRM_FORMATS`: each firm's number of questions, thinking time, answer time and retakes, with a "confirmed" note (e.g. "Oct 2026, 3 students"). Fields left empty show "Not confirmed yet", so we never guess.
- `UPDATED`: the month shown at the top.
- **Get Rao or Peter to read the weak, average and strong examples and the myths** before launch. They're written as The Desk's practitioner view.

**Works without the knowledge base.** If `/api/knowledge` isn't installed, the firm and myth extras simply don't appear.

**Tested** in Chrome with a fake camera at desktop and phone width: no horizontal scroll, no errors, and the practice mode's timing, auto stop, playback and retake limit all work.
