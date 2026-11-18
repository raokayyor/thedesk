# Codex: homepage simplification (phone first) + open live sessions

References in this pack:
- `home-phone-simple-mock.html`
- `home-phone-simple-screens.jpg` (screen by screen)
- `home-phone-first-screen-rao.jpg`
- `decoder-section-mock.html`
- `decoder-section-phone-v2.jpg`

Target: about 4.5 screens at 390px (now 6.7). Keep the live logos, team photos, swipe-strip screenshots and data sources.

## Section order (phone and desktop)
1. Hero
2. Goldman line
3. "The part nobody tells you" decoder card
4. "One membership. Every round." + swipe strip
5. People
6. Pricing
7. Final CTA

## 1. Hero
- Kicker "Finance application coaching" and H1 unchanged.
- One subline only: "For students applying to banks, asset managers and the Big Four." Remove "Your finance application coach for…".
- The before/after example uses "Barista, local coffee shop (part-time)", not Caffè Nero.
- Under the CTA, one line: "Free · 10 mins · no card".
- **Live strip** under that, separated by a hairline:
  - 38px round host photo (`/assets/kayyor-rao.jpg` for Kayyor)
  - line 1: "**{title}** · {host}, {credential}"
  - line 2 (12.5px, muted): "● Live {day} {time} · free, open to everyone"
  - "Join →" on the right
  - Comes from the next session with `openToAll: true` in the next 14 days; hidden if there isn't one.
  - First session: "Ask me anything", Kayyor Rao, "20+ yrs in banking".
- Remove the old full live card from the hero.

## 2. Goldman line (its own short block, no card)
"360,000 applications to Goldman Sachs' 2025 internships. Under 1% got in.¹ Get rejected and it's usually next year before they look again. Make it count."

## 3. Decoder section (replaces "Why not just ask ChatGPT?" entirely)
- Kicker: "The part nobody tells you"
- H2: "Ten offers or none? It's knowing what's being scored."
- One card, three parts:
  1. "The question" / "Tell me about a time you worked in a team." (Garamond)
  2. "What ChatGPT writes" (red caps) / struck through in red: "I thrive in collaborative environments. In a group project, we divided tasks, communicated effectively and delivered on time." / "Polished. Obvious. And you'd never know why it failed." (red, 600)
  3. Dark --ink panel: "What's really being scored" (green caps) / "What *you* did. Every "we" hides you from the marker." / "They're listening for the moment you stepped in, what you decided, and what changed because of you."
- Line: "ChatGPT gives you the obvious answer, the same one it gives everyone. **We show you what's being scored.**"
- Remove the old comparison table, the 48% paragraph, footnote 2 and its source.

## 4. "One membership. Every round."
Keep the kicker, H2 and swipe strip. Remove the paragraph under the heading.

## 5. People
Firm logos → "Built and checked by people who've done the job." → team faces + "130+ years in finance · Meet the team →" → "See all live sessions →". No live card here.

## 6. Pricing (phone)
- Heading "A whole recruiting year for less than one CV rewrite." Remove the paragraph under it.
- Cydney's quote card (from `/data/testimonials.mjs`, slot 'pricing').
- £89 dark tile:
  - badge "Start here"; "a year · paid once · about £7.40 a month"
  - 3 lines: "Every weak CV line fixed", "Interview coach for your firm", "Tests and assessment centre practice"
  - "See everything included" expands the full list
  - button "Start with your free score →"
- Under the tile, two text links: "Or start free →" (`/assessment-start.html`) and "Want a person? Sessions from £99 →" (`/one-to-one.html`).
- Hide on phone: the Free tile, the practitioner tile, the deadline card.
- Desktop keeps three tiles: Free | Member | Practitioner from £99.

## 7. Final CTA
Unchanged. Keep the sticky phone bar "Get my free score · 10 mins · free", hidden while pricing or the final CTA is on screen.

## 8. Open live sessions (`openToAll: true`)
- "Join →" opens a one-field email form plus a consent checkbox. No assessment needed.
- The confirmation page and the 24h reminder email say: "Bring your score: get your free score before {day} and I'll answer questions about real results →" (`/assessment-start.html?src=live-{id}`).
- The follow-up email after the session has the recording link plus "Your next step: get your free score →".
- Admin dashboard per session: registered, attended (if available), free score within 7 days (`src=live-{id}`), £89 paid within 30 days.

Send Rao previews at 390px and 1280px with the screen count.
