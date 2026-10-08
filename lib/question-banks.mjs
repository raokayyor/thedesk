// Add approved route banks here. Null means unavailable, never fallback to another route.
export const GENERAL_BANK={
  "id": "general-finance-v1",
  "commercial": [
    {
      "topic": "Rate impact on borrowing costs",
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
