// The Desk · trading game: a simulated market of fictional companies. Prices move only when staff publish the
// day's news. Each news event moves the whole market, whole sectors and/or single companies by a set %, plus a
// little random noise so not everything in a sector moves identically. Nothing here uses real market data.

export const STARTING_CASH = 100000;
export const SECTORS = ['Banks', 'Housebuilders', 'Energy', 'Technology', 'Retail', 'Pharma', 'Mining', 'Airlines', 'Utilities', 'Insurance'];

// Fictional companies. Names are invented and do not refer to real firms.
export const UNIVERSE = [
  { ticker: 'ALBN', name: 'Albion Bank', sector: 'Banks', price: 4.20 },
  { ticker: 'THMS', name: 'Thames Commercial Bank', sector: 'Banks', price: 2.85 },
  { ticker: 'NGTE', name: 'Northgate Homes', sector: 'Housebuilders', price: 11.40 },
  { ticker: 'BRKH', name: 'Brookfield Hale Homes', sector: 'Housebuilders', price: 6.75 },
  { ticker: 'NSEA', name: 'North Sea Energy', sector: 'Energy', price: 18.30 },
  { ticker: 'SOLR', name: 'Solent Renewables', sector: 'Energy', price: 3.10 },
  { ticker: 'QBIT', name: 'Quartz Bit Software', sector: 'Technology', price: 24.60 },
  { ticker: 'CHPN', name: 'Chipstone Semiconductors', sector: 'Technology', price: 15.20 },
  { ticker: 'MRKT', name: 'Market Row Retail', sector: 'Retail', price: 5.40 },
  { ticker: 'HIGH', name: 'High Street Fashion Group', sector: 'Retail', price: 1.95 },
  { ticker: 'CURA', name: 'Curamed Pharma', sector: 'Pharma', price: 32.10 },
  { ticker: 'VITA', name: 'Vitalis Biotech', sector: 'Pharma', price: 7.80 },
  { ticker: 'IRON', name: 'Ironbridge Mining', sector: 'Mining', price: 21.50 },
  { ticker: 'SKYW', name: 'Skyward Airlines', sector: 'Airlines', price: 2.40 },
  { ticker: 'NGRD', name: 'Northern Grid Power', sector: 'Utilities', price: 9.90 },
  { ticker: 'SHLD', name: 'Shieldline Insurance', sector: 'Insurance', price: 8.60 }
];

// News you can publish. Effects are % moves: market (everything), sectors, and single companies.
export const PRESETS = [
  { id: 'rate-cut', headline: 'Central bank cuts interest rates by 0.25%', body: 'The cut was expected by most economists. The governor said further cuts would be gradual.', why: 'Lower rates mean cheaper mortgages and borrowing. Housebuilders usually gain; banks can lose because the margin they earn on lending narrows.', effects: { market: 0.8, sectors: { Housebuilders: 4, Banks: -2, Utilities: 1.5, Retail: 1.5, Technology: 1.5 } } },
  { id: 'rate-hike', headline: 'Central bank raises interest rates by 0.25%', body: 'Inflation has stayed above target for longer than expected.', why: 'Higher rates cool spending and make debt dearer. Banks’ lending margins widen; housebuilders and growth companies usually fall.', effects: { market: -1, sectors: { Banks: 2, Housebuilders: -4.5, Technology: -2.5, Retail: -2, Utilities: -1.5 } } },
  { id: 'inflation-hot', headline: 'Inflation comes in higher than expected', body: 'Prices rose faster last month than forecasts, driven by food and energy.', why: 'Markets start to expect rates to stay higher for longer, which hits companies that rely on cheap borrowing or future growth.', effects: { market: -1.2, sectors: { Technology: -2.5, Housebuilders: -3, Retail: -2, Energy: 1.5, Banks: 1 } } },
  { id: 'oil-spike', headline: 'Oil price jumps 12% on supply disruption', body: 'A major export route has been disrupted, cutting supply.', why: 'Oil producers earn more per barrel. Airlines and anyone with big fuel bills see costs rise.', effects: { market: -0.5, sectors: { Energy: 7, Airlines: -8, Retail: -1.5, Mining: 1 } } },
  { id: 'oil-fall', headline: 'Oil price falls 10% as producers raise output', body: 'Major producers agreed to pump more, easing supply worries.', why: 'Cheaper fuel helps airlines and consumers; oil producers’ profits shrink.', effects: { market: 0.3, sectors: { Energy: -6, Airlines: 6, Retail: 1 } } },
  { id: 'tech-selloff', headline: 'Tech shares sell off on growth worries', body: 'A large overseas software company warned that customers are cutting budgets.', why: 'Investors pay for tech companies’ future growth, so any sign of slowing growth hits valuations hard, even for firms that didn’t warn.', effects: { market: -0.8, sectors: { Technology: -6 } } },
  { id: 'recession-fears', headline: 'Survey points to the economy shrinking', body: 'Business activity fell for a second month and orders are weakening.', why: 'In a downturn investors sell companies tied to spending and buy “defensive” ones whose sales hold up, like utilities and pharma.', effects: { market: -2, sectors: { Retail: -3, Banks: -3, Airlines: -4, Housebuilders: -3, Mining: -2.5, Utilities: 1.5, Pharma: 1.5 } } },
  { id: 'strong-jobs', headline: 'Strong jobs report: unemployment falls', body: 'More people are in work and wages are rising.', why: 'More people earning means more spending. Good for retailers and banks, though it can also delay rate cuts.', effects: { market: 1, sectors: { Retail: 2.5, Banks: 1.5, Housebuilders: 1 } } },
  { id: 'pound-falls', headline: 'The pound falls sharply against the dollar', body: 'Currency markets reacted to weaker UK growth forecasts.', why: 'Companies earning in dollars but reporting in pounds look better, so miners and pharma gain; importers like retailers pay more.', effects: { market: 0.2, sectors: { Mining: 3, Pharma: 2.5, Energy: 2, Retail: -2.5, Airlines: -1.5 } } },
  { id: 'housing-strong', headline: 'House prices rise for a third month', body: 'Mortgage approvals are also up.', why: 'Rising prices and more approvals point to higher sales and margins for housebuilders, and more mortgage lending for banks.', effects: { market: 0.4, sectors: { Housebuilders: 4.5, Banks: 1.5 } } },
  { id: 'takeover', headline: 'Takeover bid for a company', body: 'A rival has offered to buy the company at a premium to its share price.', why: 'A bid is usually pitched above the current price, so the target jumps towards the offer; the bidder often falls because it may be overpaying.', effects: { stocks: {} }, needsStock: 'target' },
  { id: 'profit-warning', headline: 'Profit warning', body: 'The company said full-year profits will be well below forecasts.', why: 'A warning resets expectations. The shares fall sharply, and rivals often slip too in case the problem is industry-wide.', effects: { stocks: {} }, needsStock: 'warning' },
  { id: 'calm', headline: 'A quiet day in markets', body: 'No major news. Prices drifted.', why: 'Most days look like this. Prices still move a little on small news and on people buying and selling.', effects: { market: 0.1 } }
];

// Pure: one company's % move for the day from the combined effects of every event published that day.
export function moveFor(company, events, noise = 0) {
  let m = 0;
  for (const e of events) {
    const fx = e.effects || {};
    m += Number(fx.market) || 0;
    m += Number(fx.sectors?.[company.sector]) || 0;
    m += Number(fx.stocks?.[company.ticker]) || 0;
  }
  return Math.max(-60, Math.min(80, m + noise));
}
export const applyMove = (price, pct) => Math.max(0.01, Math.round(price * (1 + pct / 100) * 100) / 100);

// Pure: validate the effects staff set on an event.
export function cleanEffects(fx, tickers) {
  const n = v => { const x = Number(v); return Number.isFinite(x) ? Math.max(-60, Math.min(80, Math.round(x * 10) / 10)) : 0; };
  const out = { market: n(fx?.market), sectors: {}, stocks: {} };
  for (const s of SECTORS) if (n(fx?.sectors?.[s])) out.sectors[s] = n(fx.sectors[s]);
  for (const t of tickers) if (n(fx?.stocks?.[t])) out.stocks[t] = n(fx.stocks[t]);
  return out;
}

// Pure: portfolio value at current prices.
export const portfolioValue = (cash, positions, prices) => Math.round((Number(cash) + Object.entries(positions || {}).reduce((s, [t, q]) => s + q * (prices[t] || 0), 0)) * 100) / 100;
