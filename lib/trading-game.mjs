// The Desk · trading game: real markets, simulated prices.
// Students trade real assets (FTSE 100, crypto, oil, gold…). Prices start at levels staff set when a game starts
// (normally that day's real closing levels) and then move only when staff publish the day's news: each news event
// moves asset groups and/or single assets by a set %, plus a little random noise. These are NOT live prices, and
// every page says so.

export const STARTING_CASH = 100000;
// Cash earns interest at the game's Bank Rate, paid on every news day (252 trading days a year).
export const DEFAULT_CASH_RATE = 4;
export const DAYS_PER_YEAR = 252;
export const dailyInterest = (cash, ratePct) => Math.round(Number(cash) * (Number(ratePct) / 100 / DAYS_PER_YEAR) * 100) / 100;
// Bid/offer spread (total, as % of the mid price): you buy at the offer and sell at the bid, like a real broker.
export const SPREADS = { 'UK shares': 0.05, 'US shares': 0.05, Crypto: 0.5, Oil: 0.1, Gold: 0.1, Copper: 0.15, Currency: 0.03, Dollar: 0.03, Bonds: 0.05 };
export const COMPANY_SPREAD = 0.2;
export const MAX_HOLDINGS = 10;   // up to 10 different investments at once
export const GROUPS = ['UK shares', 'US shares', 'Crypto', 'Oil', 'Gold', 'Copper', 'Currency', 'Dollar', 'Bonds'];
// Company sectors. A company also moves with its home market (UK shares or US shares) and with risk appetite.
export const COMPANY_SECTORS = ['Banks', 'Energy', 'Pharma', 'Consumer', 'Miners', 'Defence & industrials', 'Tech', 'Telecoms & utilities', 'Financial services', 'Housebuilders', 'Retail & leisure'];
export const SECTORS = [...GROUPS, ...COMPANY_SECTORS];   // everything the news desk can move by group
const RISK = ['UK shares', 'US shares', 'Crypto'];   // "risk appetite" moves these together

// Default starting levels are placeholders: set today's real closes when you start a game.
export const UNIVERSE = [
  { ticker: 'FTSE100', name: 'FTSE 100', sector: 'UK shares', price: 9500, dp: 0, hint: 'The UK’s 100 biggest listed companies; lots of overseas earners, oil, banks and miners' },
  { ticker: 'FTSE250', name: 'FTSE 250', sector: 'UK shares', price: 21500, dp: 0, hint: 'Mid-sized, more UK-focused companies; more sensitive to the UK economy and rates' },
  { ticker: 'SPX', name: 'S&P 500', sector: 'US shares', price: 6600, dp: 0, hint: 'The 500 biggest US companies' },
  { ticker: 'NDX', name: 'Nasdaq 100', sector: 'US shares', price: 24000, dp: 0, hint: 'The biggest US tech and growth companies' },
  { ticker: 'BTC', name: 'Bitcoin', sector: 'Crypto', price: 90000, dp: 0, hint: 'The largest cryptocurrency; very volatile' },
  { ticker: 'ETH', name: 'Ethereum', sector: 'Crypto', price: 3000, dp: 0, hint: 'The second-largest cryptocurrency' },
  { ticker: 'BRENT', name: 'Brent crude oil', sector: 'Oil', price: 65, dp: 2, hint: 'The global oil benchmark, per barrel' },
  { ticker: 'GOLD', name: 'Gold', sector: 'Gold', price: 4000, dp: 0, hint: 'Per ounce; a “safe haven” when investors are nervous' },
  { ticker: 'COPPER', name: 'Copper', sector: 'Copper', price: 10500, dp: 0, hint: 'Per tonne; a barometer for global growth and China' },
  { ticker: 'GBPUSD', name: 'GBP/USD', sector: 'Currency', price: 1.32, dp: 4, hint: 'How many dollars one pound buys' },
  { ticker: 'GBPEUR', name: 'GBP/EUR', sector: 'Currency', price: 1.14, dp: 4, hint: 'How many euros one pound buys' },
  { ticker: 'EURUSD', name: 'EUR/USD', sector: 'Dollar', price: 1.16, dp: 4, hint: 'How many dollars one euro buys; rises when the dollar weakens' },
  { ticker: 'GILT10', name: 'UK 10-year gilt (price)', sector: 'Bonds', price: 95, dp: 2, hint: 'UK government bond; its price rises when interest rates are expected to fall' },
  // Companies: about 70 big UK (FTSE 100) names and 30 big US names. Prices are £ per share for the game; set real levels when you start a game.
  ...[
    ['AZN', 'AstraZeneca', 'Pharma', 'UK', 120, 'Medicines'],
    ['GSK', 'GSK', 'Pharma', 'UK', 15, 'Medicines and vaccines'],
    ['HLN', 'Haleon', 'Pharma', 'UK', 3.7, 'Consumer health brands'],
    ['SN', 'Smith & Nephew', 'Pharma', 'UK', 12, 'Medical devices'],
    ['SHEL', 'Shell', 'Energy', 'UK', 27, 'Oil and gas'],
    ['BP', 'BP', 'Energy', 'UK', 4.3, 'Oil and gas'],
    ['CNA', 'Centrica', 'Energy', 'UK', 1.6, 'Energy supplier (British Gas)'],
    ['HSBA', 'HSBC', 'Banks', 'UK', 10, 'Global bank'],
    ['BARC', 'Barclays', 'Banks', 'UK', 3.8, 'UK and investment bank'],
    ['LLOY', 'Lloyds Banking Group', 'Banks', 'UK', 0.85, 'UK high-street and mortgage bank'],
    ['NWG', 'NatWest Group', 'Banks', 'UK', 5.5, 'UK high-street bank'],
    ['STAN', 'Standard Chartered', 'Banks', 'UK', 14, 'Bank focused on Asia, Africa, Middle East'],
    ['PRU', 'Prudential', 'Financial services', 'UK', 9.5, 'Insurance in Asia and Africa'],
    ['LGEN', 'Legal & General', 'Financial services', 'UK', 2.4, 'Insurance, pensions, investments'],
    ['AV', 'Aviva', 'Financial services', 'UK', 6.4, 'Insurance'],
    ['ADM', 'Admiral', 'Financial services', 'UK', 30, 'Car and home insurance'],
    ['PHNX', 'Phoenix Group', 'Financial services', 'UK', 6.5, 'Pensions and savings'],
    ['MNG', 'M&G', 'Financial services', 'UK', 2.6, 'Asset management and savings'],
    ['SDR', 'Schroders', 'Financial services', 'UK', 3.8, 'Asset management'],
    ['III', '3i Group', 'Financial services', 'UK', 40, 'Private equity'],
    ['LSEG', 'London Stock Exchange Group', 'Financial services', 'UK', 90, 'Exchange and market data'],
    ['ULVR', 'Unilever', 'Consumer', 'UK', 45, 'Household and food brands'],
    ['DGE', 'Diageo', 'Consumer', 'UK', 18, 'Drinks'],
    ['BATS', 'British American Tobacco', 'Consumer', 'UK', 40, 'Tobacco and nicotine'],
    ['IMB', 'Imperial Brands', 'Consumer', 'UK', 30, 'Tobacco'],
    ['RKT', 'Reckitt', 'Consumer', 'UK', 55, 'Household and health brands'],
    ['ABF', 'Associated British Foods', 'Consumer', 'UK', 21, 'Food and Primark'],
    ['CCH', 'Coca-Cola HBC', 'Consumer', 'UK', 35, 'Coca-Cola bottler'],
    ['TSCO', 'Tesco', 'Retail & leisure', 'UK', 4.4, 'Supermarkets'],
    ['SBRY', 'Sainsbury’s', 'Retail & leisure', 'UK', 3.0, 'Supermarkets'],
    ['MKS', 'Marks & Spencer', 'Retail & leisure', 'UK', 3.7, 'Clothing and food'],
    ['NXT', 'Next', 'Retail & leisure', 'UK', 130, 'Clothing retailer'],
    ['JD', 'JD Sports', 'Retail & leisure', 'UK', 0.9, 'Sportswear retailer'],
    ['KGF', 'Kingfisher', 'Retail & leisure', 'UK', 3.0, 'B&Q and Screwfix'],
    ['BRBY', 'Burberry', 'Retail & leisure', 'UK', 11, 'Luxury fashion'],
    ['CPG', 'Compass Group', 'Retail & leisure', 'UK', 26, 'Catering'],
    ['WTB', 'Whitbread', 'Retail & leisure', 'UK', 28, 'Premier Inn hotels'],
    ['IHG', 'InterContinental Hotels', 'Retail & leisure', 'UK', 90, 'Hotels'],
    ['ENT', 'Entain', 'Retail & leisure', 'UK', 8, 'Betting and gaming'],
    ['IAG', 'International Airlines Group', 'Retail & leisure', 'UK', 4.0, 'British Airways owner'],
    ['EZJ', 'easyJet', 'Retail & leisure', 'UK', 5.0, 'Budget airline'],
    ['RIO', 'Rio Tinto', 'Miners', 'UK', 48, 'Iron ore and metals'],
    ['GLEN', 'Glencore', 'Miners', 'UK', 3.3, 'Metals, coal and trading'],
    ['AAL', 'Anglo American', 'Miners', 'UK', 25, 'Copper and metals'],
    ['ANTO', 'Antofagasta', 'Miners', 'UK', 25, 'Copper mining'],
    ['FRES', 'Fresnillo', 'Miners', 'UK', 15, 'Silver and gold mining'],
    ['BAES', 'BAE Systems', 'Defence & industrials', 'UK', 18, 'Defence'],
    ['RR', 'Rolls-Royce', 'Defence & industrials', 'UK', 11, 'Aircraft engines and defence'],
    ['BAB', 'Babcock', 'Defence & industrials', 'UK', 10, 'Defence services'],
    ['SMIN', 'Smiths Group', 'Defence & industrials', 'UK', 22, 'Engineering'],
    ['WEIR', 'Weir Group', 'Defence & industrials', 'UK', 23, 'Mining equipment'],
    ['MRO', 'Melrose', 'Defence & industrials', 'UK', 5.5, 'Aerospace parts'],
    ['AHT', 'Ashtead', 'Defence & industrials', 'UK', 50, 'Equipment rental'],
    ['BNZL', 'Bunzl', 'Defence & industrials', 'UK', 23, 'Distribution'],
    ['RTO', 'Rentokil', 'Defence & industrials', 'UK', 3.8, 'Pest control'],
    ['ITRK', 'Intertek', 'Defence & industrials', 'UK', 47, 'Testing and inspection'],
    ['HLMA', 'Halma', 'Defence & industrials', 'UK', 33, 'Safety technology'],
    ['CRDA', 'Croda', 'Defence & industrials', 'UK', 28, 'Speciality chemicals'],
    ['MNDI', 'Mondi', 'Defence & industrials', 'UK', 10, 'Packaging'],
    ['REL', 'RELX', 'Tech', 'UK', 35, 'Data and analytics'],
    ['EXPN', 'Experian', 'Tech', 'UK', 37, 'Credit data'],
    ['SGE', 'Sage', 'Tech', 'UK', 11, 'Accounting software'],
    ['AUTO', 'Auto Trader', 'Tech', 'UK', 8, 'Online car marketplace'],
    ['RMV', 'Rightmove', 'Tech', 'UK', 7.5, 'Property website'],
    ['PSON', 'Pearson', 'Tech', 'UK', 11, 'Education'],
    ['INF', 'Informa', 'Tech', 'UK', 8.5, 'Events and publishing'],
    ['WPP', 'WPP', 'Tech', 'UK', 4.0, 'Advertising'],
    ['VOD', 'Vodafone', 'Telecoms & utilities', 'UK', 0.9, 'Mobile networks'],
    ['BT', 'BT Group', 'Telecoms & utilities', 'UK', 1.9, 'Broadband and phones'],
    ['NG', 'National Grid', 'Telecoms & utilities', 'UK', 11, 'Electricity and gas networks'],
    ['SSE', 'SSE', 'Telecoms & utilities', 'UK', 18, 'Renewables and networks'],
    ['SVT', 'Severn Trent', 'Telecoms & utilities', 'UK', 27, 'Water'],
    ['UU', 'United Utilities', 'Telecoms & utilities', 'UK', 11.5, 'Water'],
    ['PSN', 'Persimmon', 'Housebuilders', 'UK', 12, 'Housebuilder'],
    ['TW', 'Taylor Wimpey', 'Housebuilders', 'UK', 1.1, 'Housebuilder'],
    ['BTRW', 'Barratt Redrow', 'Housebuilders', 'UK', 4.0, 'Housebuilder'],
    ['BKG', 'Berkeley Group', 'Housebuilders', 'UK', 40, 'London housebuilder'],
    ['LAND', 'Land Securities', 'Housebuilders', 'UK', 6.0, 'Commercial property'],
    ['BLND', 'British Land', 'Housebuilders', 'UK', 3.8, 'Commercial property'],
    ['SGRO', 'Segro', 'Housebuilders', 'UK', 7.0, 'Warehouses'],
    ['AAPL', 'Apple', 'Tech', 'US', 250, 'iPhone and services'],
    ['MSFT', 'Microsoft', 'Tech', 'US', 500, 'Software and cloud'],
    ['NVDA', 'Nvidia', 'Tech', 'US', 180, 'AI chips'],
    ['AMZN', 'Amazon', 'Tech', 'US', 220, 'Online retail and cloud'],
    ['GOOGL', 'Alphabet (Google)', 'Tech', 'US', 250, 'Search, ads and cloud'],
    ['META', 'Meta', 'Tech', 'US', 700, 'Social media and ads'],
    ['TSLA', 'Tesla', 'Tech', 'US', 400, 'Electric cars; very volatile'],
    ['AVGO', 'Broadcom', 'Tech', 'US', 330, 'Chips and software'],
    ['AMD', 'AMD', 'Tech', 'US', 230, 'Chips'],
    ['ORCL', 'Oracle', 'Tech', 'US', 250, 'Databases and cloud'],
    ['CRM', 'Salesforce', 'Tech', 'US', 250, 'Business software'],
    ['JPM', 'JPMorgan Chase', 'Banks', 'US', 300, 'US bank'],
    ['BAC', 'Bank of America', 'Banks', 'US', 50, 'US bank'],
    ['GS', 'Goldman Sachs', 'Banks', 'US', 750, 'Investment bank'],
    ['MS', 'Morgan Stanley', 'Banks', 'US', 150, 'Investment bank and wealth'],
    ['V', 'Visa', 'Financial services', 'US', 340, 'Card payments'],
    ['MA', 'Mastercard', 'Financial services', 'US', 570, 'Card payments'],
    ['LLY', 'Eli Lilly', 'Pharma', 'US', 800, 'Medicines, incl. weight-loss drugs'],
    ['JNJ', 'Johnson & Johnson', 'Pharma', 'US', 180, 'Medicines and devices'],
    ['PFE', 'Pfizer', 'Pharma', 'US', 25, 'Medicines'],
    ['XOM', 'ExxonMobil', 'Energy', 'US', 110, 'Oil and gas'],
    ['CVX', 'Chevron', 'Energy', 'US', 155, 'Oil and gas'],
    ['KO', 'Coca-Cola', 'Consumer', 'US', 70, 'Soft drinks'],
    ['PEP', 'PepsiCo', 'Consumer', 'US', 145, 'Drinks and snacks'],
    ['PG', 'Procter & Gamble', 'Consumer', 'US', 155, 'Household brands'],
    ['WMT', 'Walmart', 'Retail & leisure', 'US', 100, 'Supermarkets'],
    ['COST', 'Costco', 'Retail & leisure', 'US', 950, 'Warehouse clubs'],
    ['MCD', 'McDonald’s', 'Retail & leisure', 'US', 300, 'Restaurants'],
    ['NKE', 'Nike', 'Retail & leisure', 'US', 65, 'Sportswear'],
    ['DIS', 'Disney', 'Retail & leisure', 'US', 115, 'Media and theme parks'],
    ['BA', 'Boeing', 'Defence & industrials', 'US', 210, 'Aircraft'],
    ['CAT', 'Caterpillar', 'Defence & industrials', 'US', 500, 'Construction machinery']
  ].map(([ticker, name, sector, region, price, hint]) => ({ ticker, name, sector, region, price, dp: 2, hint }))
];
export const dpOf = ticker => (UNIVERSE.find(u => u.ticker === ticker) || { dp: 2 }).dp;

// News you can publish. Effects are % moves: market = risk appetite (UK and US shares and crypto), groups (sectors), single assets (stocks).
export const PRESETS = [
  { id: 'boe-cut', headline: 'Bank of England cuts interest rates by 0.25%', body: 'The cut was expected by most economists. The governor said further cuts would be gradual.', why: 'Lower UK rates push gilt prices up and usually weaken the pound. UK-focused mid caps (FTSE 250) benefit most because their customers and debts are mostly in the UK. Cash in the game now earns 0.25% less.', effects: { bankRate: -0.25, market: 0.5, sectors: { 'Retail & leisure': 1, Housebuilders: 3, Banks: -1, 'Telecoms & utilities': 1, 'Financial services': 0.5, 'UK shares': 0.5, Bonds: 1.5, Currency: -0.8, Gold: 0.5 }, stocks: { FTSE250: 1 } } },
  { id: 'boe-hike', headline: 'Bank of England raises interest rates by 0.25%', body: 'Inflation has stayed above target for longer than expected.', why: 'Higher rates make gilts worth less (their fixed payments look worse) and usually strengthen the pound. UK mid caps and anything bought for future growth tend to fall. Cash in the game now earns 0.25% more.', effects: { bankRate: 0.25, market: -0.8, sectors: { 'Retail & leisure': -1, Housebuilders: -3.5, Banks: 1.5, 'Telecoms & utilities': -1, 'UK shares': -0.4, Bonds: -1.5, Currency: 0.8, Gold: -0.5 }, stocks: { FTSE250: -1 } } },
  { id: 'fed-cut', headline: 'The US Federal Reserve cuts interest rates', body: 'The Fed cut by a quarter point and signalled more to come.', why: 'Cheaper dollars lift US shares and crypto, and the dollar usually weakens, so GBP/USD rises. Gold, which pays no interest, looks more attractive when rates fall.', effects: { market: 1, sectors: { Dollar: 0.6, Tech: 1.5, 'US shares': 0.6, Crypto: 2, Gold: 1, Currency: 0.6 } } },
  { id: 'uk-inflation', headline: 'UK inflation comes in higher than expected', body: 'Prices rose faster last month than forecasts, driven by food and energy.', why: 'Markets start to expect UK rates to stay higher for longer: gilt prices fall, the pound firms, and UK shares dip.', effects: { market: -0.3, sectors: { Housebuilders: -2, Consumer: -0.8, 'UK shares': -0.5, Bonds: -1.2, Currency: 0.4, Gold: 0.6 } } },
  { id: 'oil-spike', headline: 'Oil jumps 10% on supply disruption', body: 'A major export route has been disrupted, cutting supply.', why: 'Oil producers are a big part of the FTSE 100, so it holds up better than US shares. Higher energy costs also feed inflation worries.', effects: { market: -0.5, sectors: { 'Retail & leisure': -1.5, Energy: 5, Consumer: -1, Oil: 10, 'UK shares': 0.6, 'US shares': -0.6, Gold: 0.5 }, stocks: { IAG: -5, EZJ: -5 } } },
  { id: 'oil-fall', headline: 'Oil falls 8% as producers raise output', body: 'Major producers agreed to pump more, easing supply worries.', why: 'Cheaper oil hurts the FTSE 100’s energy giants but helps inflation and consumers, which suits US shares.', effects: { sectors: { 'Retail & leisure': 1.5, Energy: -4, Consumer: 0.6, Oil: -8, 'UK shares': -0.5, 'US shares': 0.5 }, stocks: { IAG: 4, EZJ: 4 } } },
  { id: 'tech-selloff', headline: 'Tech shares sell off on growth worries', body: 'A large US software company warned that customers are cutting budgets.', why: 'Investors pay for tech companies’ future growth, so any sign of slowing growth hits the Nasdaq hardest. Crypto often falls with tech because the same investors own both.', effects: { market: -1, sectors: { Tech: -4, 'US shares': -1, Crypto: -3, Bonds: 0.4, Gold: 0.3 }, stocks: { NDX: -2 } } },
  { id: 'recession', headline: 'Surveys point to the global economy shrinking', body: 'Business activity fell for a second month and orders are weakening.', why: 'In a downturn investors sell risky assets and buy safe havens: government bonds and gold. Oil falls because a weaker economy uses less of it.', effects: { market: -2, sectors: { Copper: -3, 'Retail & leisure': -2, Banks: -2.5, Miners: -3, Housebuilders: -3, Energy: -2, Pharma: 1, 'Telecoms & utilities': 1, Crypto: -3, Oil: -4, Bonds: 1.2, Gold: 1.5, Currency: -0.6 } } },
  { id: 'us-jobs', headline: 'Strong US jobs report', body: 'The US added far more jobs than expected and wages are rising.', why: 'A strong economy is good for company profits, but it can delay rate cuts, which strengthens the dollar (GBP/USD falls) and weighs on gold.', effects: { market: 0.5, sectors: { Dollar: -0.5, Banks: 1, Consumer: 0.5, 'US shares': 0.3, Currency: -0.5, Gold: -0.8 } } },
  { id: 'pound-falls', headline: 'The pound falls sharply', body: 'Currency markets reacted to weaker UK growth forecasts.', why: 'Most FTSE 100 companies earn in dollars, so a weaker pound boosts their sterling profits; the more UK-focused FTSE 250 falls.', effects: { sectors: { 'Retail & leisure': -1, Miners: 2, Pharma: 1.5, Energy: 1.5, Housebuilders: -1.5, Currency: -2 }, stocks: { FTSE100: 1, FTSE250: -0.8 } } },
  { id: 'crypto-rally', headline: 'Crypto rallies as big investors pile in', body: 'Large funds reported record inflows into crypto products.', why: 'Crypto prices are driven by demand and sentiment more than earnings, so big new buyers can move them a long way quickly.', effects: { sectors: { Crypto: 8 } } },
  { id: 'crypto-crash', headline: 'Crypto falls sharply after an exchange collapses', body: 'A large crypto exchange halted withdrawals.', why: 'A failure inside the crypto system shakes confidence across all coins. Traditional markets barely notice.', effects: { sectors: { Crypto: -12 } } },
  { id: 'tension', headline: 'Geopolitical tension rises', body: 'Markets reacted to escalating tension in a major oil-producing region.', why: 'Investors move to safe havens (gold, government bonds) and oil rises on supply fears. Shares and crypto dip.', effects: { market: -1.5, sectors: { 'Retail & leisure': -1.5, 'Defence & industrials': 4, Energy: 3, Miners: 1, Gold: 2.5, Oil: 4, Bonds: 0.8 } } },
  { id: 'china-stimulus', headline: 'China announces a big stimulus package', body: 'Beijing unveiled spending on infrastructure and support for its property market.', why: 'China is the biggest buyer of metals. More building means more demand for copper and iron ore, so miners and copper rise.', effects: { market: 0.5, sectors: { Copper: 4, Miners: 4, Oil: 1.5 } } },
  { id: 'earnings-beat', headline: '[Company] beats profit forecasts', body: 'Results came in ahead of what analysts expected, and the company raised its outlook.', why: 'Share prices reflect what investors expect. Beating those expectations, and raising guidance, pushes the price up.', effects: { stocks: {} }, needsStock: 'beat' },
  { id: 'earnings-miss', headline: '[Company] misses profit forecasts', body: 'Results fell short of what analysts expected.', why: 'Missing expectations matters more than the size of the profit itself: investors reprice for a lower future.', effects: { stocks: {} }, needsStock: 'miss' },
  { id: 'takeover', headline: 'Takeover bid for [Company]', body: 'A rival has offered to buy the company at a premium to its share price.', why: 'A bid is usually pitched above the current price, so the target jumps towards the offer price.', effects: { stocks: {} }, needsStock: 'target' },
  { id: 'profit-warning', headline: '[Company] issues a profit warning', body: 'The company said full-year profits will be well below forecasts.', why: 'A warning resets expectations sharply. The shares fall, and rivals often slip in case the problem is industry-wide.', effects: { stocks: {} }, needsStock: 'warning' },
  { id: 'calm', headline: 'A quiet day in markets', body: 'No major news. Prices drifted.', why: 'Most days look like this. Prices still move a little as people buy and sell.', effects: { market: 0.1 } }
];

// Pure: one asset's % move for the day from every event published that day.
export function moveFor(asset, events, noise = 0) {
  let m = 0;
  for (const e of events) {
    const fx = e.effects || {};
    if (RISK.includes(asset.sector) || asset.region) m += (Number(fx.market) || 0) * (asset.sector === 'Crypto' ? 2 : 1);   // crypto moves about twice as much on risk appetite
    if (asset.region === 'UK') m += Number(fx.sectors?.['UK shares']) || 0;   // companies move with their home market too
    if (asset.region === 'US') m += Number(fx.sectors?.['US shares']) || 0;
    m += Number(fx.sectors?.[asset.sector]) || 0;
    m += Number(fx.stocks?.[asset.ticker]) || 0;
  }
  return Math.max(-60, Math.min(80, m + noise));
}
export function applyMove(price, pct, dp = 2) {
  const f = 10 ** Math.max(dp, 2);   // store at least 2 dp; FX to 4
  return Math.max(1 / f, Math.round(price * (1 + pct / 100) * f) / f);
}
// Noise scales with how volatile the asset is (crypto moves more on a quiet day than gilts).
export const NOISE = { 'UK shares': 0.5, 'US shares': 0.6, Crypto: 2, Oil: 1.2, Gold: 0.5, Copper: 1, Currency: 0.25, Dollar: 0.25, Bonds: 0.3, Tech: 1.5 };   // single companies default to 1%

export function cleanEffects(fx, tickers) {
  const n = v => { const x = Number(v); return Number.isFinite(x) ? Math.max(-60, Math.min(80, Math.round(x * 10) / 10)) : 0; };
  const out = { market: n(fx?.market), sectors: {}, stocks: {} };
  const br = Number(fx?.bankRate); if (Number.isFinite(br) && br) out.bankRate = Math.max(-2, Math.min(2, Math.round(br * 100) / 100));
  for (const s of SECTORS) if (n(fx?.sectors?.[s])) out.sectors[s] = n(fx.sectors[s]);   // asset groups and company sectors
  for (const t of tickers) if (n(fx?.stocks?.[t])) out.stocks[t] = n(fx.stocks[t]);
  return out;
}
export function quote(mid, asset) {
  const sp = asset?.region ? COMPANY_SPREAD : (SPREADS[asset?.sector] ?? 0.2), f = 10 ** Math.max(asset?.dp ?? 2, 2);
  const bid = Math.floor(mid * (1 - sp / 200) * f) / f, offer = Math.ceil(mid * (1 + sp / 200) * f) / f;
  return { bid, offer, spreadPct: sp };
}
export const portfolioValue = (cash, positions, prices) => Math.round((Number(cash) + Object.entries(positions || {}).reduce((s, [t, q]) => s + Number(q) * (prices[t] || 0), 0)) * 100) / 100;
export const QTY_DP = 6;   // units can be fractional (e.g. 0.25 Bitcoin), to 6 decimal places
