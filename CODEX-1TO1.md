# Codex: build the 1:1 page (one-to-one.html)

The complete page is in `one-to-one.html` (in this bundle and on branch `claude/assessment-test`). Deploy it as `/one-to-one.html` and make the changes below.

## 1. The page
Use `one-to-one.html` as-is. It uses the version C tokens: EB Garamond 600 headings, Figtree body, --ink #1f2a2e, --paper #f4f1ec, ink buttons.

Order, top to bottom:
1. Header: The Desk · Membership · About · Log in
2. Hero: "Work with a practitioner" / **"Practise with someone who's done the job."**
3. **Panel, directly under the hero:** "Who you'll work with" / **"Decades inside the firms you're applying to."**
   - Rao's card with his real photo, `/assets/kayyor-rao.jpg` (the live one, not the illustrative placeholder).
   - The other four in a grid (initials until their photos arrive). Data comes from `/data/home-practitioners.mjs` (falls back to `/data/firm-logos.mjs`).
   - Line under it: "Between them, more than 130 years in banking, markets, asset management and audit…"
4. "Choose how much help you want": three tiles:

| Plan key | Tile | Price | Button |
|---|---|---|---|
| `single` (new) | One practitioner session: 45-min video call, mock interview for your firm and round, practitioner reads CV + Desk result first, written notes within 24h. "You don't need to be a member." | **£99** per session | Book a session → `/signup.html?plan=single` |
| `plus` | **Membership + 2 sessions** (dark tile, "Best value", first on phone): everything in £89 membership for 12 months; Session 1: your CV and which firms to apply to; Session 2: a mock interview, assessment centre or Superday prep, when you need it; same practitioner, written notes. "Worth £287 bought separately". | **£249** paid once | → `/signup.html?plan=plus` |
| `coaching` | 1:1 support, application to offer: named practitioner, weekly calls, every application checked, mocks before every round, messaging between calls, membership included. "Starts with a free 15-minute call". | **£3,000** per season | Ask about 1:1 → `/signup.html?plan=coaching` |

5. "Pick by where you are": three short situations with links.
6. "How a session works": three steps.
7. FAQ: 5 questions.
8. Dark CTA: "Not sure yet? Start with your free score."

On phone (≤900px), the panel becomes a two-column compact grid so the prices start on the second screen.

## 2. Context from the link
If the URL has `?from=result&firm=Barclays&score=58`, a line under the hero shows "Coming from your result: Barclays, readiness 58." This is already in the page script.

## 3. Point every 1:1 link here
Replace `/mentor.html` (and `signup.html?plan=coaching` where it's a "find out more" link) with `/one-to-one.html`, adding `?from=result&firm=<firm>&score=<score>` where known:
- the free result "Need more help?" section
- `fullcycle-plan.html` "Explore 1:1 practitioner support"
- `deutsche-bank.html` "Explore 1:1 practitioner support"
- homepage 1:1 pricing tile ("See 1:1 options →")
- My Desk wherever 1:1 is offered

Keep `/mentor.html` as a redirect to `/one-to-one.html`.

## 4. Prices everywhere
- **Plus is £249 for membership + 2 sessions** (was £199). Update every `data-plus-price` and the signup comparison table: "Calls with a practitioner: 2 sessions".
- The homepage tile list reads: "Two 45-minute sessions with a practitioner / 1: your CV and which firms to apply to / 2: a mock interview, assessment centre or Superday prep / Written notes after each session".
- If a Stripe product exists for plus, change it to £249.

## 5. New `single` plan
- `signup.html` COPY gets a new entry: `single: { k: 'One practitioner session · £99', t: 'Book a session', i: 'Tell us your firm, round and interview date. We'll email you a payment link and times with the closest practitioner.', s: ['Send this form', 'We email you a payment link and times', 'Practitioner reads your CV, then your 45-minute call'], b: 'Send' }`.
  - Show the note field for `single`.
  - Post `coaching-interest` with `type:'single'`.
  - Success message: "Thanks. We'll email you a payment link and times for your session."
- `api/desk-home.js` `coaching-interest`: accept `'single'` in the type whitelist (`['society','plus','single']`).
- For now it's a lead form. Later, add a £99 Stripe product.

## 6. Placeholders, do not ship until Rao fills them
- FAQ "What if I need to move my session?" (reschedule policy)
- "[x] places a season" on the £3,000 tile: remove it if there's no real number
- Rao's firms: firm-logos.mjs says UBS · Commerzbank · BGC, while fullcycle-plan.html says UBS · Barclays · BGC. Use one list, as Rao confirms.

Send Rao a preview URL at 390px and 1280px when done.
