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

Latest verified release: implementation6ae52c1, deploymentdpl_zWwqrj27jLqyeZrM78Gj1fBXD7JA READY/productionalias. Browser verified Community has no explorePrompt. Tool labels verified: Interview / Crib sheet / Application question help / CV line fix / Tests / Assessment centre / More. Standalone Group exercise tile removed. Handover-only commits may follow without redeploy.

Latest phone corrections (supersedes earlier reveal instructions): starts COLLAPSED on every load (user corrected "not expanded"); reveal link retained, no remembered-open restoration. Removed Amelia first-try subtitle and Sample built from Amelia copy; retained Find the weak lines in yours link. Phone hero Start arrow label and personal finance careers coach tagline. Kayyor photo in phone AMA row. Desktop scores static40/73. Saved sample crib has3second preparing state (verified loader then PDF result). Latest verified implementation cc85e87; deployment dpl_5kdP2PzxCHEwgovM862nCasZnPFj READY and aliased. Browser verified390x844 collapsed=true, retained link after tap, photo assets/kayyor-rao.jpg. Final screenshot output/free-flow-polish-25nov/phone-ama-with-photo.jpg.

Latest release bd07bd9 (dpl_CsWtcaGwiTFeGXJQdjh2XDjW8cAp READY, production alias verified): homepage bottom CTA Explore more -> /my.html?explore=1, route-picker no longer overwrites it. Free report/CV nav always assessment-start; assessment profile/CV steps offer See a full sample report linking fullcycle.html?sample=amelia (no cvonly); browser clicked through and verified full Amelia sample. Trial assessment hub scoring blur has Full scoring guide / Unlock with membership card, sticky only from first locked rubric row to section bottom. It is injected server-side for nonmembers only; return URL assessment-centre after upgrade. Browser verified CSSsticky,6rows, bounding atscrollY1475; screenshot scoring-membership-unlock.jpg. Phone CV entry screenshot phone-cv-full-sample-option.jpg. Nav4 and phone-entry10 tests passed; syntax checked gateway.


## 25 Nov — assessment aims first + 15:45 homepage polish
- New four-phase assessment: aims (six routes, optional up to three firms) → CV → numerical → commercial. Profile legacy IDs retained hidden for compatible scoring; education is not invented. Name remains on review.
- Targets persist immediately in browser and through scoped `/api/assessment-targets`; own tool contexts and dashboard profile consume them. Amelia sample remains Barclays. Consulting explicitly uses commercial fundamentals (not a case test).
- Step views/completions now map numerical to 3, commercial to 4; pagehide records step_left.
- Homepage bottom CTA: See inside before you start / sample CV no sign-up / Explore The Desk: it's free / or start assessment. Live root source uses assessment instead of review.
- Phone Explore full-width assessment CTA, 5px proof meters, 12px change chips; Application help label. Deadline rows show firm names. Big-name eligible front-office filter excludes tech/data/operations/relationship management. Existing verified seed contains none eligible, so no fabricated deadlines.
- Practitioner logo provenance from data/home-practitioners.mjs: UBS Kayyor Rao + Neil Robertson; Commerzbank Kayyor; Barclays Jim Staples; J.P. Morgan Peter Cheley; EY Chris Sharkey. Awaiting user confirmation of stored biographies.
- 31 focused tests pass; scorer fingerprint unchanged. Local phone UI verified at390×844 (aims fits screen, Barclays personalised CV and bottom nav visible). Deployment and final production evidence recorded in chat.

Deadline follow-up: official Deutsche Bank UK application table confirms 2027 RISE Investment Banking & Capital Markets closes29Nov2026; saved as the eligible front-office seed. Removed the three tech/data/relationship-management seeds. Source https://careers.db.com/students-graduates/your-application/ . Show only verified eligible rows, even fewer than three. Final focused suite45pass.

Production verification: e981ed49241603e2f0fe3163e7c60ce055844afb READY, deployment dpl_5i1T2ZELPiYugWRKL1R5Zz7Fwszp, alias thedesk.vercel.app. Browser verified persisted target API ib/Barclays, personalised CV Step2 + bottom toolbar, full-width Explore CTA, collapsed proof on reload,5segments/5px,12px chips/3px9px, no viewport overflow. Live closing row Deutsche Bank RISE Investment Banking & Capital Markets4days. Homepage bottom CTA and pricing copy verified.

## Phone CV Next-button fix (user follow-up)
853c35c: removed the CSS rule hiding actions until extraction. CV step now keeps a fixed Next: short tests action above phone nav; disabled until readable CV+consent, Reading your CV while busy. Upload finally dispatches desk:cv-state after clearing busy to prevent stale phone readiness. Local390×844 UI verified; upload lifecycle regression test passes. Deployment dpl_CJDSXAA6on2W8QTK6JbQ4kgSc5c9 pending production verification in chat.
