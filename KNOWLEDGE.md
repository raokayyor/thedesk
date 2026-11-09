# Knowledge base (November 2026)

This feeds what people are saying publicly (posts, reels, articles) and what our practitioners know into the model. It uses our own words, and every point is approved by a practitioner first.

## How it works
1. **Add a source** at `/knowledge-admin.html` (staff key: `PRACTITIONER_SUPPORT_KEY`). You can use any of these:
   - **Screenshots** of posts or carousels. You can drop several at once; they're read 6 at a time.
   - **A saved reel or video, or an audio file.** The page extracts the sound in the browser and sends only the audio, one minute at a time, for transcription. The video never leaves your computer. The transcript appears in the text box for you to check.
   - **Pasted text:** a caption, an article, or your own notes.
   - **Source details:** type, account, link and date.
2. **The model pulls out the points.** It rewrites each one in our words and tags it:
   - **Type:** what interviewers look for, red flag, how to answer, firm question, firm process or culture, CV tip, test tip, or market topic.
   - **Firm, division and stage.**
   - **"Check this fact"** on any claim about a firm's process.
   - It **automatically drops any point that copies 10 or more words in a row** from the source.
3. **A practitioner reviews each point.** You can edit it, then choose one of:
   - **Agree**
   - **Agree, with a caveat** (you add the caveat)
   - **Disagree** (you add your view; the point is then used only as a myth to correct)

   You also record who approved it.
4. **Approved points are used in three places:**
   - **The paid Full Cycle report.** Each section's prompt gets up to 24 relevant points: the student's firm first, then their division, then general points. Firm points are framed as "commonly discussed, prepare for it", never as firm policy. Myths are passed in with your view so the report can correct them.
   - **The interview coach** (`/interview.html`). It shows a "What interviewers look for" box (up to 3 tips plus one "common advice to ignore"). It also adds one question commonly asked at the student's firm, before the "why this firm" question, and skips it if it repeats an existing question.
   - **Post drafts.** Tick up to 12 approved points and get an Instagram carousel, a reel script and/or a LinkedIn post in our voice, as you or as "The Desk's practitioners". Drafts never mention other creators.
5. **Trending** (`/trending.html`, public). When the same point turns up in another post or reel, it counts as another mention instead of becoming a duplicate. Approved points mentioned by 2 or more different sources in the last 90 days appear here, ranked by mentions: firm questions (with a firm filter), advice, and "advice our practitioners disagree with". It's in our words only, with no creators named. Your own practitioner notes don't count as mentions.
6. **Add your own points** directly ("Or add your own point"). They're approved under your name straight away.

## What is and isn't stored
- **Stored:** our rewritten point, its tags, your view, who approved it, and the source type, account, link and date (staff only).
- **Not stored:** screenshots, transcripts, the original wording, or the video.
- **Never shown to students:** sources and accounts.

## Not changed on purpose
- **The free assessment scoring (`api/analyse-mot.js`)** doesn't use the knowledge base. Its scoring is calibrated, and outside advice shouldn't move scores. If you want it there, the knowledge should only shape the wording of priorities, not scores.
- **Firms missing from the coach's firm list** (e.g. Lazard, Evercore, Rothschild) can't be chosen in the coach yet, so their firm questions only show up in reports. Add them to `interview-bank.js` to use them in the coach.

## Setup
- **Uses the existing `ANTHROPIC_API_KEY`** and `PRACTITIONER_SUPPORT_KEY`.
- **`OPENAI_API_KEY`** is needed for reel or audio transcription. Without it, screenshots and pasted text still work.
- **Optional overrides:** `KNOWLEDGE_MODEL` (defaults to the Full Cycle model) and `TRANSCRIBE_MODEL` (defaults to `gpt-4o-mini-transcribe`).
- **The `desk_knowledge` table** is created automatically.
- **One new function:** `api/knowledge.js` (120-second limit in `vercel.json`).

## Fair use of other people's content
- **Use points, not wording.** Facts and ideas about recruitment are fair to use; someone's script, carousel text or list is theirs.
- **Keep it that way.** The tool rewrites and filters copied wording, but read each point before approving.
- **Don't scrape.** Instagram's terms ban automated scraping. Save posts or reels yourself, or screenshot them, and add them by hand.

## Tests
- `node --test tests/knowledge.test.mjs` covers dropping copied wording, cleaning, firm and division selection, the prompt block (guidance versus myths) and the extraction prompt.
- **Checked end to end** against a real Postgres database (PGlite) in a browser: screenshot and audio upload, extraction, review rules, the approved library, post drafts, the injected report prompt, and the interview coach on a phone.
- `tests/free-preview.test.mjs` already fails on `main` before this change; this change doesn't affect it.
