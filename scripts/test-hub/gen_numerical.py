"""Generate a validated bank of SHL-style numerical reasoning questions.

Every question is built from parameters, so the correct answer is computed,
never hand-typed. Distractors come from the mistakes students actually make
(wrong base, percentage points vs percent, forgetting a step). Each item is
checked: four distinct options, exactly one equal to the computed answer.
"""
import json, random, math, sys
from qfmt import h, trim, signed, too_close, mixed_dp

RNG = random.Random(20261008)


def money(x, unit="m"):
    if abs(x - round(x)) < 1e-9:
        return f"£{h(x)}{unit}"
    return f"£{h(x, 1)}{unit}"


def pct(x, dp=1):
    return h(x, dp) + "%"


def pp(x, dp=1):
    return h(x, dp) + " percentage points"


def build(cat, topic, diff, time, q, correct, wrong, steps, concept, trap, fmt, table=None):
    """Assemble one item; returns None if options collide (caller retries)."""
    opts = [fmt(correct)] + [fmt(w) for w in wrong]
    if len(set(opts)) != 4 or too_close(correct, wrong) or mixed_dp(opts):
        return None
    order = list(range(4))
    RNG.shuffle(order)
    shuffled = [opts[i] for i in order]
    item = {
        "section": "numerical",
        "category": cat,
        "topic": topic,
        "difficulty": diff,
        "timeSec": time,
        "question": q,
        "options": shuffled,
        "answer": order.index(0),
        "working": steps,
        "concept": concept,
        "trap": trap,
    }
    if table:
        item["table"] = table
    return item


# ---------- generators ----------

def g_pct_change():
    a = RNG.choice(range(40, 400, 5))
    up = RNG.random() < 0.6
    ch = RNG.choice([5, 8, 10, 12, 15, 20, 25, 30, 40])
    b = a * (1 + ch / 100) if up else a * (1 - ch / 100)
    if abs(b - round(b)) > 1e-9:
        return None
    b = round(b)
    item_name, verb = RNG.choice([("Revenue", "moves"), ("Operating costs", "move"), ("Payroll costs", "move"),
                                  ("Net income", "moves"), ("The order book", "moves")])
    true = (b - a) / a * 100
    wrong_base = (b - a) / b * 100
    return build("Percentages", "Percentage change", 1, 45,
                 f"{item_name} {verb} from {money(a)} to {money(b)}. What is the percentage change?",
                 true, [wrong_base, -true, true / 2 if abs(true) > 6 else true * 2],
                 [f"Change = {money(b)} − {money(a)} = {money(b - a)}",
                  f"Divide by the starting value: {b - a} ÷ {a} = {true / 100:.4f}",
                  f"= {pct(true)}"],
                 "Percentage change always uses the starting value as the base: (new − old) ÷ old.",
                 "Dividing by the new value instead of the old one.",
                 lambda v: signed(v, pct(abs(v))))


def g_margin_pp():
    r1 = RNG.choice(range(80, 400, 10))
    m1 = RNG.choice([8, 10, 12, 15, 18, 20, 25])
    r2 = r1 + RNG.choice([10, 20, 30, 40, 50])
    m2 = m1 + RNG.choice([-4, -3, -2, 2, 3, 4, 5])
    p1, p2 = r1 * m1 / 100, r2 * m2 / 100
    if any(abs(x * 10 - round(x * 10)) > 1e-9 for x in (p1, p2)):
        return None
    true = m2 - m1
    rel = (m2 - m1) / m1 * 100
    profit_growth = (p2 - p1) / p1 * 100
    return build("P&L and margins", "Margin change in percentage points", 2, 75,
                 f"Revenue grows from {money(r1)} to {money(r2)} and operating profit from {money(p1)} to {money(p2)}. "
                 "By how much does the operating margin change?",
                 true, [rel, profit_growth, -true],
                 [f"Old margin = {p1:g} ÷ {r1} = {pct(m1)}",
                  f"New margin = {p2:g} ÷ {r2} = {pct(m2)}",
                  f"Change = {m2} − {m1} = {pp(true)}"],
                 "A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent.",
                 "Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference.",
                 lambda v: signed(v, pp(abs(v))))


def g_cagr():
    a = RNG.choice([50, 80, 100, 120, 150, 200, 250])
    g = RNG.choice([5, 8, 10, 12, 15, 20])
    n = RNG.choice([2, 3])
    b = a * (1 + g / 100) ** n
    shown = round(b, 1)
    if round(((shown / a) ** (1 / n) - 1) * 100) != g:
        return None  # displayed figures must reproduce the answer
    simple = (b / a - 1) / n * 100
    total = (b / a - 1) * 100
    return build("Growth rates", "Compound annual growth rate", 3, 90,
                 f"A division's revenue grows from {money(a)} to {money(round(b, 1))} over {n} years. "
                 "What is the compound annual growth rate (CAGR), to the nearest whole percent?",
                 g, [round(simple), round(total), g + RNG.choice([2, 3])],
                 [f"CAGR = (end ÷ start)^(1/{n}) − 1",
                  f"= ({round(b, 1)} ÷ {a})^(1/{n}) − 1 ≈ {g}%"],
                 "CAGR is the steady yearly rate that gets you from start to end with compounding.",
                 "Dividing total growth by the number of years (simple average), which overstates the rate.",
                 lambda v: pct(v, 0))


def g_ev_bridge():
    mcap = RNG.choice(range(100, 900, 20))
    debt = RNG.choice(range(20, 300, 10))
    cash = RNG.choice(range(5, 120, 5))
    if cash >= debt:
        return None
    ev = mcap + debt - cash
    return build("Valuation", "Enterprise value vs equity value", 2, 60,
                 f"A company has equity value of {money(mcap)}, debt of {money(debt)} and cash of {money(cash)}. "
                 "What is its enterprise value (ignore other adjustments)?",
                 ev, [mcap + debt + cash, mcap - debt + cash, mcap + debt],
                 [f"EV = equity value + debt − cash",
                  f"= {mcap} + {debt} − {cash} = {money(ev)}"],
                 "Enterprise value is the value of the whole business to all funders. Add debt (lenders' claim), "
                 "subtract cash (it could repay debt).",
                 "Adding cash instead of subtracting it.",
                 money)


def g_multiple():
    ebitda = RNG.choice(range(10, 120, 5))
    mult = RNG.choice([6, 7, 8, 9, 10, 12, 14])
    netdebt = RNG.choice(range(10, 200, 10))
    ev = ebitda * mult
    if netdebt >= ev:
        return None
    eq = ev - netdebt
    return build("Valuation", "EV / EBITDA valuation", 2, 75,
                 f"Comparable companies trade at {mult}x EV/EBITDA. The target has EBITDA of {money(ebitda)} "
                 f"and net debt of {money(netdebt)}. What is the implied equity value?",
                 eq, [ev, ev + netdebt, eq - netdebt],
                 [f"EV = {mult} × {ebitda} = {money(ev)}",
                  f"Equity value = EV − net debt = {ev} − {netdebt} = {money(eq)}"],
                 "Multiples like EV/EBITDA give enterprise value first. Shareholders get what's left after net debt.",
                 "Stopping at enterprise value and calling it equity value.",
                 money)


def g_fx():
    amt = RNG.choice(range(200, 5000, 50))
    rate = RNG.choice([1.15, 1.18, 1.20, 1.25, 1.27, 1.30])
    cur = RNG.choice([("USD", "$"), ("EUR", "€")])
    direction = RNG.random() < 0.5
    if direction:
        true = amt * rate
        q = f"GBP/{cur[0]} is {rate:.2f} (£1 = {cur[1]}{rate:.2f}). How much is £{amt:,} in {cur[0]}?"
        wrong = [amt / rate, amt * rate * 1.1, amt + rate * 100]
        f = lambda v, s=cur[1]: f"{s}{h(v)}"
        steps = [f"£{amt:,} × {rate:.2f} = {cur[1]}{h(true)}"]
    else:
        true = amt / rate
        q = f"GBP/{cur[0]} is {rate:.2f} (£1 = {cur[1]}{rate:.2f}). How much is {cur[1]}{amt:,} in GBP?"
        wrong = [amt * rate, amt / rate * 0.9, amt - rate * 100]
        f = lambda v: f"£{h(v)}"
        steps = [f"{cur[1]}{amt:,} ÷ {rate:.2f} = £{h(true)}"]
    return build("Currency", "Currency conversion", 1, 45, q, true, wrong, steps,
                 "Quote GBP/USD 1.25 means one pound buys 1.25 dollars. Pounds to dollars: multiply. Dollars to pounds: divide.",
                 "Multiplying when you should divide (or the reverse).", f)


def g_table_share():
    regions = ["UK", "Europe", "US", "Asia"]
    vals = [RNG.choice(range(20, 200, 5)) for _ in regions]
    total = sum(vals)
    i = RNG.randrange(4)
    true = vals[i] / total * 100
    table = {"title": "Revenue by region (£m)", "columns": ["Region", "Revenue"],
             "rows": [[r, v] for r, v in zip(regions, vals)]}
    others = sum(vals) - vals[i]
    return build("Data tables", "Share of total", 1, 60,
                 f"Using the table, what share of total revenue comes from {regions[i]}?",
                 true, [vals[i] / others * 100, vals[i] / max(vals) * 100 if vals[i] != max(vals) else true + 7,
                        100 / len(regions)],
                 [f"Total = {' + '.join(map(str, vals))} = {total}",
                  f"{regions[i]} share = {vals[i]} ÷ {total} = {pct(true)}"],
                 "A share is part ÷ whole. Add up the whole first.",
                 "Dividing by the rest of the regions instead of the total.",
                 pct, table)


def g_table_growth():
    rows = []
    for name in ["Product A", "Product B", "Product C"]:
        y1 = RNG.choice(range(40, 300, 10))
        ch = RNG.choice([-20, -10, 5, 10, 15, 20, 25, 30, 50])
        y2 = y1 * (1 + ch / 100)
        if abs(y2 - round(y2)) > 1e-9:
            return None
        rows.append([name, y1, int(round(y2)), ch])
    chs = [r[3] for r in rows]
    if len(set(chs)) < 3:
        return None
    best = max(range(3), key=lambda k: chs[k])
    abs_best = max(range(3), key=lambda k: rows[k][2] - rows[k][1])
    table = {"title": "Sales (£000s)", "columns": ["Product", "2024", "2025"],
             "rows": [[r[0], r[1], r[2]] for r in rows]}
    names = [r[0] for r in rows]
    correct = names[best]
    wrong = [n for n in names if n != correct]
    if abs_best != best:
        hint = f"{names[abs_best]} has the biggest £ increase but not the biggest % increase."
    else:
        hint = "Compare percentage growth, not the £ change."
    wrong.append("All grew at the same rate")
    item = build("Data tables", "Comparing growth rates", 2, 75,
                 "Which product had the highest percentage growth in sales from 2024 to 2025?",
                 correct, wrong,
                 [f"{r[0]}: ({r[2]} − {r[1]}) ÷ {r[1]} = {r[3]:+d}%" for r in rows],
                 "Percentage growth lets you compare items of different sizes fairly.",
                 hint, lambda v: v, table)
    return item


def g_weighted_avg():
    w = [RNG.choice([20, 30, 40, 50]) for _ in range(2)]
    w.append(100 - sum(w))
    if w[2] <= 0:
        return None
    r = [RNG.choice([2, 3, 4, 5, 6, 8, 10, 12]) for _ in range(3)]
    true = sum(a * b for a, b in zip(w, r)) / 100
    simple = sum(r) / 3
    if abs(true - simple) < 0.25:
        return None
    return build("Ratios", "Weighted average return", 2, 75,
                 f"A portfolio is {w[0]}% equities returning {r[0]}%, {w[1]}% bonds returning {r[1]}% and "
                 f"{w[2]}% property returning {r[2]}%. What is the portfolio return?",
                 true, [simple, max(r), true + 1.5],
                 [f"= {w[0]}% × {r[0]}% + {w[1]}% × {r[1]}% + {w[2]}% × {r[2]}%",
                  f"= {pct(true, 2)}"],
                 "A weighted average gives bigger holdings more say in the result.",
                 "Taking a simple average of the three returns.",
                 lambda v: pct(v, 2))


def g_interest():
    p = RNG.choice(range(1000, 20000, 500))
    rate = RNG.choice([3, 4, 5, 6, 8])
    n = RNG.choice([2, 3])
    true = p * (1 + rate / 100) ** n
    simple = p * (1 + rate / 100 * n)
    return build("Lending", "Compound interest", 2, 60,
                 f"£{p:,} is deposited at {rate}% a year, compounded annually. What is the balance after {n} years?",
                 true, [simple, p * rate / 100 * n, true * 1.05],
                 [f"£{p:,} × (1 + {rate / 100})^{n} = £{h(true, 2)}"],
                 "Compounding means you earn interest on previous interest, so the balance grows faster than simple interest.",
                 "Using simple interest (rate × years) and ignoring interest on interest.",
                 lambda v: f"£{h(v, 2)}")


def g_breakeven():
    fixed = RNG.choice(range(20, 400, 10)) * 1000
    price = RNG.choice([20, 25, 30, 40, 50, 60])
    var = RNG.choice([8, 10, 12, 15, 18, 22])
    if var >= price:
        return None
    contrib = price - var
    if fixed % contrib:
        return None
    true = fixed // contrib
    return build("P&L and margins", "Break-even volume", 2, 60,
                 f"Fixed costs are £{fixed:,}. Each unit sells for £{price} and costs £{var} to make. "
                 "How many units must be sold to break even?",
                 true, [fixed // price, round(fixed / var), true * 2],
                 [f"Contribution per unit = £{price} − £{var} = £{contrib}",
                  f"Break-even = £{fixed:,} ÷ £{contrib} = {true:,} units"],
                 "Each unit sold contributes price minus variable cost towards fixed costs. Break-even is when contributions cover fixed costs.",
                 "Dividing fixed costs by the selling price instead of the contribution.",
                 lambda v: f"{int(round(v)):,} units")


def g_reverse_pct():
    after = RNG.choice(range(60, 600, 6))
    ch = RNG.choice([10, 20, 25, 50])
    before = after / (1 + ch / 100)
    if abs(before - round(before)) > 1e-9:
        return None
    before = round(before)
    wrong_naive = after * (1 - ch / 100)
    return build("Percentages", "Reverse percentage", 2, 60,
                 f"After a {ch}% increase, a client's annual fee is £{after:,}k. What was the fee before the increase?",
                 before, [wrong_naive, after - ch, before * 0.9],
                 [f"New = old × {1 + ch / 100:g}",
                  f"Old = {after} ÷ {1 + ch / 100:g} = £{before:,}k"],
                 "To undo a percentage increase, divide by (1 + rate). Taking the same percentage off doesn't get you back.",
                 f"Taking {ch}% off the new figure, which gives too low an answer.",
                 lambda v: f"£{h(v)}k")


def g_pe():
    eps = RNG.choice([0.5, 0.8, 1.2, 1.5, 2.0, 2.5, 3.0])
    pe = RNG.choice([8, 10, 12, 15, 18, 20, 25])
    price = eps * pe
    return build("Valuation", "P/E ratio", 1, 45,
                 f"A share trades at £{price:.2f} and earnings per share are £{eps:.2f}. What is the P/E ratio?",
                 pe, [eps / price * 100, pe / 2, pe + 5],
                 [f"P/E = price ÷ EPS = {price:.2f} ÷ {eps:.2f} = {pe}x"],
                 "P/E tells you how many years of current earnings you pay for one share.",
                 "Dividing earnings by price (that's the earnings yield).",
                 lambda v: h(v, 1) + "x")


def g_dilution():
    shares = RNG.choice(range(50, 500, 10))
    new = RNG.choice(range(10, 200, 5))
    stake = RNG.choice([5, 10, 15, 20, 25])
    held = shares * stake / 100
    if abs(held - round(held)) > 1e-9:
        return None
    true = held / (shares + new) * 100
    return build("Ratios", "Equity dilution", 2, 75,
                 f"An investor owns {stake}% of a company with {shares}m shares. The company issues {new}m new shares "
                 "and the investor buys none. What is the investor's new stake?",
                 true, [stake, held / new * 100 if new else stake + 1, stake * shares / (shares - new) if shares > new else stake + 2],
                 [f"Shares held = {stake}% × {shares}m = {held:g}m",
                  f"New total = {shares} + {new} = {shares + new}m",
                  f"Stake = {held:g} ÷ {shares + new} = {pct(true)}"],
                 "Issuing new shares grows the total, so each existing holder owns a smaller slice unless they buy more.",
                 "Assuming the stake stays the same because the investor didn't sell.",
                 pct)


GENERATORS = [
    (g_pct_change, 110), (g_margin_pp, 90), (g_cagr, 60), (g_ev_bridge, 80), (g_multiple, 80),
    (g_fx, 80), (g_table_share, 90), (g_table_growth, 80), (g_weighted_avg, 70), (g_interest, 60),
    (g_breakeven, 70), (g_reverse_pct, 60), (g_pe, 60), (g_dilution, 60),
]


def main(out):
    bank, seen = [], set()
    for gen, n in GENERATORS:
        made, tries = 0, 0
        while made < n and tries < n * 200:
            tries += 1
            it = gen()
            if not it:
                continue
            key = it["question"] + json.dumps(it.get("table"))
            if key in seen:
                continue
            seen.add(key)
            bank.append(it)
            made += 1
        if made < n:
            print(f"warning: {gen.__name__} made {made}/{n}", file=sys.stderr)
    for i, it in enumerate(bank, 1):
        it["id"] = f"N{i:04d}"
    json.dump(bank, open(out, "w"), ensure_ascii=False, indent=1)
    print(len(bank), "numerical questions")


if __name__ == "__main__":
    main(sys.argv[1])
