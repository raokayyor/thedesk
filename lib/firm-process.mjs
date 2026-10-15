// Firm hiring-process notes imported from the supplied dated deadline tracker.
// Keep in sync with tracker.html. Ideally both read one shared data file.
// Last checked: October 2026.
export const FIRM_PROCESS={
 "Goldman Sachs": "Up to four applications per recruiting year, then the rest are withdrawn automatically. First round is a HireVue video interview; the final round is a Superday of 2–5 interviews.",
 "J.P. Morgan": "Applications are reviewed on a rolling basis, and only locations currently hiring appear on its application site. An optional virtual work experience on Forage doesn't affect decisions.",
 "Morgan Stanley": "No 2027 London graduate posting could be confirmed on Morgan Stanley's site when we checked. Watch its careers search for London postings.",
 "Bank of America": "No 2027 London full-time analyst posting was found. London hiring runs through 2027 summer internships, and the London IB summer role closed on 4 October 2026.",
 "Citi": "Most London 2027 banking analyst roles are conversion routes for Citi's own 2026 summer interns. Open to new applicants: Markets Sales & Trading and Commercial Banking.",
 "Barclays": "Two short interactive online assessments, then a 2–3 stage assessment centre including a motivational interview with a senior leader. Visa sponsorship is available on these programmes.",
 "Deutsche Bank": "One UK application per season. Online tests must be done within 96 hours. Roles can close early with 48 hours' notice, and windows are short: Markets was open for one week.",
 "UBS": "One UK programme application per academic year. Verbal, numerical and inductive reasoning tests plus a culture-match test, done within 7 days with no retakes. London 2027 postings could not be confirmed when we checked.",
 "PwC": "One application per intake year across every PwC graduate programme, so choose your business area carefully. SHL tests cover numerical, inductive and deductive reasoning, then a video interview and a virtual assessment centre.",
 "Deloitte": "One application per programme per year, and programmes close early when full. After the online assessment there's a Job Simulation with recorded video answers, then an in-person final stage.",
 "EY": "One EY application every 6 months. A rejection means waiting 6 months to reapply. No degree class or UCAS requirement; GCSE 4/C in English and Maths and 3 A-levels or equivalent.",
 "KPMG": "2:1, 120 UCAS points and GCSE 5/B, applied contextually. A 36-minute timed cognitive test and a 6-question pre-recorded video interview, then a half-day Launch Pad with offers within 2 working days.",
 "Zurich": "You can apply to only one Zurich programme. No visa sponsorship: you need indefinite UK right to work and 3 years' UK residence. Tests are run by Cappfinity, including a job simulation.",
 "WTW": "One WTW application per year. Online test and video interview, then an assessment centre. Strong interns can be offered the graduate programme.",
 "Aon": "Reviews applications on a rolling basis and may close before 7 December. Assessment centres run from mid-January.",
 "Beazley": "One portal for every 2027 scheme. Underwriting schemes take a 2:2 in any subject, and Beazley publishes a £33,000 salary plus bonus.",
 "Legal & General": "Graduate roles usually open in October and internships in November, with no closing dates, so apply on the first day.",
 "Lloyd's of London": "The last cycle opened in January, with assessment centres in March and April. One application per person per season.",
 "Aviva": "No visa sponsorship. 2027 graduate roles weren't posted when we checked; 2026 salaries were £33,200–£34,200.",
 "RSA (Intact)": "RSA's careers site now redirects to Intact Insurance UK. Graduate and internship applications are currently closed."
};
export function firmProcess(firm){
 const key=Object.keys(FIRM_PROCESS).find(k=>k.toLowerCase()===String(firm||"").trim().toLowerCase());
 return key?{firm:key,process:FIRM_PROCESS[key],source:"Imported October 2026 tracker snapshot; confirm on the official vacancy and assessment invitation",verified:false}:null;
}