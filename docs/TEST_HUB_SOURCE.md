# The Desk Test Hub — drop-in files

Copy into the repo root of raokayyor/thedesk:

- test-hub.html          -> /test-hub.html
- data/numerical.json    -> /data/numerical.json   (1,032 questions)
- data/technical.json    -> /data/technical.json   (1,032 questions; field "route")

The page loads the JSON with fetch, so both must sit beside it.

Deep links (for the result page's "worked answer" links):
  /test-hub.html?type=technical&route=accounting_audit&topic=Prepayments
  /test-hub.html?type=numerical&topic=Margin%20change%20in%20percentage%20points

Route values: accounting_audit, investment_banking, asset_management, markets.

Question fields: id, section, route (technical only), topic, difficulty (1-3), timeSec,
question, options[4], answer (index), working[], concept, trap, table (optional).

For the free assessment quiz: pick 5 technical items where route == profile route
(plus route "commercial_general"), and 5 numerical items. The "topic" field is what
goes into quiz.missed[].topic.

To regenerate: python3 gen_numerical.py numerical.json; python3 gen_technical.py technical.json
