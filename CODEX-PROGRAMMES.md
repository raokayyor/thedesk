# Codex: our own central programmes database

## Why
Today the programme list lives as a JS array inside `tracker.html` (read by `lib/programmes.mjs`). As of 18 Nov 2026 it holds:
- 61 programmes across 21 firms, last checked 13 Oct 2026
- 53 graduate schemes, 5 summer internships, 3 placements, **0 spring weeks**
- 14 with a closing date
- in the next 30 days, only 3 closing, all at Aon

Missing banks include Morgan Stanley, Bank of America, UBS, HSBC, Lloyds, NatWest, BNP Paribas, Rothschild, Lazard, Evercore and BlackRock.

The homepage deadline card, the tracker, alerts and the 30-day plan all read this list. It needs to become one central database that we own and maintain.

## Ground rule: our own data, from the firms themselves
- Every programme row is sourced from the **firm's own careers page** (or its official job posting). `source_url` must be on the firm's domain or its official applicant-tracking domain (e.g. Workday, Oracle, Avature, higher.gs.com).
- **Do not scrape, import or bulk-copy Trackr** (the-trackr.com) or any other aggregator (Bright Network, Gradcracker, etc.). Their compiled lists are their work and may be protected under UK database right and their terms. Rao and the team may look at them like any student would, to check we haven't missed a firm. Every row we store must still be verified on the firm's own page and stored with that firm URL.

## 1. Schema (Neon)
```sql
CREATE TABLE programmes (
  id            text PRIMARY KEY,            -- sha256(firm|name|cycle) first 16 hex, same as lib/programmes.mjs
  cycle         text NOT NULL,               -- '2026-27'
  firm          text NOT NULL,
  firm_group    text NOT NULL,               -- bb | ib | uk | am | big4 | acc | ins | markets
  name          text NOT NULL,               -- as the firm names it
  type          text NOT NULL,               -- Spring week | Summer internship | Off-cycle internship | Graduate | Placement
  division      text,                        -- IBD, Markets, Risk, Audit...
  location      text,                        -- London, Edinburgh...
  status        text NOT NULL DEFAULT 'unconfirmed',  -- notyet | open | closed | unconfirmed
  opens         date,
  closes        date,
  rolling       boolean NOT NULL DEFAULT false,
  entry         text,                        -- year of study / eligibility, short
  source_url    text NOT NULL,               -- firm's own page
  last_checked  timestamptz NOT NULL,
  checked_by    text NOT NULL,               -- email or 'auto'
  page_hash     text,                        -- hash of the source page text at last check
  notes         text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE programme_changes (            -- audit trail
  id bigserial PRIMARY KEY, programme_id text, field text, old_value text, new_value text,
  changed_by text, changed_at timestamptz DEFAULT now()
);
```
- Migrate the current 61 rows from `tracker.html` into the table (keep the ids).
- Change `lib/programmes.mjs` `loadProgrammes()` to read from the table, with a 10-minute cache. Keep the same return shape so the tracker, alerts, thirty-day-plan and `/api/home-summary` keep working.
- Remove the embedded array from `tracker.html` and fetch the rows from the API instead.

## 2. Admin page: `/programmes-admin.html` (staff only, same auth as knowledge-admin)
- **Table view:** filter by firm, type, status and "closing in 30 days". Sort by `last_checked`, oldest first.
- **Add / edit form** with every field. Refuse to save if:
  - `source_url` is not https or its domain isn't on the firm's allowed domains list (`data/firm-domains.mjs`)
  - `closes` is before `opens`
- A **"Checked today"** button on each row sets `last_checked` and `checked_by` without other changes.
- Every edit writes to `programme_changes`.
- **CSV export**, so Rao can work in a spreadsheet. **CSV import** too, which goes through the same validation and shows a preview before saving.

## 3. Weekly freshness check (Vercel cron, Monday 06:00 UK)
- For each row, fetch `source_url` (respect robots.txt, identify as `TheDeskBot (contact email)`, at most 1 request per domain per 5 seconds) and hash the visible text.
- If the hash changed, or the page 404s, flag the row "needs review" on the admin page. **Don't auto-edit dates.** A person confirms.
- Rows not checked for 21+ days also show as "stale" in admin.
- Firms whose pages need JavaScript and can't be fetched get flagged "manual check".

## 4. Seed list to fill before the season (Rao/team fill; Codex builds the tools)
Firms (UK, 2026-27):
- **Global banks:** Goldman Sachs, J.P. Morgan, Morgan Stanley, Bank of America, Citi, Barclays, Deutsche Bank, UBS, HSBC, BNP Paribas, Société Générale, Nomura, Jefferies, RBC Capital Markets, Wells Fargo
- **Advisory:** Rothschild & Co, Lazard, Evercore, Centerview, PJT Partners, Moelis, Perella Weinberg, Houlihan Lokey, Greenhill/Mizuho, Lincoln International
- **UK banks:** Lloyds Banking Group, NatWest Group, Santander UK
- **Asset management:** BlackRock, Schroders, M&G, abrdn, Fidelity International, LGIM, Invesco, Man Group
- **Big Four and accountancy:** PwC, Deloitte, EY, KPMG, BDO, Grant Thornton, RSM
- **Insurance:** the current 11

For each firm, add every UK spring week / insight programme, summer internship, off-cycle and graduate scheme on its careers site.

**Target before January:** all spring weeks and summer internships for the banks and advisory firms (these matter most to first- and second-years), then everything else.

## 5. Homepage deadline card (update)
- Read from the table.
- Show the next 3 closing in the next 30 days. Show well-known firms only, from the groups bb, ib, uk, am and big4; drop ins unless the visitor chose Insurance.
- Filter by the hero route chip if one was picked.
- Hide the card if fewer than 3 qualify.
- Each row shows "checked {n} days ago" and links to the firm's own page.

## 6. Trust line in the tracker
At the top of the tracker: "Every date is checked against the firm's own careers page. Last full check: {date}." Each row links to its `source_url`.

Send Rao:
- a preview of `/programmes-admin.html`
- the CSV export of the migrated 61 rows, so he can start filling the seed list
