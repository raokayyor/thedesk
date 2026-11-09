// The Desk · trading game: real markets, simulated prices.
// Students trade real assets (FTSE 100, crypto, oil, gold…). Prices start at levels staff set when a game starts
// (normally that day's real closing levels) and then move only when staff publish the day's news: each news event
// moves asset groups and/or single assets by a set %, plus a little random noise. These are NOT live prices, and
// every page says so.

export const STARTING_CASH = 100000;
export const GROUPS = ['UK shares', 'US shares', 'Crypto', 'Oil', 'Gold', 'Currency', 'Bonds'];
export const SECTORS = GROUPS;   // older name used by the news desk
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
  { ticker: 'GBPUSD', name: 'GBP/USD', sector: 'Currency', price: 1.32, dp: 4, hint: 'How many dollars one pound buys' },
  { ticker: 'GILT10', name: 'UK 10-year gilt (price)', sector: 'Bonds', price: 95, dp: 2, hint: 'UK government bond; its price rises when interest rates are expected to fall' }
];
export const dpOf = ticker => (UNIVERSE.find(u => u.ticker === ticker) || { dp: 2 }).dp;

// News you can publish. Effects are % moves: market = risk appetite (UK and US shares and crypto), groups (sectors), single assets (stocks).
export const PRESETS = [
  { id: 'boe-cut', headline: 'Bank of England cuts interest rates by 0.25%', body: 'The cut was expected by most economists. The governor said further cuts would be gradual.', why: 'Lower UK rates push gilt prices up and usually weaken the pound. UK-focused mid caps (FTSE 250) benefit most because their customers and debts are mostly in the UK.', effects: { market: 0.5, sectors: { 'UK shares': 0.5, Bonds: 1.5, Currency: -0.8, Gold: 0.5 }, stocks: { FTSE250: 1 } } },
  { id: 'boe-hike', headline: 'Bank of England raises interest rates by 0.25%', body: 'Inflation has stayed above target for longer than expected.', why: 'Higher rates make gilts worth less (their fixed payments look worse) and usually strengthen the pound. UK mid caps and anything bought for future growth tend to fall.', effects: { market: -0.8, sectors: { 'UK shares': -0.4, Bonds: -1.5, Currency: 0.8, Gold: -0.5 }, stocks: { FTSE250: -1 } } },
  { id: 'fed-cut', headline: 'The US Federal Reserve cuts interest rates', body: 'The Fed cut by a quarter point and signalled more to come.', why: 'Cheaper dollars lift US shares and crypto, and the dollar usually weakens, so GBP/USD rises. Gold, which pays no interest, looks more attractive when rates fall.', effects: { market: 1, sectors: { 'US shares': 0.6, Crypto: 2, Gold: 1, Currency: 0.6 } } },
  { id: 'uk-inflation', headline: 'UK inflation comes in higher than expected', body: 'Prices rose faster last month than forecasts, driven by food and energy.', why: 'Markets start to expect UK rates to stay higher for longer: gilt prices fall, the pound firms, and UK shares dip.', effects: { market: -0.3, sectors: { 'UK shares': -0.5, Bonds: -1.2, Currency: 0.4, Gold: 0.6 } } },
  { id: 'oil-spike', headline: 'Oil jumps 10% on supply disruption', body: 'A major export route has been disrupted, cutting supply.', why: 'Oil producers are a big part of the FTSE 100, so it holds up better than US shares. Higher energy costs also feed inflation worries.', effects: { market: -0.5, sectors: { Oil: 10, 'UK shares': 0.6, 'US shares': -0.6, Gold: 0.5 } } },
  { id: 'oil-fall', headline: 'Oil falls 8% as producers raise output', body: 'Major producers agreed to pump more, easing supply worries.', why: 'Cheaper oil hurts the FTSE 100’s energy giants but helps inflation and consumers, which suits US shares.', effects: { sectors: { Oil: -8, 'UK shares': -0.5, 'US shares': 0.5 } } },
  { id: 'tech-selloff', headline: 'Tech shares sell off on growth worries', body: 'A large US software company warned that customers are cutting budgets.', why: 'Investors pay for tech companies’ future growth, so any sign of slowing growth hits the Nasdaq hardest. Crypto often falls with tech because the same investors own both.', effects: { market: -1, sectors: { 'US shares': -1, Crypto: -3, Bonds: 0.4, Gold: 0.3 }, stocks: { NDX: -2 } } },
  { id: 'recession', headline: 'Surveys point to the global economy shrinking', body: 'Business activity fell for a second month and orders are weakening.', why: 'In a downturn investors sell risky assets and buy safe havens: government bonds and gold. Oil falls because a weaker economy uses less of it.', effects: { market: -2, sectors: { Crypto: -3, Oil: -4, Bonds: 1.2, Gold: 1.5, Currency: -0.6 } } },
  { id: 'us-jobs', headline: 'Strong US jobs report', body: 'The US added far more jobs than expected and wages are rising.', why: 'A strong economy is good for company profits, but it can delay rate cuts, which strengthens the dollar (GBP/USD falls) and weighs on gold.', effects: { market: 0.5, sectors: { 'US shares': 0.3, Currency: -0.5, Gold: -0.8 } } },
  { id: 'pound-falls', headline: 'The pound falls sharply', body: 'Currency markets reacted to weaker UK growth forecasts.', why: 'Most FTSE 100 companies earn in dollars, so a weaker pound boosts their sterling profits; the more UK-focused FTSE 250 falls.', effects: { sectors: { Currency: -2 }, stocks: { FTSE100: 1, FTSE250: -0.8 } } },
  { id: 'crypto-rally', headline: 'Crypto rallies as big investors pile in', body: 'Large funds reported record inflows into crypto products.', why: 'Crypto prices are driven by demand and sentiment more than earnings, so big new buyers can move them a long way quickly.', effects: { sectors: { Crypto: 8 } } },
  { id: 'crypto-crash', headline: 'Crypto falls sharply after an exchange collapses', body: 'A large crypto exchange halted withdrawals.', why: 'A failure inside the crypto system shakes confidence across all coins. Traditional markets barely notice.', effects: { sectors: { Crypto: -12 } } },
  { id: 'tension', headline: 'Geopolitical tension rises', body: 'Markets reacted to escalating tension in a major oil-producing region.', why: 'Investors move to safe havens (gold, government bonds) and oil rises on supply fears. Shares and crypto dip.', effects: { market: -1.5, sectors: { Gold: 2.5, Oil: 4, Bonds: 0.8 } } },
  { id: 'calm', headline: 'A quiet day in markets', body: 'No major news. Prices drifted.', why: 'Most days look like this. Prices still move a little as people buy and sell.', effects: { market: 0.1 } }
];

// Pure: one asset's % move for the day from every event published that day.
export function moveFor(asset, events, noise = 0) {
  let m = 0;
  for (const e of events) {
    const fx = e.effects || {};
    if (RISK.includes(asset.sector)) m += (Number(fx.market) || 0) * (asset.sector === 'Crypto' ? 2 : 1);   // crypto moves about twice as much on risk appetite
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
export const NOISE = { 'UK shares': 0.5, 'US shares': 0.6, Crypto: 2, Oil: 1.2, Gold: 0.5, Currency: 0.25, Bonds: 0.3 };

export function cleanEffects(fx, tickers) {
  const n = v => { const x = Number(v); return Number.isFinite(x) ? Math.max(-60, Math.min(80, Math.round(x * 10) / 10)) : 0; };
  const out = { market: n(fx?.market), sectors: {}, stocks: {} };
  for (const s of GROUPS) if (n(fx?.sectors?.[s])) out.sectors[s] = n(fx.sectors[s]);
  for (const t of tickers) if (n(fx?.stocks?.[t])) out.stocks[t] = n(fx.stocks[t]);
  return out;
}
export const portfolioValue = (cash, positions, prices) => Math.round((Number(cash) + Object.entries(positions || {}).reduce((s, [t, q]) => s + Number(q) * (prices[t] || 0), 0)) * 100) / 100;
export const QTY_DP = 3;   // units can be fractional (e.g. 0.25 Bitcoin), to 3 decimal places
