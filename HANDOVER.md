# Handover — 25 November 2026

Branch: codex/sidebar-consistency. Always fetch before work on either PC; do not overwrite newer remote changes.

## Latest batch
Explore showcase: samples/amelia-interview-showcase.json stores the real weak answer, actual rewrite returned by production /api/free-tasters, and both scored submissions. Actual scores: 40 to 73. User explicitly approved sending these illustrative CV-derived sample answers to The Desk live Anthropic-backed scorer. No contact details sent.
Phone Explore: hero, weak/strong sample showcase, Closing soon, AMA. Desktop retains full shared dashboard and three tool cards; showcase replaces QOTD there too. QOTD remains on assessed non-explore dashboards. Do not simplify desktop again.
Scorer fingerprint is verified by scripts/build-amelia-showcase.mjs --check (Vercel build command). To refresh after scorer changes, deploy changed scorer first using a temporary approved deployment workflow, run generator against that scorer with SHOWCASE_BASE_URL, commit refreshed scores, then publish. Never invent scores.

## Validation
4 showcase tests and 7 shared-dashboard tests passed. Live scorer run completed. Published and verified: implementation commit ac1b67f; deployment dpl_APMkhv1xnVdDqBy8mie9nfydJTYs READY and aliased to thedesk.vercel.app. At 390x844 showcase height494px, no horizontal overflow, animation revealed, no QOTD. CTA tested through CV choice to fixed analysis question. At1280x800 all three desktop tool cards remain. Proof screenshots are on original PC under Documents/Codex/output/free-flow-polish-25nov/amelia-weak-strong-phone.jpg and explore-showcase-full-phone.jpg. User approved public GitHub/site publication of illustrative transcripts and scores.

## Preserved work
Full member-style Explore dashboard restored after unwanted simplification. Three cards: Interview coach, Assessment centre, Application help. Interview help, news/AMA row, Community retained on desktop. Hero sample-report link spacing fixed.
Crib: Use own CV or sample; dropdown Barclays available, other firms grey Member. Amelia saved Barclays sample full and PDF; own free document introduction only, remaining placeholder blur.

## Outstanding
Real iPhone microphone not physically verified. Newsflow source rebuild and seven-day Marketaux pilot are not complete. Do not claim those done.


## Latest steering after showcase (25 November)
Phone Explore final: dark hero, heading What a strong answer looks like, collapsed weak sample with See it fixed reveal (session remembered), six 130px swipe tool tiles plus More, three verified big-name deadlines, one firm-logo / Kayyor AMA card. No made-up practitioner photos. Sample proof has no large CTA on phone; revealed text links to assessment. Current scores remain40/73 from real endpoint. Tool names: Interview, Crib sheet, Application question help, CV line fix, Tests, Assessment centre. Standalone Group exercise removed; it remains in Assessment centre hub. More opens /desk-section.html?view=practise (verified).
Desktop uses six tiles in3x2; user is rethinking this section, leave alone beyond requested label changes. Desktop stray QOTD race fixed; assessed dashboards keep QOTD. Membership CTA centred (verified).
Official-source deadline supplement: data/explore-verified-deadlines.json, expires naturally by date, Barclays27Nov/HSBC29Nov/Lloyds29Nov verified25Nov. See sources in each row; no fake countdowns. Existing tracker API had only Aon dated.
Phone spacing verified390x844: 1334px total closed (~1.6screens), no horizontal overflow; team/event159px, deadlines223px, toolrow161px. Reveal remembers open. Proof at output/free-flow-polish-25nov/phone-tools-bottom-tight.jpg. Latest minor tile rename deployment pending; inspect latestVercel before reporting live. Previous verified live implementation e369731.
