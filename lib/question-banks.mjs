// Add approved route banks here. Null means unavailable, never fallback to another route.
export const GENERAL_BANK={
  "id": "general-finance-v1",
  "commercial": [
    {
      "topic": "Rate impact on borrowing costs",
      "working": ["A higher policy rate raises banks' funding costs, so loan and mortgage rates follow.", "The effect on inflation comes through slower spending, with a lag of months to years. It is not instant."],
      "trap": "Choosing 'inflation instantly falls'. Rates work with a lag.",
      "drill": "If the Bank of England cuts rates, what usually happens to a variable-rate mortgage payment?",
      "drillAnswer": "It usually falls, because the lender's rate tracks Bank Rate.",
      "answer": 0,
      "explanation": "Higher policy rates tend to raise borrowing costs. They do not instantly eliminate inflation.",
      "question": "If the Bank of England unexpectedly raises rates, which is the most direct likely effect?",
      "options": [
        "Borrowing costs rise",
        "Government spending automatically rises",
        "Equity prices must rise",
        "Inflation instantly falls to zero"
      ]
    },
    {
      "topic": "Equity dilution",
      "working": ["Ownership % = your shares ÷ total shares.", "You own 10 of 100 shares, which is 10%. The company issues 25 new shares to other investors, so you now own 10 ÷ 125 = 8%.", "Your percentage falls, but value isn't necessarily lost: if the shares are issued at a fair price, the cash raised offsets the dilution."],
      "trap": "Treating dilution of percentage ownership as a guaranteed fall in value.",
      "drill": "You own 20 of 200 shares. The company issues 50 new shares. What is your ownership now?",
      "drillAnswer": "20 ÷ 250 = 8%, down from 10%.",
      "answer": 0,
      "explanation": "Issuing additional shares can reduce an existing shareholder’s percentage ownership unless they participate.",
      "question": "A company issues new shares. What is the most direct effect on existing shareholders?",
      "options": [
        "Possible dilution",
        "Guaranteed dividend increase",
        "Debt always rises",
        "Revenue doubles"
      ]
    },
    {
      "topic": "EBITDA definition",
      "working": ["Start from operating profit (EBIT).", "Add back depreciation and amortisation, which are non-cash charges.", "It ignores capex, working capital, interest and tax, so it is not cash flow."],
      "trap": "Calling EBITDA cash flow.",
      "drill": "EBIT is £40m, depreciation £8m and amortisation £2m. What is EBITDA?",
      "drillAnswer": "£40m + £8m + £2m = £50m.",
      "answer": 0,
      "explanation": "EBITDA is earnings before interest, tax, depreciation and amortisation. It is not cash flow.",
      "question": "EBITDA is best described as:",
      "options": [
        "Profit before interest, tax, depreciation and amortisation",
        "Cash in the bank",
        "Revenue after tax",
        "Market capitalisation"
      ]
    },
    {
      "topic": "Strategic buyer in M&A",
      "working": ["A strategic buyer is an operating company, such as a competitor, supplier or customer, buying for fit and synergies.", "A financial buyer is usually a private equity fund buying for an investment return, often using debt, and planning to sell in 3–7 years.", "A strategic buyer can often pay more, because synergies add value that only it can capture."],
      "trap": "Mixing up strategic and financial (private equity) buyers.",
      "drill": "Why might a strategic buyer outbid a private equity fund for the same company?",
      "drillAnswer": "It can count on synergies, such as cost savings or cross-selling, that the fund can't capture. That makes the target worth more to the strategic buyer.",
      "answer": 0,
      "explanation": "A strategic buyer is an operating business buying another business, often for operational fit or synergies.",
      "question": "In M&A, a strategic buyer is usually:",
      "options": [
        "An operating company buying another business",
        "A retail investor",
        "A bondholder",
        "A regulator"
      ]
    },
    {
      "topic": "Credit spreads and credit risk",
      "working": ["Credit spread = corporate bond yield − government bond yield of the same maturity.", "A wider spread means investors want more compensation for default risk or for poorer liquidity."],
      "trap": "Reading a wider spread as lower risk.",
      "drill": "A corporate bond yields 6.5% and the equivalent gilt yields 4.0%. What is the spread?",
      "drillAnswer": "2.5 percentage points, or 250 basis points.",
      "answer": 0,
      "explanation": "A wider credit spread generally reflects greater perceived credit risk or weaker market liquidity.",
      "question": "A widening credit spread usually signals:",
      "options": [
        "Higher perceived credit risk",
        "Lower perceived credit risk",
        "Guaranteed rate cuts",
        "Higher dividends"
      ]
    }
  ],
  "numerical": [
    {
      "topic": "Percentage growth",
      "working": ["Change = £100m − £80m = £20m.", "Divide by the original figure: £20m ÷ £80m = 0.25 = 25%."],
      "trap": "Dividing by the new figure (£20m ÷ £100m = 20%).",
      "drill": "Sales go from £50m to £65m. What is the percentage increase?",
      "drillAnswer": "£15m ÷ £50m = 30%.",
      "answer": 1,
      "explanation": "(100 − 80) / 80 × 100 = 25%. Divide by the original revenue, not the new revenue.",
      "question": "Revenue rises from £80m to £100m. Percentage increase?",
      "options": [
        "20%",
        "25%",
        "30%",
        "40%"
      ]
    },
    {
      "topic": "Percentage fall",
      "working": ["Fall = 15% × £200 = £30.", "New price = £200 − £30 = £170. In one step: £200 × 0.85 = £170."],
      "trap": "Giving the size of the fall (£30) instead of the new price.",
      "drill": "A £360 share falls 25%. What is the new price?",
      "drillAnswer": "£360 × 0.75 = £270.",
      "answer": 2,
      "explanation": "£200 × (1 − 0.15) = £170. A 15% fall is £30.",
      "question": "A £200 share falls 15%. New price?",
      "options": [
        "£160",
        "£165",
        "£170",
        "£175"
      ]
    },
    {
      "topic": "EV / EBITDA valuation",
      "working": ["Enterprise value = EBITDA × multiple.", "£30m × 8 = £240m.", "To get equity value, subtract net debt from enterprise value."],
      "trap": "Calling the answer equity value.",
      "drill": "EBITDA is £45m at 6x, and net debt is £70m. What is the equity value?",
      "drillAnswer": "Enterprise value = £270m. Equity value = £270m − £70m = £200m.",
      "answer": 2,
      "explanation": "Enterprise value = £30m EBITDA × 8 = £240m. This is enterprise value, not equity value.",
      "question": "EBITDA is £30m and EV/EBITDA is 8x. Enterprise value?",
      "options": [
        "£180m",
        "£210m",
        "£240m",
        "£300m"
      ]
    },
    {
      "topic": "Net debt",
      "working": ["Net debt = total debt − cash.", "£120m − £20m = £100m.", "Net debt is the bridge between equity value and enterprise value: EV = equity value + net debt."],
      "trap": "Adding cash instead of subtracting it.",
      "drill": "Debt is £85m and cash £30m. What is net debt? If equity value is £200m, what is EV?",
      "drillAnswer": "Net debt = £55m. EV = £200m + £55m = £255m.",
      "answer": 1,
      "explanation": "Net debt = £120m debt − £20m cash = £100m.",
      "question": "Debt £120m, cash £20m. Net debt?",
      "options": [
        "£80m",
        "£100m",
        "£120m",
        "£140m"
      ]
    },
    {
      "topic": "Margin change in percentage points",
      "working": ["Percentage-point change = the simple difference: 12% − 10% = 2 percentage points.", "Relative change = 2 ÷ 10 = 20%. That is a different measure."],
      "trap": "Saying the margin rose 20% when the question asks for percentage points.",
      "drill": "A margin falls from 25% to 20%. What is the change in percentage points, and in relative terms?",
      "drillAnswer": "Down 5 percentage points, which is a 20% relative fall.",
      "answer": 1,
      "explanation": "12% − 10% = 2 percentage points. The relative percentage increase is 20%.",
      "question": "A margin rises from 10% to 12%. Increase in percentage points?",
      "options": [
        "1",
        "2",
        "10",
        "20"
      ]
    }
  ]
};
import {HUB_ROUTE_BANKS} from './route-bank-selections.mjs';
export const ROUTE_BANKS={
 'General Finance':GENERAL_BANK,
 'Investment Banking / IBD':{...GENERAL_BANK,id:'ibd-v1'},
 'Accounting / Audit':null,
 'Sales & Trading / Markets':null,
 'Asset Management / Investing':null,
 'Corporate Banking':null,
 'Consulting / Advisory':null,
 'Equity Research':null,
 ...HUB_ROUTE_BANKS
};
export function questionsForRoute(route,banks=ROUTE_BANKS){
 const key=Object.keys(banks).find(k=>k.toLowerCase()===String(route||'').trim().toLowerCase());
 const bank=banks[key];if(!bank)throw new Error('The question bank for '+route+' is not available yet. Your CV remains on this form; please return when the route bank is ready.');
 for(const group of ['commercial','numerical'])if(!Array.isArray(bank[group])||bank[group].length<5||bank[group].some(q=>typeof q.question!=='string'||!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||typeof q.topic!=='string'||typeof q.explanation!=='string'))throw new Error('Invalid question bank for '+route);
 return {...bank,commercial:bank.commercial.slice(0,5),numerical:bank.numerical.slice(0,5)};
}