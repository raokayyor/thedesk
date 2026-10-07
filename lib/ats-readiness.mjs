// The Desk's transparent text-readiness heuristic, not a vendor ATS simulator.
export const ATS_VERSION = 'desk-ats-v1';
const ROLE_TERMS = {
  ibd: ['valuation', 'financial modelling', 'financial analysis', 'due diligence', 'mergers and acquisitions'],
  markets: ['markets', 'risk', 'trading', 'derivatives', 'fixed income'],
  assetManagement: ['investment research', 'portfolio', 'risk', 'valuation', 'asset allocation'],
  accounting: ['accounting', 'financial reporting', 'audit', 'reconciliation', 'tax'],
  research: ['research', 'valuation', 'financial analysis', 'forecasting', 'equity'],
};
const normalize = value => String(value || '').normalize('NFKC').toLowerCase()
  .replace(/[–—-]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
function routeTerms(profile) {
  const route = normalize(profile.targetSector || profile.targetDivision || profile.track);
  if (/investment banking|\bibd\b|mergers/.test(route)) return ROLE_TERMS.ibd;
  if (/asset management|\bam\b/.test(route)) return ROLE_TERMS.assetManagement;
  if (/sales|trading|markets|\bst\b/.test(route)) return ROLE_TERMS.markets;
  if (/account|audit/.test(route)) return ROLE_TERMS.accounting;
  if (/research/.test(route)) return ROLE_TERMS.research;
  return [];
}
const ALIASES = {
  'financial modelling': ['financial modeling', 'financial model', 'financial models'],
  'mergers and acquisitions': ['m&a', 'mergers acquisitions'],
  'fixed income': ['fixed-income'],
};
function contains(text, term) {
  const candidates = [term, ...(ALIASES[term] || [])];
  return candidates.some(t => (' ' + text + ' ').includes(' ' + normalize(t) + ' '));
}
export function assessAtsReadiness({ cvText, profile = {}, targetKeywords = [] } = {}) {
  const raw = typeof cvText === 'string' ? cvText : '';
  const text = normalize(raw);
  const limitations = ['Text-only check: original PDF layout, columns, tables and reading order are not verified.',
    'This is The Desk’s readiness heuristic, not a bank pass mark or rejection probability.'];
  if (text.length < 100) return { version: ATS_VERSION, status: 'insufficient_text', score: null,
    weightedContribution: null, components: [], matchedKeywords: [], missingKeywords: [], limitations };
  const explicit = Array.isArray(targetKeywords) ? [...new Set(targetKeywords
    .filter(t => typeof t === 'string' && t.trim().length >= 2 && t.length <= 80).map(normalize))].slice(0, 30) : [];
  const terms = explicit.length ? explicit : routeTerms(profile);
  const checks = [];
  const add = (component, max, items) => {
    const passed = items.filter(i => i.passed).length;
    checks.push({ component, max, earned: Math.round(max * passed / items.length * 10) / 10, checks: items });
  };
  const replacementRate = (raw.match(/\uFFFD/g) || []).length / Math.max(1, raw.length);
  add('textReadability', 25, [
    { id: 'usableText', passed: text.length >= 300, explanation: 'At least 300 readable characters extracted.' },
    { id: 'cleanExtraction', passed: replacementRate < .01, explanation: 'Fewer than 1% replacement characters.' },
  ]);
  add('sectionStructure', 25, [
    { id: 'education', passed: /\b(education|academic background|qualifications)\b/.test(text), explanation: 'Recognisable education heading.' },
    { id: 'experience', passed: /\b(experience|employment|work history|projects)\b/.test(text), explanation: 'Recognisable experience or projects heading.' },
    { id: 'skills', passed: /\b(skills|technical proficiency|competencies)\b/.test(text), explanation: 'Recognisable skills heading.' },
  ]);
  add('contactAndChronology', 15, [
    { id: 'email', passed: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(raw), explanation: 'Readable email address; contact details are not returned.' },
    { id: 'dates', passed: /\b(?:19|20)\d{2}\b/.test(raw), explanation: 'Recognisable year dates for chronology.' },
  ]);
  const matchedKeywords = terms.filter(term => contains(text, term));
  const missingKeywords = terms.filter(term => !contains(text, term));
  if (terms.length) add('targetRoleTerms', 35, terms.map(term => ({ id: term, passed: contains(text, term),
    explanation: 'Term appears in extracted text; occurrence does not prove experience or skill.' })));
  else limitations.push('Target role is missing or unsupported. Keyword alignment was not assessed; provide targetKeywords from the role specification.');
  const assessedMax = checks.reduce((sum, c) => sum + c.max, 0);
  const points = checks.reduce((sum, c) => sum + c.earned, 0);
  const complete = assessedMax === 100;
  const score = complete ? Math.round(points) : null;
  return { version: ATS_VERSION, status: complete ? 'assessed' : 'partial', score,
    band: score === null ? null : score >= 75 ? 'Ready to refine' : score >= 50 ? 'Room to improve' : 'Needs attention',
    components: checks, assessedMax, keywordSource: explicit.length ? 'supplied_target_terms' : terms.length ? 'desk_route_dictionary' : 'none',
    matchedKeywords, missingKeywords,
    suggestedActions: [
      ...checks.flatMap(c => c.checks.filter(i => !i.passed && c.component !== 'targetRoleTerms').map(i => i.explanation)),
      ...(missingKeywords.length ? ['Review missing role terms. Add them only where supported by your actual experience; do not stuff keywords.'] : []),
    ],
    weightedContribution: score === null ? null : { component: 'ats', score, max: 10, earned: score / 10,
      appliedToOverall: false }, limitations };
}