"""Build the route-specific technical bank.

Two sources:
  1. Hand-written concept questions (technical_concepts.py).
  2. Calculation families per route, generated from parameters so answers are computed.
Every item is validated: four distinct options and one correct answer.
"""
import json, random, sys
from technical_concepts import CONCEPTS
from qfmt import h, trim, signed, too_close, mixed_dp

RNG = random.Random(8102026)
ROUTE_NAMES = {
    "accounting_audit": "Accounting / Audit",
    "investment_banking": "Investment Banking",
    "asset_management": "Asset Management",
    "markets": "Sales & Trading / Markets",
    "commercial_general": "All routes",
}


def gbp(v, unit=""):
    return f"£{h(v)}{unit}" if abs(v - round(v)) < 1e-9 else f"£{h(v, 2)}{unit}"


def pct(v, dp=1):
    return h(v, dp) + "%"


def item(route, topic, diff, q, correct, wrong, fmt, working, concept, trap, time=75):
    opts = [fmt(correct)] + [fmt(w) for w in wrong]
    if len(set(opts)) != 4 or too_close(correct, wrong) or mixed_dp(opts):
        return None
    order = list(range(4)); RNG.shuffle(order)
    return {"route": route, "section": "technical", "topic": topic, "difficulty": diff, "timeSec": time,
            "question": q, "options": [opts[i] for i in order], "answer": order.index(0),
            "working": working, "concept": concept, "trap": trap, "source": "calculation"}


# ---------------- accounting / audit ----------------
def a_straight_line():
    cost = RNG.choice(range(10, 200, 5)) * 1000; resid = RNG.choice([0, 2000, 5000, 10000]); life = RNG.choice([4, 5, 8, 10])
    if resid >= cost or (cost - resid) % life: return None
    dep = (cost - resid) // life
    return item("accounting_audit", "Depreciation", 1,
        f"A machine costs £{cost:,}, has a residual value of £{resid:,} and a useful life of {life} years. What is the annual straight-line depreciation?",
        dep, [cost // life if resid else dep * 2, (cost + resid) // life, dep // 2], gbp,
        [f"(£{cost:,} − £{resid:,}) ÷ {life} = £{dep:,}"],
        "Straight-line spreads the cost you expect to use up (cost minus what you'll sell it for at the end) evenly over its life.",
        "Ignoring the residual value, or adding it instead of subtracting.")


def a_reducing_balance():
    cost = RNG.choice(range(20, 200, 10)) * 1000; r = RNG.choice([20, 25, 30, 40])
    y1 = cost * r / 100; y2 = (cost - y1) * r / 100
    return item("accounting_audit", "Depreciation", 2,
        f"An asset costing £{cost:,} is depreciated at {r}% a year on a reducing balance basis. What is the depreciation charge in year 2?",
        y2, [y1, cost * r / 100 * 2 / 2 + 1000, (cost - y2) * r / 100], gbp,
        [f"Year 1: {r}% × £{cost:,} = £{y1:,.0f}", f"Carrying value = £{cost - y1:,.0f}", f"Year 2: {r}% × £{cost - y1:,.0f} = £{y2:,.0f}"],
        "Reducing balance charges a fixed percentage of whatever book value is left, so the charge falls each year.",
        "Charging the same amount as year 1 (that's straight-line).")


def a_prepayment():
    annual = RNG.choice(range(6, 60, 6)) * 1000; months_used = RNG.choice([2, 3, 4, 5, 6, 8, 9])
    exp = annual * months_used / 12; pre = annual - exp
    return item("accounting_audit", "Prepayments", 2,
        f"A company pays £{annual:,} for 12 months' rent in advance. At the year end, {months_used} months have been used. What prepayment is shown on the balance sheet?",
        pre, [exp, annual, pre / 2], gbp,
        [f"Used: £{annual:,} × {months_used}/12 = £{exp:,.0f} (expense)", f"Unused: £{annual:,} − £{exp:,.0f} = £{pre:,.0f} (prepayment)"],
        "The part of a payment that covers future periods is an asset (a prepayment). Only the used part is an expense.",
        "Showing the used portion as the prepayment.")


def a_deferred_income():
    fee = RNG.choice(range(12, 240, 12)) * 100; months = RNG.choice([1, 2, 3, 4, 5, 7, 9])
    rev = fee * months / 12; deferred = fee - rev
    return item("accounting_audit", "Revenue recognition", 2,
        f"A customer pays £{fee:,} upfront for a 12-month service. {months} month{'s have' if months > 1 else ' has'} been delivered by the year end. How much revenue is recognised?",
        rev, [fee, deferred, 0 if rev else fee / 2], gbp,
        [f"£{fee:,} × {months}/12 = £{rev:,.0f} recognised", f"£{deferred:,.0f} remains as deferred income (a liability)"],
        "Revenue follows delivery, not cash. Undelivered service is still owed to the customer.",
        "Recognising the whole amount when cash is received.")


def a_markup():
    cost = RNG.choice(range(20, 200, 5)); m = RNG.choice([20, 25, 40, 50, 60, 100])
    price = cost * (1 + m / 100); margin = (price - cost) / price * 100
    return item("accounting_audit", "Gross margin vs markup", 2,
        f"A product costs £{cost} and is sold at a {m}% markup. What is the gross margin?",
        margin, [m, 100 - m if m < 100 else m / 2, margin + 5], pct,
        [f"Price = £{cost} × {1 + m / 100:g} = £{price:g}", f"Margin = (£{price:g} − £{cost}) ÷ £{price:g} = {pct(margin)}"],
        "Markup is profit over cost. Margin is profit over price. The same profit gives a smaller margin than markup.",
        "Assuming margin and markup are the same number.")


def a_current_ratio():
    ca = RNG.choice(range(100, 900, 20)); inv = RNG.choice(range(20, 300, 10)); cl = RNG.choice(range(80, 600, 20))
    if inv >= ca: return None
    quick = (ca - inv) / cl
    return item("accounting_audit", "Ratios", 2,
        f"Current assets are £{ca}k, of which inventory is £{inv}k. Current liabilities are £{cl}k. What is the quick ratio?",
        quick, [ca / cl, cl / (ca - inv), inv / cl], lambda v: h(v, 2),
        [f"(£{ca}k − £{inv}k) ÷ £{cl}k = {quick:.2f}"],
        "The quick ratio leaves out stock because it may not turn into cash quickly.",
        "Including inventory (that gives the current ratio).")


# ---------------- investment banking ----------------
def ib_wacc():
    e = RNG.choice([50, 60, 70, 80]); d = 100 - e; ke = RNG.choice([8, 9, 10, 11, 12]); kd = RNG.choice([4, 5, 6]); t = 25
    w = e / 100 * ke + d / 100 * kd * (1 - t / 100); pre = e / 100 * ke + d / 100 * kd
    return item("investment_banking", "WACC", 3,
        f"A company is funded {e}% equity and {d}% debt. Cost of equity is {ke}%, pre-tax cost of debt {kd}%, tax rate {t}%. What is the WACC?",
        w, [pre, (ke + kd) / 2, ke], lambda v: pct(v, 2),
        [f"= {e}% × {ke}% + {d}% × {kd}% × (1 − {t}%)", f"= {pct(w, 2)}"],
        "WACC blends the cost of each source of funding by its weight. Debt is cheaper after tax because interest is tax-deductible.",
        "Forgetting the tax shield on debt, or taking a simple average.")


def ib_ufcf():
    ebit = RNG.choice(range(50, 400, 10)); t = 25; da = RNG.choice(range(10, 80, 5)); capex = RNG.choice(range(10, 120, 5)); nwc = RNG.choice(range(5, 35, 5))
    nopat = ebit * (1 - t / 100); f = nopat + da - capex - nwc
    return item("investment_banking", "Free cash flow", 3,
        f"EBIT £{ebit}m, tax rate {t}%, D&A £{da}m, capex £{capex}m, increase in net working capital £{nwc}m. What is unlevered free cash flow?",
        f, [ebit + da - capex - nwc, nopat - da - capex - nwc, nopat + da - capex + nwc], lambda v: ("−" if v < 0 else "") + "£" + trim(h(abs(v), 1)) + "m",
        [f"NOPAT = {ebit} × (1 − 25%) = {nopat:g}", f"UFCF = {nopat:g} + {da} − {capex} − {nwc} = " + ("−" if f < 0 else "") + f"£{abs(f):g}m"],
        "Start from after-tax operating profit, add back non-cash D&A, then subtract investment in capex and working capital.",
        "Forgetting tax, subtracting D&A, or adding the working capital increase.")


def ib_premium():
    p = RNG.choice(range(200, 900, 10)) / 100; prem = RNG.choice([20, 25, 30, 35, 40])
    offer = p * (1 + prem / 100)
    return item("investment_banking", "M&A", 1,
        f"A target's undisturbed share price is £{p:.2f}. The bidder offers a {prem}% premium. What is the offer price per share?",
        offer, [p * prem / 100, p / (1 - prem / 100), p + prem / 100], lambda v: f"£{h(v, 2)}",
        [f"£{p:.2f} × {1 + prem / 100:g} = £{h(offer, 2)}"],
        "A control premium is added on top of the undisturbed price to persuade shareholders to sell.",
        "Quoting only the premium amount, not the full price.", time=45)


def ib_leverage():
    nd = RNG.choice(range(100, 900, 25)); e = RNG.choice(range(40, 250, 10))
    return item("investment_banking", "Leverage", 1,
        f"Net debt is £{nd}m and EBITDA is £{e}m. What is net debt / EBITDA?",
        nd / e, [e / nd, nd / e + 1.5, nd / e / 2], lambda v: h(v, 1) + "x",
        [f"£{nd}m ÷ £{e}m = {h(nd / e, 1)}x"],
        "It shows roughly how many years of EBITDA would clear net debt. Lenders watch it closely.",
        "Dividing the wrong way round.", time=45)


def ib_implied_eq():
    e = RNG.choice(range(20, 150, 5)); m = RNG.choice([6, 7, 8, 9, 10, 11, 12]); nd = RNG.choice(range(20, 300, 10)); sh = RNG.choice([10, 20, 25, 40, 50, 100])
    ev = e * m; eq = ev - nd
    if eq <= 0: return None
    pps = eq / sh
    return item("investment_banking", "Valuation", 3,
        f"EBITDA £{e}m, peer EV/EBITDA {m}x, net debt £{nd}m, {sh}m shares in issue. What is the implied value per share?",
        pps, [ev / sh, (ev + nd) / sh, eq / sh / 10 if eq / sh > 5 else pps + 2], lambda v: f"£{h(v, 2)}",
        [f"EV = {m} × {e} = £{ev}m", f"Equity = {ev} − {nd} = £{eq}m", f"Per share = {eq} ÷ {sh} = £{h(pps, 2)}"],
        "Multiples give EV. Take off net debt to reach equity value, then divide by shares.",
        "Dividing enterprise value by shares, skipping the net debt step.")


# ---------------- asset management ----------------
def am_sharpe():
    r = RNG.choice([6, 7, 8, 9, 10, 12, 14]); rf = RNG.choice([2, 3, 4]); sd = RNG.choice([8, 10, 12, 15, 20])
    s = (r - rf) / sd
    return item("asset_management", "Sharpe ratio", 2,
        f"A fund returned {r}% with volatility of {sd}%. The risk-free rate is {rf}%. What is its Sharpe ratio?",
        s, [r / sd, (r + rf) / sd, sd / (r - rf)], lambda v: h(v, 2),
        [f"({r}% − {rf}%) ÷ {sd}% = {h(s, 2)}"],
        "Sharpe = excess return over cash, per unit of risk. It lets you compare funds with different risk levels.",
        "Forgetting to subtract the risk-free rate.")


def am_beta():
    w1 = RNG.choice([30, 40, 50, 60, 70]); b1 = RNG.choice([0.6, 0.8, 1.2, 1.4, 1.5]); b2 = RNG.choice([0.5, 0.9, 1.0, 1.1, 1.3])
    if b1 == b2: return None
    b = w1 / 100 * b1 + (100 - w1) / 100 * b2
    return item("asset_management", "Beta", 2,
        f"A portfolio holds {w1}% in a stock with beta {b1} and {100 - w1}% in a stock with beta {b2}. What is the portfolio beta?",
        b, [(b1 + b2) / 2 if abs((b1 + b2) / 2 - b) > 0.005 else b + 0.2, b1 * b2, max(b1, b2)], lambda v: h(v, 2),
        [f"{w1}% × {b1} + {100 - w1}% × {b2} = {h(b, 2)}"],
        "Portfolio beta is the weighted average of the holdings' betas.",
        "Using a simple average instead of weighting by holding size.")


def am_duration():
    d = RNG.choice([3, 4, 5, 6, 7, 8, 10, 12]); dy = RNG.choice([0.25, 0.5, 0.75, 1.0, 1.5]); up = RNG.random() < 0.6
    ch = -d * dy if up else d * dy
    return item("asset_management", "Duration", 2,
        f"A bond has a modified duration of {d}. Yields {'rise' if up else 'fall'} by {dy} percentage points. Approximately how does its price change?",
        ch, [-ch, ch / d, ch * 2], lambda v: signed(v, pct(abs(v), 2)),
        [f"Price change ≈ −duration × yield change = −{d} × {'+' if up else '−'}{dy}% = " + signed(ch, pct(abs(ch), 2))],
        "Duration is the rule of thumb for interest rate sensitivity. Yields up, prices down.",
        "Getting the direction wrong: rising yields lower bond prices.", time=60)


def am_real_return():
    n = RNG.choice([3, 4, 5, 6, 7, 8]); inf = RNG.choice([2, 3, 4, 5, 6])
    real = n - inf
    if real == 0: return None
    return item("asset_management", "Inflation", 1,
        f"An investment returns {n}% while inflation is {inf}%. What is the approximate real return?",
        real, [n + inf, n, inf - n if inf != n else 1], lambda v: pct(v, 0),
        [f"Real ≈ nominal − inflation = {n}% − {inf}% = {real}%"],
        "Real return is what you gain in buying power after inflation.",
        "Ignoring inflation.", time=45)


def am_fee_drag():
    amt = RNG.choice([10000, 20000, 50000, 100000]); g = RNG.choice([5, 6, 7]); fee = RNG.choice([0.5, 1.0, 1.5]); n = 10
    net = amt * ((1 + g / 100) * (1 - fee / 100)) ** n; gross = amt * (1 + g / 100) ** n
    return item("asset_management", "Fees", 3,
        f"£{amt:,} grows at {g}% a year before fees for {n} years. The fund charges {fee}% a year. Roughly how much do fees cost in total by year {n}?",
        gross - net, [amt * fee / 100 * n, amt * fee / 100, (gross - net) / 2], lambda v: f"£{h(v)}",
        [f"Without fees: £{amt:,} × 1.{g:02d}^{n} ≈ £{h(gross)}", f"With fees: £{amt:,} × (1.{g:02d} × {1 - fee / 100:g})^{n} ≈ £{h(net)}", f"Difference ≈ £{h(gross - net)}"],
        "Fees compound: they're taken from a growing pot every year, so the cost grows faster than fee × years × starting amount.",
        "Multiplying the fee by the starting amount and years, which ignores compounding.", time=90)


# ---------------- markets ----------------
def mk_option_payoff():
    k = RNG.choice(range(80, 160, 5)); s = k + RNG.choice([-15, -10, -5, 5, 10, 15, 20]); prem = RNG.choice([2, 3, 4, 5, 6]); call = RNG.random() < 0.5
    intrinsic = max(s - k, 0) if call else max(k - s, 0); pl = intrinsic - prem
    kind = "call" if call else "put"
    return item("markets", "Options", 2,
        f"You buy a {kind} option with a strike of £{k} for a premium of £{prem}. At expiry the share is £{s}. What is your profit per share?",
        pl, [intrinsic, (s - k) - prem if not call else (k - s) - prem, -intrinsic - prem if intrinsic else prem], lambda v: ("−" if v < 0 else "") + f"£{abs(v):g}",
        [f"Payoff = max({'S − K' if call else 'K − S'}, 0) = £{intrinsic}", f"Profit = £{intrinsic} − £{prem} premium = {'−' if pl < 0 else ''}£{abs(pl)}"],
        "An option buyer's worst case is losing the premium. Profit is the payoff at expiry minus what you paid.",
        "Forgetting to subtract the premium, or mixing up calls and puts.")


def mk_short():
    sell = RNG.choice(range(20, 200, 2)); buy = sell + RNG.choice([-12, -8, -5, -3, 3, 5, 8]); n = RNG.choice([100, 500, 1000, 2000])
    pl = (sell - buy) * n
    return item("markets", "Short selling", 1,
        f"A trader shorts {n:,} shares at £{sell} and buys them back at £{buy}. Ignoring costs, what is the profit or loss?",
        pl, [-pl, pl * 2, (sell - buy)], lambda v: ("−" if v < 0 else "+") + f"£{h(abs(v))}",
        [f"(£{sell} − £{buy}) × {n:,} = {'−' if pl < 0 else '+'}£{abs(pl):,}"],
        "A short profits when the price falls: sell high first, buy back lower.",
        "Treating it like a long position and getting the sign backwards.", time=45)


def mk_leverage():
    own = RNG.choice([10, 20, 25, 50]) * 1000; pos = own * RNG.choice([2, 4, 5]); move = RNG.choice([-10, -5, 5, 8, 10])
    eq_change = pos * move / 100 / own * 100
    return item("markets", "Leverage", 2,
        f"A trader uses £{own:,} of their own money to hold a £{pos:,} position. The position moves {move:+d}%. What is the percentage change in the trader's equity?",
        eq_change, [move, eq_change / 2, -eq_change], lambda v: signed(v, pct(abs(v))),
        [f"P&L = £{pos:,} × {move}% = £{pos * move / 100:,.0f}", f"÷ own money £{own:,} = {eq_change:+.0f}%"],
        "Leverage multiplies the move in the position by position ÷ own money.",
        "Assuming equity moves by the same percentage as the position.")


def mk_bid_offer():
    bid = RNG.choice(range(9900, 10100, 5)) / 100; spread = RNG.choice([0.02, 0.04, 0.05, 0.10]); n = RNG.choice([10000, 50000, 100000])
    offer = bid + spread; rev = spread * n
    return item("markets", "Market making", 2,
        f"A market maker quotes £{bid:.2f} bid / £{offer:.2f} offer and both buys and sells {n:,} shares at those prices. What does it earn, ignoring risk?",
        rev, [spread * n / 2, bid * n / 1000, rev * 2], lambda v: f"£{h(v)}",
        [f"Spread = £{spread:.2f}", f"£{spread:.2f} × {n:,} = £{rev:,.0f}"],
        "Buying at the bid and selling at the offer earns the spread on each share traded both ways.",
        "Halving the spread or counting both legs twice.", time=60)


# ---------------- all routes ----------------
def gen_loan_cost():
    loan = RNG.choice(range(50, 500, 25)) * 1000; r1 = RNG.choice([3, 4, 5]); r2 = r1 + RNG.choice([1, 1.5, 2])
    extra = loan * (r2 - r1) / 100
    return item("commercial_general", "Interest rates", 1,
        f"A business has a £{loan:,} floating-rate loan. Its rate rises from {r1}% to {r2}%. How much more interest does it pay each year?",
        extra, [loan * r2 / 100, loan * (r2 - r1) / 100 / 12, extra * 2], gbp,
        [f"£{loan:,} × ({r2}% − {r1}%) = £{extra:,.0f}"],
        "On a floating-rate loan, a rate rise feeds straight through into higher interest costs.",
        "Calculating the total new interest instead of the increase.", time=45)


FAMILIES = [
    (a_straight_line, 50), (a_reducing_balance, 45), (a_prepayment, 45), (a_deferred_income, 45), (a_markup, 40), (a_current_ratio, 45),
    (ib_wacc, 45), (ib_ufcf, 50), (ib_premium, 40), (ib_leverage, 45), (ib_implied_eq, 50),
    (am_sharpe, 50), (am_beta, 45), (am_duration, 50), (am_real_return, 25), (am_fee_drag, 35),
    (mk_option_payoff, 60), (mk_short, 50), (mk_leverage, 40), (mk_bid_offer, 40),
    (gen_loan_cost, 40),
]


def main(out):
    bank, seen = [], set()
    for route, rows in CONCEPTS.items():
        for topic, diff, q, opts, ans, expl in rows:
            assert len(set(opts)) == 4 and 0 <= ans < 4, q
            order = list(range(4)); RNG.shuffle(order)
            bank.append({"route": route, "section": "technical", "topic": topic, "difficulty": diff,
                         "timeSec": 45 if diff == 1 else 60, "question": q,
                         "options": [opts[i] for i in order], "answer": order.index(ans),
                         "working": [], "concept": expl, "trap": "", "source": "concept"})
    for fam, n in FAMILIES:
        made = tries = 0
        while made < n and tries < n * 300:
            tries += 1
            it = fam()
            if not it or it["question"] in seen:
                continue
            seen.add(it["question"]); bank.append(it); made += 1
        if made < n:
            print(f"warning: {fam.__name__} {made}/{n}", file=sys.stderr)
    for i, it in enumerate(bank, 1):
        it["id"] = f"T{i:04d}"
        it["routeName"] = ROUTE_NAMES[it["route"]]
    json.dump(bank, open(out, "w"), ensure_ascii=False, indent=1)
    print(len(bank), "technical questions")


if __name__ == "__main__":
    main(sys.argv[1])
