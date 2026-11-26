// The Desk: CV fault framework (v1)
// One fixed rulebook so every free summary is built the same way.
// Deterministic: same CV text in -> same faults, same order out. No AI needed to find faults;
// AI is only used later to WRITE fixes, and those are validated separately.
// Wording marked [RAO] needs Rao's sign-off before launch.

// ---------- 1. Verdict bands ----------
export const VERDICTS = [
  { min: 0,  max: 44,  band: 'Developing',  headline: "Right now, you'd likely be screened out." },
  { min: 45, max: 64,  band: 'Developing',  headline: "You'd get read, but not shortlisted." },
  { min: 65, max: 74,  band: 'Borderline',  headline: "You're close, but something would stop you." },
  { min: 75, max: 100, band: 'Competitive', headline: "You'd likely be shortlisted, but not every line is pulling its weight." },
]; // [RAO] headlines

export function verdictFor(score) {
  return VERDICTS.find(v => score >= v.min && score <= v.max) || VERDICTS[0];
}

// ---------- 2. Line-level faults (each flagged CV line) ----------
// weight = how much it hurts a screener's read; why = the one-line reason shown to the student.
const RX = {
  dutyStart: /^(responsible for|helped|assisted|supported|worked on|worked in|did|involved in|duties included|tasks included|in charge of)\b/i,
  exposure: /^(shadowed|observed|attended|sat in on|watched|learnt about|learned about)\b/i,
  number: /\d/,
  outcome: /\b(so that|which (led|meant|helped|allowed|cut|saved|increased|reduced)|resulting|result(ed)? in|increas|reduc|sav(ed|ing)|cut|grew|growth|won|delivered|improv|raised|launched|achiev|led to|meaning|so the|used (by|in|to)|adopted|selected|approved|recommend|because|flagged|identified|matched|chosen|went to)/i,
  weakVerb: /^(helped|assisted|supported|did|worked|was|got|went|made)\b/i,
  softClaim: /\b(team player|hard[- ]working|good communication|communication skills|excellent communicat|people person|self[- ]motivated|detail[- ]oriented|passionate|motivated|enthusiastic|fast learner|quick learner)\b/i,
  memberOnly: /^(member|attendee|participant)\b/i,
  undermine: /\b(family friend'?s?|my (dad|mum|father|mother|uncle|aunt)'?s|basic|some|a bit|helped out|just|minor)\b/i,
};

// Which faults apply in which section (skills/positions lines aren't judged on "results").
const SECTION_FAULTS = {
  internship: 'notSkills', experience: 'notSkills', // every fault except the skills-only one
  positions: ['membership_only','soft_claim','self_undermining','no_outcome','too_short'],
  skills: ['soft_claim','skill_claim_no_evidence'],
};
// When a line has several faults, show the most specific reason first.
const WHY_PRIORITY = ['exposure_not_contribution','duty_not_achievement','soft_claim','skill_claim_no_evidence','membership_only','self_undermining','no_outcome','no_number','weak_verb','too_short'];
export const LINE_FAULTS = [
  { id: 'duty_not_achievement', weight: 5, test: l => RX.dutyStart.test(l),
    why: 'Says what you were there for, not what you did.' },
  { id: 'exposure_not_contribution', weight: 5, test: l => RX.exposure.test(l),
    why: 'Shows you were in the room, not what you contributed.' },
  { id: 'no_outcome', weight: 4, test: l => !RX.outcome.test(l),
    why: 'No result: a screener can\'t tell if it mattered.' },
  { id: 'no_number', weight: 3, test: l => !RX.number.test(l),
    why: 'No number, so there\'s no sense of scale.' },
  { id: 'weak_verb', weight: 2, test: l => RX.weakVerb.test(l) && !RX.dutyStart.test(l),
    why: 'Weak opening verb hides your part in it.' },
  { id: 'soft_claim', weight: 4, test: l => RX.softClaim.test(l),
    why: 'A claim anyone can write. Banks want the evidence, not the adjective.' },
  { id: 'skill_claim_no_evidence', weight: 3, test: l => /\bexcel\b/i.test(l) && !/(model|pivot|vlookup|xlookup|macro|vba|dcf|lbo|comps|build|built)/i.test(l),
    why: '"Excel" with nothing built: every applicant writes this.' },
  { id: 'membership_only', weight: 4, test: l => RX.memberOnly.test(l),
    why: 'Membership alone shows interest, not action.' },
  { id: 'too_short', weight: 2, test: l => l.split(/\s+/).length < 6,
    why: 'Too thin to judge: one short phrase.' },
  { id: 'self_undermining', weight: 3, test: l => RX.undermine.test(l),
    why: 'A word here undersells you or invites the wrong question.' }, // [RAO]
];

// Section weights: a weak line hurts more in the sections a screener reads first.
const SECTION_WEIGHT = { internship: 1.5, experience: 1.3, education: 1.0, positions: 1.1, skills: 0.9, interests: 0.7, other: 1.0 };

// ---------- 3. CV-level gaps -> "Why you wouldn't be shortlisted" reasons ----------
// Each has a check (true = gap present), points at stake, and a blunt one-line reason.
// The pool is ordered so every CV gets 3 reasons; FALLBACKS guarantee the third.
const has = (cv, rx) => rx.test(cv.text);
export const CV_GAPS = [
  { id: 'internship_tasks_only', points: 12,
    check: cv => cv.internshipLines.length > 0 && cv.internshipLines.every(l => !RX.outcome.test(l)),
    reason: 'Your internship says what you did, not what it achieved.' },
  { id: 'no_relevant_experience', points: 12,
    check: cv => cv.internshipLines.length === 0 && !has(cv, /\b(bank|investment|finance|financial|accountan|audit|asset|fund|capital|trading|valuation|equity|M&A|deal)\b/i),
    reason: 'Nothing on your CV yet is close to the job you want.' },
  { id: 'no_quantified_lines', points: 10,
    check: cv => cv.bullets.filter(l => RX.number.test(l)).length === 0,
    reason: 'Not one line has a number in it, so nothing shows scale.' },
  { id: 'no_leadership', points: 9,
    check: cv => !has(cv, /\b(led|lead|leader|captain|president|chair|founded|co-founded|organis|organiz|managed|trained|mentored|coordinat|head of|vice[- ]president|treasurer|secretary|committee)\b/i),
    reason: 'Nothing shows you can lead or take responsibility.' },
  { id: 'no_commercial_awareness', points: 8,
    check: cv => !has(cv, /\b(deal|M&A|merger|acquisition|valuation|DCF|comps|market|portfolio|stock pitch|equity research|trading|fund|investment banking|IPO|bond|rates|FX)\b/i),
    reason: 'Nothing shows you follow markets or deals.' },
  { id: 'why_finance_missing', points: 7,
    check: cv => !cv.internshipLines.some(l => /\b(finance|valuation|acquisition|deal|investment|EBITDA|model|audit|M&A)\b/i.test(l))
      && !has(cv, /\b(valuation|DCF|spring week|insight (day|week)|investment (club|society)|trading (competition|challenge)|stock pitch|finance society.*(committee|analyst|pitch|led|organis)|case competition|virtual (internship|experience)|bright network|forage)\b/i),
    reason: "There's no sign of why you want finance, beyond saying so." },
  { id: 'skills_as_claims', points: 6,
    check: cv => cv.skillsLines.some(l => RX.softClaim.test(l)) || cv.skillsLines.some(l => /\bexcel\b/i.test(l) && !/(model|pivot|vlookup|xlookup|macro|vba|dcf|lbo|build|built)/i.test(l)),
    reason: 'Your skills are claims, not evidence (e.g. "Excel" with nothing built).' },
  { id: 'interests_generic', points: 4,
    check: cv => cv.interestLines.length > 0 && cv.interestLines.every(l => !/\d|(compet|captain|marathon|grade|award|club|team.*(won|league)|published|founded|blog)/i.test(l)),
    reason: 'Your interests are generic, a missed chance to stand out.' },
];
export const FALLBACK_GAPS = [ // used only if fewer than 3 gaps fire (strong CVs)
  { id: 'so_what_layer', points: 5, check: () => true,
    reason: 'Your best work stops at the method, not what it meant for a decision.' },
  { id: 'firm_fit', points: 4, check: () => true,
    reason: "Nothing on your CV connects you to {firm} in particular." },
  { id: 'ordering', points: 3, check: () => true,
    reason: 'Your strongest evidence isn\'t where a screener looks first.' },
];

// ---------- 4. University & course (factual, approved wording only) ----------
// [RAO] Must approve every string. Never say a university is "not good enough". No public target lists.
export const COURSE_NOTES = {
  finance:   'Your course is directly relevant. Screeners will expect you to know the basics in interview.',
  economics: 'Your course is relevant. Screeners will look for where you\'ve applied it to real companies or markets.',
  maths:     'A quantitative course is valued. Show you can turn the numbers into a commercial view.',
  other:     'Banks hire from many courses. What matters is showing commercial interest outside your degree.',
};
export function courseType(text) {
  if (/accounting|finance|banking/i.test(text)) return 'finance';
  if (/economic/i.test(text)) return 'economics';
  if (/math|physics|engineering|computer|statistic|data/i.test(text)) return 'maths';
  return 'other';
}
export function gradeNote(text) {
  if (/\b(first|1st)\b/i.test(text)) return 'Predicted First: above the usual minimum for most graduate programmes.';
  if (/\b2[:.]1|upper second/i.test(text)) return 'Predicted 2:1: meets the usual minimum for most graduate programmes.';
  if (/\b2[:.]2|lower second/i.test(text)) return 'Predicted 2:2: some programmes ask for a 2:1, so check each firm\'s requirements.';
  return 'No predicted grade on your CV. Screeners usually look for one.';
} // [RAO]

// ---------- 5. Parse ----------
export function parseCv(raw) {
  const text = String(raw || '');
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  let section = 'other';
  const out = { text, lines: [], bullets: [], internshipLines: [], skillsLines: [], interestLines: [] };
  for (const l of lines) {
    const h = l.replace(/[^a-z ]/gi, '').trim().toLowerCase();
    if (/^(experience|work experience|employment|professional experience)$/.test(h)) { section = 'experience'; continue; }
    if (/^(education|academic)/.test(h)) { section = 'education'; continue; }
    if (/^(positions|leadership|extra.?curricular|activities|positions of responsibility)/.test(h)) { section = 'positions'; continue; }
    if (/^(skills|skills and interests|technical skills)/.test(h)) { section = 'skills'; continue; }
    if (/^interests/.test(h)) { section = 'interests'; }
    const isBullet = /^[-•*·▪–]\s*/.test(l);
    const clean = l.replace(/^[-•*·▪–]\s*/, '').trim();
    const isRoleHeader = !isBullet && section === 'experience' && /\b(20\d\d|intern|assistant|analyst|associate|member)\b/i.test(clean) && /,/.test(clean);
    if (isRoleHeader) { out.currentRole = clean; out.currentIsInternship = /intern|placement|insight|spring/i.test(clean); continue; }
    const sec = section === 'experience' && out.currentIsInternship ? 'internship' : (/^interests?:/i.test(clean) ? 'interests' : section);
    const item = { text: clean, section: sec, role: out.currentRole || null };
    out.lines.push(item);
    if (isBullet || sec === 'positions') out.bullets.push(clean);
    if (sec === 'internship') out.internshipLines.push(clean);
    if (sec === 'skills') out.skillsLines.push(clean);
    if (sec === 'interests') out.interestLines.push(clean);
  }
  return out;
}

// ---------- 6. Run the framework ----------
export function runFramework(rawCv, { firm = 'the firm' } = {}) {
  const cv = parseCv(rawCv);
  // Flagged lines: bullets, positions and skills claims; ranked by weighted severity, then original order.
  const candidates = cv.lines.filter(x => ['internship','experience','positions','skills'].includes(x.section)
    && !/^(sep|jan|feb|mar|apr|may|jun|jul|aug|oct|nov|dec)\b/i.test(x.text));
  const flagged = candidates.map((x, i) => {
    const allowed = SECTION_FAULTS[x.section];
    const ok = f => allowed === 'notSkills' ? f.id !== 'skill_claim_no_evidence' : (!allowed || allowed.includes(f.id));
    const faults = LINE_FAULTS.filter(f => ok(f) && f.test(x.text))
      .sort((a, b) => WHY_PRIORITY.indexOf(a.id) - WHY_PRIORITY.indexOf(b.id));
    const sev = faults.reduce((s, f) => s + f.weight, 0) * (SECTION_WEIGHT[x.section] || 1);
    return { ...x, order: i, faults: faults.map(f => f.id), why: faults[0]?.why || null, severity: Math.round(sev * 10) / 10 };
  }).filter(x => x.faults.length).sort((a, b) => b.severity - a.severity || a.order - b.order);

  // Reasons: fired gaps by points, then fallbacks, always exactly 3.
  const fired = CV_GAPS.filter(g => g.check(cv)).sort((a, b) => b.points - a.points);
  const pool = [...fired, ...FALLBACK_GAPS].slice(0, 3);
  const reasons = pool.map((g, i) => ({ id: g.id, points: g.points, text: g.reason.replace('{firm}', firm), shown: i < 2 }));

  const edu = cv.lines.filter(x => x.section === 'education').map(x => x.text).join(' ') || cv.text.slice(0, 300);
  return {
    reasons,                                   // [#1, #2 shown] [#3 hidden: "the one most students miss"]
    flaggedLines: flagged.slice(0, 3),         // the 3 lines (free full assessment)
    moreFlagged: Math.max(0, flagged.length - 3),
    course: { type: courseType(edu), note: COURSE_NOTES[courseType(edu)], grade: gradeNote(edu) },
  };
}
