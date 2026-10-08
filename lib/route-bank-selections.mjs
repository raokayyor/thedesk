// Shared, versioned free assessment selections from the approved Test Hub bank.
export const HUB_ROUTE_BANKS={
  "General Finance": {
    "id": "hub-commercial_general-v1",
    "commercial": [
      {
        "route": "commercial_general",
        "section": "technical",
        "topic": "Interest rates",
        "difficulty": 1,
        "timeSec": 45,
        "question": "When the Bank of England raises interest rates, borrowing costs for households and businesses usually:",
        "options": [
          "Stay the same",
          "Fall",
          "Disappear",
          "Rise"
        ],
        "answer": 3,
        "working": [],
        "concept": "Banks pass higher base rates on through loans and mortgages, especially floating or newly fixed ones. That's how rate rises cool spending and inflation.",
        "trap": "",
        "source": "concept",
        "id": "T0090",
        "routeName": "All routes",
        "explanation": "Banks pass higher base rates on through loans and mortgages, especially floating or newly fixed ones. That's how rate rises cool spending and inflation."
      },
      {
        "route": "commercial_general",
        "section": "technical",
        "topic": "Inflation",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Inflation means:",
        "options": [
          "Falling unemployment",
          "A stronger currency",
          "Rising share prices",
          "A general rise in prices, reducing what money can buy"
        ],
        "answer": 3,
        "working": [],
        "concept": "If prices rise 5% a year and your pay doesn't, you can afford less. The Bank of England's target is 2% CPI inflation.",
        "trap": "",
        "source": "concept",
        "id": "T0091",
        "routeName": "All routes",
        "explanation": "If prices rise 5% a year and your pay doesn't, you can afford less. The Bank of England's target is 2% CPI inflation."
      },
      {
        "route": "commercial_general",
        "section": "technical",
        "topic": "Recession",
        "difficulty": 1,
        "timeSec": 45,
        "question": "A recession is commonly defined as:",
        "options": [
          "Rising interest rates",
          "Two consecutive quarters of falling GDP",
          "Inflation above 5%",
          "A stock market fall of 20%"
        ],
        "answer": 1,
        "working": [],
        "concept": "It's a shorthand rule: if the economy shrinks for six months running, it's in a technical recession.",
        "trap": "",
        "source": "concept",
        "id": "T0092",
        "routeName": "All routes",
        "explanation": "It's a shorthand rule: if the economy shrinks for six months running, it's in a technical recession."
      },
      {
        "route": "commercial_general",
        "section": "technical",
        "topic": "Business models",
        "difficulty": 2,
        "timeSec": 60,
        "question": "Why do investors value recurring subscription revenue highly?",
        "options": [
          "It avoids tax",
          "It is always more profitable",
          "It has no costs",
          "It is predictable and tends to repeat"
        ],
        "answer": 3,
        "working": [],
        "concept": "If customers pay every month, future revenue is easier to forecast and less risky, so investors pay more for it.",
        "trap": "",
        "source": "concept",
        "id": "T0093",
        "routeName": "All routes",
        "explanation": "If customers pay every month, future revenue is easier to forecast and less risky, so investors pay more for it."
      },
      {
        "route": "commercial_general",
        "section": "technical",
        "topic": "Competition",
        "difficulty": 2,
        "timeSec": 60,
        "question": "What is a company's 'moat'?",
        "options": [
          "Its debt covenants",
          "Its cash balance",
          "A lasting advantage that protects profits from competitors",
          "Its head office"
        ],
        "answer": 2,
        "working": [],
        "concept": "Brands, network effects, switching costs or cost advantages can stop rivals eating into profits. Investors pay more for durable moats.",
        "trap": "",
        "source": "concept",
        "id": "T0095",
        "routeName": "All routes",
        "explanation": "Brands, network effects, switching costs or cost advantages can stop rivals eating into profits. Investors pay more for durable moats."
      }
    ],
    "numerical": [
      {
        "section": "numerical",
        "category": "Percentages",
        "topic": "Percentage change",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Operating costs move from £225m to £252m. What is the percentage change?",
        "options": [
          "+10.7%",
          "+6.0%",
          "+12.0%",
          "−12.0%"
        ],
        "answer": 2,
        "working": [
          "Change = £252m − £225m = £27m",
          "Divide by the starting value: 27 ÷ 225 = 0.1200",
          "= 12.0%"
        ],
        "concept": "Percentage change always uses the starting value as the base: (new − old) ÷ old.",
        "trap": "Dividing by the new value instead of the old one.",
        "id": "N0001",
        "explanation": "Change = £252m − £225m = £27m Divide by the starting value: 27 ÷ 225 = 0.1200 = 12.0% Percentage change always uses the starting value as the base: (new − old) ÷ old. Dividing by the new value instead of the old one."
      },
      {
        "section": "numerical",
        "category": "P&L and margins",
        "topic": "Margin change in percentage points",
        "difficulty": 2,
        "timeSec": 75,
        "question": "Revenue grows from £190m to £200m and operating profit from £15.2m to £22m. By how much does the operating margin change?",
        "options": [
          "+37.5 percentage points",
          "+3.0 percentage points",
          "−3.0 percentage points",
          "+44.7 percentage points"
        ],
        "answer": 1,
        "working": [
          "Old margin = 15.2 ÷ 190 = 8.0%",
          "New margin = 22 ÷ 200 = 11.0%",
          "Change = 11 − 8 = 3.0 percentage points"
        ],
        "concept": "A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent.",
        "trap": "Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference.",
        "id": "N0111",
        "explanation": "Old margin = 15.2 ÷ 190 = 8.0% New margin = 22 ÷ 200 = 11.0% Change = 11 − 8 = 3.0 percentage points A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent. Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference."
      },
      {
        "section": "numerical",
        "category": "Currency",
        "topic": "Currency conversion",
        "difficulty": 1,
        "timeSec": 45,
        "question": "GBP/USD is 1.15 (£1 = $1.15). How much is £2,450 in USD?",
        "options": [
          "$2,818",
          "$3,099",
          "$2,130",
          "$2,565"
        ],
        "answer": 0,
        "working": [
          "£2,450 × 1.15 = $2,818"
        ],
        "concept": "Quote GBP/USD 1.25 means one pound buys 1.25 dollars. Pounds to dollars: multiply. Dollars to pounds: divide.",
        "trap": "Multiplying when you should divide (or the reverse).",
        "id": "N0421",
        "explanation": "£2,450 × 1.15 = $2,818 Quote GBP/USD 1.25 means one pound buys 1.25 dollars. Pounds to dollars: multiply. Dollars to pounds: divide. Multiplying when you should divide (or the reverse)."
      },
      {
        "section": "numerical",
        "category": "Data tables",
        "topic": "Share of total",
        "difficulty": 1,
        "timeSec": 60,
        "question": "Using the table, what share of total revenue comes from Europe?",
        "options": [
          "42.6%",
          "25.0%",
          "35.6%",
          "55.2%"
        ],
        "answer": 2,
        "working": [
          "Total = 60 + 160 + 80 + 150 = 450",
          "Europe share = 160 ÷ 450 = 35.6%"
        ],
        "concept": "A share is part ÷ whole. Add up the whole first.",
        "trap": "Dividing by the rest of the regions instead of the total.",
        "table": {
          "title": "Revenue by region (£m)",
          "columns": [
            "Region",
            "Revenue"
          ],
          "rows": [
            [
              "UK",
              60
            ],
            [
              "Europe",
              160
            ],
            [
              "US",
              80
            ],
            [
              "Asia",
              150
            ]
          ]
        },
        "id": "N0501",
        "explanation": "Total = 60 + 160 + 80 + 150 = 450 Europe share = 160 ÷ 450 = 35.6% A share is part ÷ whole. Add up the whole first. Dividing by the rest of the regions instead of the total."
      },
      {
        "section": "numerical",
        "category": "Data tables",
        "topic": "Comparing growth rates",
        "difficulty": 2,
        "timeSec": 75,
        "question": "Which product had the highest percentage growth in sales from 2024 to 2025?",
        "options": [
          "Product B",
          "Product C",
          "Product A",
          "All grew at the same rate"
        ],
        "answer": 1,
        "working": [
          "Product A: (80 − 100) ÷ 100 = -20%",
          "Product B: (300 − 240) ÷ 240 = +25%",
          "Product C: (338 − 260) ÷ 260 = +30%"
        ],
        "concept": "Percentage growth lets you compare items of different sizes fairly.",
        "trap": "Compare percentage growth, not the £ change.",
        "table": {
          "title": "Sales (£000s)",
          "columns": [
            "Product",
            "2024",
            "2025"
          ],
          "rows": [
            [
              "Product A",
              100,
              80
            ],
            [
              "Product B",
              240,
              300
            ],
            [
              "Product C",
              260,
              338
            ]
          ]
        },
        "id": "N0591",
        "explanation": "Product A: (80 − 100) ÷ 100 = -20% Product B: (300 − 240) ÷ 240 = +25% Product C: (338 − 260) ÷ 260 = +30% Percentage growth lets you compare items of different sizes fairly. Compare percentage growth, not the £ change."
      }
    ]
  },
  "Investment Banking / IBD": {
    "id": "hub-investment_banking-v1",
    "commercial": [
      {
        "route": "investment_banking",
        "section": "technical",
        "topic": "Enterprise value",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Enterprise value represents:",
        "options": [
          "The value of shareholders' equity only",
          "The company's book value",
          "The value of the whole business to all capital providers",
          "The company's annual revenue"
        ],
        "answer": 2,
        "working": [],
        "concept": "EV is what you'd pay for the whole operating business, ignoring how it's funded. Equity value is just the shareholders' slice.",
        "trap": "",
        "source": "concept",
        "id": "T0031",
        "routeName": "Investment Banking",
        "explanation": "EV is what you'd pay for the whole operating business, ignoring how it's funded. Equity value is just the shareholders' slice."
      },
      {
        "route": "investment_banking",
        "section": "technical",
        "topic": "Multiples",
        "difficulty": 2,
        "timeSec": 60,
        "question": "Why use EV/EBITDA rather than P/E to compare companies with different debt levels?",
        "options": [
          "P/E is always higher",
          "EV/EBITDA is largely unaffected by capital structure",
          "EV/EBITDA includes interest costs",
          "P/E ignores revenue"
        ],
        "answer": 1,
        "working": [],
        "concept": "EBITDA is before interest, and EV includes debt, so both sides are capital-structure neutral. P/E uses net income, which changes with interest costs.",
        "trap": "",
        "source": "concept",
        "id": "T0033",
        "routeName": "Investment Banking",
        "explanation": "EBITDA is before interest, and EV includes debt, so both sides are capital-structure neutral. P/E uses net income, which changes with interest costs."
      },
      {
        "route": "investment_banking",
        "section": "technical",
        "topic": "DCF",
        "difficulty": 2,
        "timeSec": 60,
        "question": "In a DCF, what does the discount rate represent?",
        "options": [
          "The inflation rate",
          "The growth rate of revenue",
          "The company's tax rate",
          "The return investors require for the risk taken"
        ],
        "answer": 3,
        "working": [],
        "concept": "Future cash is worth less than cash today, and riskier cash even less. The discount rate (often WACC) reflects the return investors demand for that risk.",
        "trap": "",
        "source": "concept",
        "id": "T0035",
        "routeName": "Investment Banking",
        "explanation": "Future cash is worth less than cash today, and riskier cash even less. The discount rate (often WACC) reflects the return investors demand for that risk."
      },
      {
        "route": "investment_banking",
        "section": "technical",
        "topic": "WACC",
        "difficulty": 2,
        "timeSec": 60,
        "question": "Why is the cost of debt usually lower than the cost of equity?",
        "options": [
          "Equity holders receive fixed payments",
          "Banks are cheaper than shareholders",
          "Debt holders are paid first and interest is tax-deductible",
          "Debt has no risk"
        ],
        "answer": 2,
        "working": [],
        "concept": "Lenders rank ahead of shareholders if things go wrong, so they accept a lower return. Interest is also tax-deductible, lowering the cost further.",
        "trap": "",
        "source": "concept",
        "id": "T0038",
        "routeName": "Investment Banking",
        "explanation": "Lenders rank ahead of shareholders if things go wrong, so they accept a lower return. Interest is also tax-deductible, lowering the cost further."
      },
      {
        "route": "investment_banking",
        "section": "technical",
        "topic": "Free cash flow",
        "difficulty": 2,
        "timeSec": 60,
        "question": "Unlevered free cash flow is cash flow:",
        "options": [
          "Available to all capital providers, before interest",
          "Paid as dividends",
          "After interest and debt repayments",
          "From financing activities"
        ],
        "answer": 0,
        "working": [],
        "concept": "Unlevered FCF ignores how the company is funded, which is why it's discounted at WACC to get enterprise value.",
        "trap": "",
        "source": "concept",
        "id": "T0039",
        "routeName": "Investment Banking",
        "explanation": "Unlevered FCF ignores how the company is funded, which is why it's discounted at WACC to get enterprise value."
      }
    ],
    "numerical": [
      {
        "section": "numerical",
        "category": "Valuation",
        "topic": "Enterprise value vs equity value",
        "difficulty": 2,
        "timeSec": 60,
        "question": "A company has equity value of £540m, debt of £120m and cash of £50m. What is its enterprise value (ignore other adjustments)?",
        "options": [
          "£470m",
          "£710m",
          "£610m",
          "£660m"
        ],
        "answer": 2,
        "working": [
          "EV = equity value + debt − cash",
          "= 540 + 120 − 50 = £610m"
        ],
        "concept": "Enterprise value is the value of the whole business to all funders. Add debt (lenders' claim), subtract cash (it could repay debt).",
        "trap": "Adding cash instead of subtracting it.",
        "id": "N0261",
        "explanation": "EV = equity value + debt − cash = 540 + 120 − 50 = £610m Enterprise value is the value of the whole business to all funders. Add debt (lenders' claim), subtract cash (it could repay debt). Adding cash instead of subtracting it."
      },
      {
        "section": "numerical",
        "category": "Valuation",
        "topic": "EV / EBITDA valuation",
        "difficulty": 2,
        "timeSec": 75,
        "question": "Comparable companies trade at 8x EV/EBITDA. The target has EBITDA of £115m and net debt of £70m. What is the implied equity value?",
        "options": [
          "£990m",
          "£780m",
          "£850m",
          "£920m"
        ],
        "answer": 2,
        "working": [
          "EV = 8 × 115 = £920m",
          "Equity value = EV − net debt = 920 − 70 = £850m"
        ],
        "concept": "Multiples like EV/EBITDA give enterprise value first. Shareholders get what's left after net debt.",
        "trap": "Stopping at enterprise value and calling it equity value.",
        "id": "N0341",
        "explanation": "EV = 8 × 115 = £920m Equity value = EV − net debt = 920 − 70 = £850m Multiples like EV/EBITDA give enterprise value first. Shareholders get what's left after net debt. Stopping at enterprise value and calling it equity value."
      },
      {
        "section": "numerical",
        "category": "Growth rates",
        "topic": "Compound annual growth rate",
        "difficulty": 3,
        "timeSec": 90,
        "question": "A division's revenue grows from £50m to £60.5m over 2 years. What is the compound annual growth rate (CAGR), to the nearest whole percent?",
        "options": [
          "21%",
          "11%",
          "12%",
          "10%"
        ],
        "answer": 3,
        "working": [
          "CAGR = (end ÷ start)^(1/2) − 1",
          "= (60.5 ÷ 50)^(1/2) − 1 ≈ 10%"
        ],
        "concept": "CAGR is the steady yearly rate that gets you from start to end with compounding.",
        "trap": "Dividing total growth by the number of years (simple average), which overstates the rate.",
        "id": "N0201",
        "explanation": "CAGR = (end ÷ start)^(1/2) − 1 = (60.5 ÷ 50)^(1/2) − 1 ≈ 10% CAGR is the steady yearly rate that gets you from start to end with compounding. Dividing total growth by the number of years (simple average), which overstates the rate."
      },
      {
        "section": "numerical",
        "category": "Percentages",
        "topic": "Percentage change",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Operating costs move from £225m to £252m. What is the percentage change?",
        "options": [
          "+10.7%",
          "+6.0%",
          "+12.0%",
          "−12.0%"
        ],
        "answer": 2,
        "working": [
          "Change = £252m − £225m = £27m",
          "Divide by the starting value: 27 ÷ 225 = 0.1200",
          "= 12.0%"
        ],
        "concept": "Percentage change always uses the starting value as the base: (new − old) ÷ old.",
        "trap": "Dividing by the new value instead of the old one.",
        "id": "N0001",
        "explanation": "Change = £252m − £225m = £27m Divide by the starting value: 27 ÷ 225 = 0.1200 = 12.0% Percentage change always uses the starting value as the base: (new − old) ÷ old. Dividing by the new value instead of the old one."
      },
      {
        "section": "numerical",
        "category": "P&L and margins",
        "topic": "Margin change in percentage points",
        "difficulty": 2,
        "timeSec": 75,
        "question": "Revenue grows from £190m to £200m and operating profit from £15.2m to £22m. By how much does the operating margin change?",
        "options": [
          "+37.5 percentage points",
          "+3.0 percentage points",
          "−3.0 percentage points",
          "+44.7 percentage points"
        ],
        "answer": 1,
        "working": [
          "Old margin = 15.2 ÷ 190 = 8.0%",
          "New margin = 22 ÷ 200 = 11.0%",
          "Change = 11 − 8 = 3.0 percentage points"
        ],
        "concept": "A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent.",
        "trap": "Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference.",
        "id": "N0111",
        "explanation": "Old margin = 15.2 ÷ 190 = 8.0% New margin = 22 ÷ 200 = 11.0% Change = 11 − 8 = 3.0 percentage points A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent. Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference."
      }
    ]
  },
  "Accounting / Audit": {
    "id": "hub-accounting_audit-v1",
    "commercial": [
      {
        "route": "accounting_audit",
        "section": "technical",
        "topic": "Double entry",
        "difficulty": 1,
        "timeSec": 45,
        "question": "A company buys £5,000 of stock on credit. Which entry is correct?",
        "options": [
          "Debit inventory £5,000, credit cash £5,000",
          "Debit inventory £5,000, credit payables £5,000",
          "Debit payables £5,000, credit inventory £5,000",
          "Debit cost of sales £5,000, credit cash £5,000"
        ],
        "answer": 1,
        "working": [],
        "concept": "Every transaction has two sides. The company gains an asset (stock, a debit) and owes the supplier (a payable, a credit). No cash moves yet because it bought on credit.",
        "trap": "",
        "source": "concept",
        "id": "T0001",
        "routeName": "Accounting / Audit",
        "explanation": "Every transaction has two sides. The company gains an asset (stock, a debit) and owes the supplier (a payable, a credit). No cash moves yet because it bought on credit."
      },
      {
        "route": "accounting_audit",
        "section": "technical",
        "topic": "Accruals",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Electricity used in December is billed in January. Under accruals accounting, when is the cost recognised?",
        "options": [
          "Split equally across both months",
          "January",
          "When the bill is paid",
          "December"
        ],
        "answer": 3,
        "working": [],
        "concept": "Accruals means costs are recorded when they are incurred, not when cash leaves. The electricity was used in December, so it's a December cost, recorded as an accrual (a liability) until paid.",
        "trap": "",
        "source": "concept",
        "id": "T0002",
        "routeName": "Accounting / Audit",
        "explanation": "Accruals means costs are recorded when they are incurred, not when cash leaves. The electricity was used in December, so it's a December cost, recorded as an accrual (a liability) until paid."
      },
      {
        "route": "accounting_audit",
        "section": "technical",
        "topic": "Prepayments",
        "difficulty": 1,
        "timeSec": 45,
        "question": "In March a company pays £12,000 for a year's insurance starting 1 April. At 31 March, how is it shown?",
        "options": [
          "£12,000 prepayment (asset)",
          "£12,000 expense",
          "£1,000 expense and £11,000 prepayment",
          "£12,000 accrual (liability)"
        ],
        "answer": 0,
        "working": [],
        "concept": "None of the cover has been used yet, so the whole payment is an asset: a prepayment. It becomes an expense month by month as the cover is used.",
        "trap": "",
        "source": "concept",
        "id": "T0003",
        "routeName": "Accounting / Audit",
        "explanation": "None of the cover has been used yet, so the whole payment is an asset: a prepayment. It becomes an expense month by month as the cover is used."
      },
      {
        "route": "accounting_audit",
        "section": "technical",
        "topic": "Going concern",
        "difficulty": 2,
        "timeSec": 60,
        "question": "What does the going concern assumption mean?",
        "options": [
          "The business will keep operating for the foreseeable future",
          "The business is profitable this year",
          "The business has more cash than debt",
          "Assets are valued at what they would sell for today"
        ],
        "answer": 0,
        "working": [],
        "concept": "Accounts assume the company will carry on trading for at least 12 months from the date the accounts are approved. If there's significant doubt, directors must disclose it and the auditor reports a material uncertainty related to going concern. If the business clearly can't continue, assets are valued on a break-up basis.",
        "trap": "",
        "source": "concept",
        "id": "T0004",
        "routeName": "Accounting / Audit",
        "explanation": "Accounts assume the company will carry on trading for at least 12 months from the date the accounts are approved. If there's significant doubt, directors must disclose it and the auditor reports a material uncertainty related to going concern. If the business clearly can't continue, assets are valued on a break-up basis."
      },
      {
        "route": "accounting_audit",
        "section": "technical",
        "topic": "Audit opinion",
        "difficulty": 2,
        "timeSec": 60,
        "question": "An auditor issues an unmodified (clean) opinion. What does that mean?",
        "options": [
          "The company is financially healthy",
          "The company has no fraud",
          "The auditor checked every transaction",
          "The accounts give a true and fair view in all material respects"
        ],
        "answer": 3,
        "working": [],
        "concept": "A clean opinion means the auditor has obtained reasonable assurance that the accounts are free from material misstatement and give a true and fair view. It does not mean every transaction was checked, that there's no fraud anywhere, or that the business is in good shape.",
        "trap": "",
        "source": "concept",
        "id": "T0005",
        "routeName": "Accounting / Audit",
        "explanation": "A clean opinion means the auditor has obtained reasonable assurance that the accounts are free from material misstatement and give a true and fair view. It does not mean every transaction was checked, that there's no fraud anywhere, or that the business is in good shape."
      }
    ],
    "numerical": [
      {
        "section": "numerical",
        "category": "Percentages",
        "topic": "Percentage change",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Operating costs move from £225m to £252m. What is the percentage change?",
        "options": [
          "+10.7%",
          "+6.0%",
          "+12.0%",
          "−12.0%"
        ],
        "answer": 2,
        "working": [
          "Change = £252m − £225m = £27m",
          "Divide by the starting value: 27 ÷ 225 = 0.1200",
          "= 12.0%"
        ],
        "concept": "Percentage change always uses the starting value as the base: (new − old) ÷ old.",
        "trap": "Dividing by the new value instead of the old one.",
        "id": "N0001",
        "explanation": "Change = £252m − £225m = £27m Divide by the starting value: 27 ÷ 225 = 0.1200 = 12.0% Percentage change always uses the starting value as the base: (new − old) ÷ old. Dividing by the new value instead of the old one."
      },
      {
        "section": "numerical",
        "category": "P&L and margins",
        "topic": "Margin change in percentage points",
        "difficulty": 2,
        "timeSec": 75,
        "question": "Revenue grows from £190m to £200m and operating profit from £15.2m to £22m. By how much does the operating margin change?",
        "options": [
          "+37.5 percentage points",
          "+3.0 percentage points",
          "−3.0 percentage points",
          "+44.7 percentage points"
        ],
        "answer": 1,
        "working": [
          "Old margin = 15.2 ÷ 190 = 8.0%",
          "New margin = 22 ÷ 200 = 11.0%",
          "Change = 11 − 8 = 3.0 percentage points"
        ],
        "concept": "A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent.",
        "trap": "Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference.",
        "id": "N0111",
        "explanation": "Old margin = 15.2 ÷ 190 = 8.0% New margin = 22 ÷ 200 = 11.0% Change = 11 − 8 = 3.0 percentage points A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent. Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference."
      },
      {
        "section": "numerical",
        "category": "Data tables",
        "topic": "Share of total",
        "difficulty": 1,
        "timeSec": 60,
        "question": "Using the table, what share of total revenue comes from Europe?",
        "options": [
          "42.6%",
          "25.0%",
          "35.6%",
          "55.2%"
        ],
        "answer": 2,
        "working": [
          "Total = 60 + 160 + 80 + 150 = 450",
          "Europe share = 160 ÷ 450 = 35.6%"
        ],
        "concept": "A share is part ÷ whole. Add up the whole first.",
        "trap": "Dividing by the rest of the regions instead of the total.",
        "table": {
          "title": "Revenue by region (£m)",
          "columns": [
            "Region",
            "Revenue"
          ],
          "rows": [
            [
              "UK",
              60
            ],
            [
              "Europe",
              160
            ],
            [
              "US",
              80
            ],
            [
              "Asia",
              150
            ]
          ]
        },
        "id": "N0501",
        "explanation": "Total = 60 + 160 + 80 + 150 = 450 Europe share = 160 ÷ 450 = 35.6% A share is part ÷ whole. Add up the whole first. Dividing by the rest of the regions instead of the total."
      },
      {
        "section": "numerical",
        "category": "Percentages",
        "topic": "Reverse percentage",
        "difficulty": 2,
        "timeSec": 60,
        "question": "After a 50% increase, a client's annual fee is £540k. What was the fee before the increase?",
        "options": [
          "£324k",
          "£360k",
          "£490k",
          "£270k"
        ],
        "answer": 1,
        "working": [
          "New = old × 1.5",
          "Old = 540 ÷ 1.5 = £360k"
        ],
        "concept": "To undo a percentage increase, divide by (1 + rate). Taking the same percentage off doesn't get you back.",
        "trap": "Taking 50% off the new figure, which gives too low an answer.",
        "id": "N0871",
        "explanation": "New = old × 1.5 Old = 540 ÷ 1.5 = £360k To undo a percentage increase, divide by (1 + rate). Taking the same percentage off doesn't get you back. Taking 50% off the new figure, which gives too low an answer."
      },
      {
        "section": "numerical",
        "category": "P&L and margins",
        "topic": "Break-even volume",
        "difficulty": 2,
        "timeSec": 60,
        "question": "Fixed costs are £70,000. Each unit sells for £20 and costs £15 to make. How many units must be sold to break even?",
        "options": [
          "28,000 units",
          "14,000 units",
          "3,500 units",
          "4,667 units"
        ],
        "answer": 1,
        "working": [
          "Contribution per unit = £20 − £15 = £5",
          "Break-even = £70,000 ÷ £5 = 14,000 units"
        ],
        "concept": "Each unit sold contributes price minus variable cost towards fixed costs. Break-even is when contributions cover fixed costs.",
        "trap": "Dividing fixed costs by the selling price instead of the contribution.",
        "id": "N0801",
        "explanation": "Contribution per unit = £20 − £15 = £5 Break-even = £70,000 ÷ £5 = 14,000 units Each unit sold contributes price minus variable cost towards fixed costs. Break-even is when contributions cover fixed costs. Dividing fixed costs by the selling price instead of the contribution."
      }
    ]
  },
  "Sales & Trading / Markets": {
    "id": "hub-markets-v1",
    "commercial": [
      {
        "route": "markets",
        "section": "technical",
        "topic": "Bonds",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Bond prices and yields move:",
        "options": [
          "In the same direction",
          "Independently",
          "Only when coupons change",
          "In opposite directions"
        ],
        "answer": 3,
        "working": [],
        "concept": "A bond's cash flows are fixed. Paying less for them means a higher yield, paying more means a lower yield.",
        "trap": "",
        "source": "concept",
        "id": "T0074",
        "routeName": "Sales & Trading / Markets",
        "explanation": "A bond's cash flows are fixed. Paying less for them means a higher yield, paying more means a lower yield."
      },
      {
        "route": "markets",
        "section": "technical",
        "topic": "Yield curve",
        "difficulty": 2,
        "timeSec": 60,
        "question": "An inverted yield curve (short rates above long rates) is often read as a sign of:",
        "options": [
          "A stock market boom",
          "Rising inflation expectations",
          "Expected economic slowdown and future rate cuts",
          "Strong growth ahead"
        ],
        "answer": 2,
        "working": [],
        "concept": "Investors accept lower long-term yields when they expect central banks to cut rates in future, usually because growth is weakening.",
        "trap": "",
        "source": "concept",
        "id": "T0075",
        "routeName": "Sales & Trading / Markets",
        "explanation": "Investors accept lower long-term yields when they expect central banks to cut rates in future, usually because growth is weakening."
      },
      {
        "route": "markets",
        "section": "technical",
        "topic": "FX",
        "difficulty": 2,
        "timeSec": 60,
        "question": "If the Bank of England raises rates unexpectedly, sterling is most likely to:",
        "options": [
          "Stay unchanged",
          "Strengthen",
          "Weaken",
          "Be suspended from trading"
        ],
        "answer": 1,
        "working": [],
        "concept": "Higher rates make sterling deposits and gilts more attractive to international investors, increasing demand for the pound.",
        "trap": "",
        "source": "concept",
        "id": "T0076",
        "routeName": "Sales & Trading / Markets",
        "explanation": "Higher rates make sterling deposits and gilts more attractive to international investors, increasing demand for the pound."
      },
      {
        "route": "markets",
        "section": "technical",
        "topic": "Options",
        "difficulty": 2,
        "timeSec": 60,
        "question": "A call option gives the holder:",
        "options": [
          "A guaranteed profit",
          "The right, but not the obligation, to buy at a set price",
          "The right to sell at a set price",
          "The obligation to buy at a set price"
        ],
        "answer": 1,
        "working": [],
        "concept": "The buyer pays a premium for the choice. If the price rises above the strike, they can buy cheaply. If not, they let it expire and lose only the premium.",
        "trap": "",
        "source": "concept",
        "id": "T0077",
        "routeName": "Sales & Trading / Markets",
        "explanation": "The buyer pays a premium for the choice. If the price rises above the strike, they can buy cheaply. If not, they let it expire and lose only the premium."
      },
      {
        "route": "markets",
        "section": "technical",
        "topic": "Credit",
        "difficulty": 2,
        "timeSec": 60,
        "question": "A widening credit spread on a company's bonds suggests:",
        "options": [
          "Investors see higher default risk",
          "Government bond yields have fallen",
          "The bond's coupon has risen",
          "The company has become safer"
        ],
        "answer": 0,
        "working": [],
        "concept": "The spread is the extra yield over government bonds that investors demand for credit risk. If it widens, investors are more worried about getting paid.",
        "trap": "",
        "source": "concept",
        "id": "T0079",
        "routeName": "Sales & Trading / Markets",
        "explanation": "The spread is the extra yield over government bonds that investors demand for credit risk. If it widens, investors are more worried about getting paid."
      }
    ],
    "numerical": [
      {
        "section": "numerical",
        "category": "Currency",
        "topic": "Currency conversion",
        "difficulty": 1,
        "timeSec": 45,
        "question": "GBP/USD is 1.15 (£1 = $1.15). How much is £2,450 in USD?",
        "options": [
          "$2,818",
          "$3,099",
          "$2,130",
          "$2,565"
        ],
        "answer": 0,
        "working": [
          "£2,450 × 1.15 = $2,818"
        ],
        "concept": "Quote GBP/USD 1.25 means one pound buys 1.25 dollars. Pounds to dollars: multiply. Dollars to pounds: divide.",
        "trap": "Multiplying when you should divide (or the reverse).",
        "id": "N0421",
        "explanation": "£2,450 × 1.15 = $2,818 Quote GBP/USD 1.25 means one pound buys 1.25 dollars. Pounds to dollars: multiply. Dollars to pounds: divide. Multiplying when you should divide (or the reverse)."
      },
      {
        "section": "numerical",
        "category": "Percentages",
        "topic": "Percentage change",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Operating costs move from £225m to £252m. What is the percentage change?",
        "options": [
          "+10.7%",
          "+6.0%",
          "+12.0%",
          "−12.0%"
        ],
        "answer": 2,
        "working": [
          "Change = £252m − £225m = £27m",
          "Divide by the starting value: 27 ÷ 225 = 0.1200",
          "= 12.0%"
        ],
        "concept": "Percentage change always uses the starting value as the base: (new − old) ÷ old.",
        "trap": "Dividing by the new value instead of the old one.",
        "id": "N0001",
        "explanation": "Change = £252m − £225m = £27m Divide by the starting value: 27 ÷ 225 = 0.1200 = 12.0% Percentage change always uses the starting value as the base: (new − old) ÷ old. Dividing by the new value instead of the old one."
      },
      {
        "section": "numerical",
        "category": "Ratios",
        "topic": "Weighted average return",
        "difficulty": 2,
        "timeSec": 75,
        "question": "A portfolio is 40% equities returning 10%, 50% bonds returning 12% and 10% property returning 4%. What is the portfolio return?",
        "options": [
          "12.00%",
          "10.40%",
          "11.90%",
          "8.67%"
        ],
        "answer": 1,
        "working": [
          "= 40% × 10% + 50% × 12% + 10% × 4%",
          "= 10.40%"
        ],
        "concept": "A weighted average gives bigger holdings more say in the result.",
        "trap": "Taking a simple average of the three returns.",
        "id": "N0671",
        "explanation": "= 40% × 10% + 50% × 12% + 10% × 4% = 10.40% A weighted average gives bigger holdings more say in the result. Taking a simple average of the three returns."
      },
      {
        "section": "numerical",
        "category": "Lending",
        "topic": "Compound interest",
        "difficulty": 2,
        "timeSec": 60,
        "question": "£13,500 is deposited at 5% a year, compounded annually. What is the balance after 3 years?",
        "options": [
          "£2,025.00",
          "£15,627.94",
          "£16,409.33",
          "£15,525.00"
        ],
        "answer": 1,
        "working": [
          "£13,500 × (1 + 0.05)^3 = £15,627.94"
        ],
        "concept": "Compounding means you earn interest on previous interest, so the balance grows faster than simple interest.",
        "trap": "Using simple interest (rate × years) and ignoring interest on interest.",
        "id": "N0741",
        "explanation": "£13,500 × (1 + 0.05)^3 = £15,627.94 Compounding means you earn interest on previous interest, so the balance grows faster than simple interest. Using simple interest (rate × years) and ignoring interest on interest."
      },
      {
        "section": "numerical",
        "category": "P&L and margins",
        "topic": "Margin change in percentage points",
        "difficulty": 2,
        "timeSec": 75,
        "question": "Revenue grows from £190m to £200m and operating profit from £15.2m to £22m. By how much does the operating margin change?",
        "options": [
          "+37.5 percentage points",
          "+3.0 percentage points",
          "−3.0 percentage points",
          "+44.7 percentage points"
        ],
        "answer": 1,
        "working": [
          "Old margin = 15.2 ÷ 190 = 8.0%",
          "New margin = 22 ÷ 200 = 11.0%",
          "Change = 11 − 8 = 3.0 percentage points"
        ],
        "concept": "A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent.",
        "trap": "Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference.",
        "id": "N0111",
        "explanation": "Old margin = 15.2 ÷ 190 = 8.0% New margin = 22 ÷ 200 = 11.0% Change = 11 − 8 = 3.0 percentage points A margin is a percentage, so a change in margin is quoted in percentage points (pp), not percent. Quoting the relative change in the margin (%) or the growth in profit instead of the pp difference."
      }
    ]
  },
  "Asset Management / Investing": {
    "id": "hub-asset_management-v1",
    "commercial": [
      {
        "route": "asset_management",
        "section": "technical",
        "topic": "Diversification",
        "difficulty": 1,
        "timeSec": 45,
        "question": "Diversification reduces:",
        "options": [
          "All risk",
          "Market-wide risk",
          "Inflation",
          "Company-specific risk"
        ],
        "answer": 3,
        "working": [],
        "concept": "Spreading money across many holdings means one company's bad news matters less. It can't remove market risk, which hits everything at once.",
        "trap": "",
        "source": "concept",
        "id": "T0056",
        "routeName": "Asset Management",
        "explanation": "Spreading money across many holdings means one company's bad news matters less. It can't remove market risk, which hits everything at once."
      },
      {
        "route": "asset_management",
        "section": "technical",
        "topic": "Beta",
        "difficulty": 2,
        "timeSec": 60,
        "question": "A stock with a beta of 1.5 is expected to:",
        "options": [
          "Move about 1.5 times as much as the market",
          "Pay a 1.5% dividend",
          "Return 1.5% a year",
          "Be less risky than the market"
        ],
        "answer": 0,
        "working": [],
        "concept": "Beta measures sensitivity to the market. If the market rises 10%, a beta-1.5 stock would be expected to rise about 15%, and fall about 15% if the market falls 10%.",
        "trap": "",
        "source": "concept",
        "id": "T0057",
        "routeName": "Asset Management",
        "explanation": "Beta measures sensitivity to the market. If the market rises 10%, a beta-1.5 stock would be expected to rise about 15%, and fall about 15% if the market falls 10%."
      },
      {
        "route": "asset_management",
        "section": "technical",
        "topic": "Sharpe ratio",
        "difficulty": 2,
        "timeSec": 60,
        "question": "The Sharpe ratio measures:",
        "options": [
          "Return relative to an index",
          "Total return",
          "Return above the risk-free rate per unit of volatility",
          "Dividend yield"
        ],
        "answer": 2,
        "working": [],
        "concept": "It asks how much extra return you got for each unit of risk taken. Higher is better when comparing funds.",
        "trap": "",
        "source": "concept",
        "id": "T0058",
        "routeName": "Asset Management",
        "explanation": "It asks how much extra return you got for each unit of risk taken. Higher is better when comparing funds."
      },
      {
        "route": "asset_management",
        "section": "technical",
        "topic": "Active vs passive",
        "difficulty": 1,
        "timeSec": 45,
        "question": "A passive fund aims to:",
        "options": [
          "Time the market",
          "Track an index at low cost",
          "Avoid all losses",
          "Beat the market through stock picking"
        ],
        "answer": 1,
        "working": [],
        "concept": "Passive funds hold what's in an index and charge low fees. Active funds try to beat the index, and charge more for it.",
        "trap": "",
        "source": "concept",
        "id": "T0059",
        "routeName": "Asset Management",
        "explanation": "Passive funds hold what's in an index and charge low fees. Active funds try to beat the index, and charge more for it."
      },
      {
        "route": "asset_management",
        "section": "technical",
        "topic": "Bonds",
        "difficulty": 1,
        "timeSec": 45,
        "question": "When interest rates rise, existing bond prices usually:",
        "options": [
          "Stay the same",
          "Fall",
          "Double",
          "Rise"
        ],
        "answer": 1,
        "working": [],
        "concept": "An existing bond pays a fixed coupon. When new bonds pay more, the old one is less attractive, so its price falls until its yield matches the market.",
        "trap": "",
        "source": "concept",
        "id": "T0060",
        "routeName": "Asset Management",
        "explanation": "An existing bond pays a fixed coupon. When new bonds pay more, the old one is less attractive, so its price falls until its yield matches the market."
      }
    ],
    "numerical": [
      {
        "section": "numerical",
        "category": "Ratios",
        "topic": "Weighted average return",
        "difficulty": 2,
        "timeSec": 75,
        "question": "A portfolio is 40% equities returning 10%, 50% bonds returning 12% and 10% property returning 4%. What is the portfolio return?",
        "options": [
          "12.00%",
          "10.40%",
          "11.90%",
          "8.67%"
        ],
        "answer": 1,
        "working": [
          "= 40% × 10% + 50% × 12% + 10% × 4%",
          "= 10.40%"
        ],
        "concept": "A weighted average gives bigger holdings more say in the result.",
        "trap": "Taking a simple average of the three returns.",
        "id": "N0671",
        "explanation": "= 40% × 10% + 50% × 12% + 10% × 4% = 10.40% A weighted average gives bigger holdings more say in the result. Taking a simple average of the three returns."
      },
      {
        "section": "numerical",
        "category": "Lending",
        "topic": "Compound interest",
        "difficulty": 2,
        "timeSec": 60,
        "question": "£13,500 is deposited at 5% a year, compounded annually. What is the balance after 3 years?",
        "options": [
          "£2,025.00",
          "£15,627.94",
          "£16,409.33",
          "£15,525.00"
        ],
        "answer": 1,
        "working": [
          "£13,500 × (1 + 0.05)^3 = £15,627.94"
        ],
        "concept": "Compounding means you earn interest on previous interest, so the balance grows faster than simple interest.",
        "trap": "Using simple interest (rate × years) and ignoring interest on interest.",
        "id": "N0741",
        "explanation": "£13,500 × (1 + 0.05)^3 = £15,627.94 Compounding means you earn interest on previous interest, so the balance grows faster than simple interest. Using simple interest (rate × years) and ignoring interest on interest."
      },
      {
        "section": "numerical",
        "category": "Currency",
        "topic": "Currency conversion",
        "difficulty": 1,
        "timeSec": 45,
        "question": "GBP/USD is 1.15 (£1 = $1.15). How much is £2,450 in USD?",
        "options": [
          "$2,818",
          "$3,099",
          "$2,130",
          "$2,565"
        ],
        "answer": 0,
        "working": [
          "£2,450 × 1.15 = $2,818"
        ],
        "concept": "Quote GBP/USD 1.25 means one pound buys 1.25 dollars. Pounds to dollars: multiply. Dollars to pounds: divide.",
        "trap": "Multiplying when you should divide (or the reverse).",
        "id": "N0421",
        "explanation": "£2,450 × 1.15 = $2,818 Quote GBP/USD 1.25 means one pound buys 1.25 dollars. Pounds to dollars: multiply. Dollars to pounds: divide. Multiplying when you should divide (or the reverse)."
      },
      {
        "section": "numerical",
        "category": "Growth rates",
        "topic": "Compound annual growth rate",
        "difficulty": 3,
        "timeSec": 90,
        "question": "A division's revenue grows from £50m to £60.5m over 2 years. What is the compound annual growth rate (CAGR), to the nearest whole percent?",
        "options": [
          "21%",
          "11%",
          "12%",
          "10%"
        ],
        "answer": 3,
        "working": [
          "CAGR = (end ÷ start)^(1/2) − 1",
          "= (60.5 ÷ 50)^(1/2) − 1 ≈ 10%"
        ],
        "concept": "CAGR is the steady yearly rate that gets you from start to end with compounding.",
        "trap": "Dividing total growth by the number of years (simple average), which overstates the rate.",
        "id": "N0201",
        "explanation": "CAGR = (end ÷ start)^(1/2) − 1 = (60.5 ÷ 50)^(1/2) − 1 ≈ 10% CAGR is the steady yearly rate that gets you from start to end with compounding. Dividing total growth by the number of years (simple average), which overstates the rate."
      },
      {
        "section": "numerical",
        "category": "Data tables",
        "topic": "Share of total",
        "difficulty": 1,
        "timeSec": 60,
        "question": "Using the table, what share of total revenue comes from Europe?",
        "options": [
          "42.6%",
          "25.0%",
          "35.6%",
          "55.2%"
        ],
        "answer": 2,
        "working": [
          "Total = 60 + 160 + 80 + 150 = 450",
          "Europe share = 160 ÷ 450 = 35.6%"
        ],
        "concept": "A share is part ÷ whole. Add up the whole first.",
        "trap": "Dividing by the rest of the regions instead of the total.",
        "table": {
          "title": "Revenue by region (£m)",
          "columns": [
            "Region",
            "Revenue"
          ],
          "rows": [
            [
              "UK",
              60
            ],
            [
              "Europe",
              160
            ],
            [
              "US",
              80
            ],
            [
              "Asia",
              150
            ]
          ]
        },
        "id": "N0501",
        "explanation": "Total = 60 + 160 + 80 + 150 = 450 Europe share = 160 ÷ 450 = 35.6% A share is part ÷ whole. Add up the whole first. Dividing by the rest of the regions instead of the total."
      }
    ]
  }
};
