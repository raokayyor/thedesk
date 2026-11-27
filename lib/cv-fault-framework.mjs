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
  dutyStart: /^(responsible for|helped|assisted|supported|did|involved in|duties included|tasks included|in charge of)\b/i,
  exposure: /^(shadowed|observed|attended|sat in on|watched|learnt about|learned about)\b/i,
  number: /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand)\b/i,
  outcome: /\b(so that|which (led|meant|helped|allowed|cut|saved|increased|reduced)|resulting|result(ed)? in|increas|reduc|sav(ed|ing)|cut|grew|growth|won|delivered|improv|raised|launched|achiev|led to|meaning|so the|used (by|in|to)|adopted|selected|approved|recommend|because|flagged|identified|matched|chosen|went to|ranked|placed|top \d|first of|won|awarded|adjusted|corrected|fixed|resolved|accepted|revised|shortlisted|narrowed)/i,
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
    reason: 'Your internship reads like a list of chores. Nothing shows you achieved anything.', headline: true },
  { id: 'no_relevant_experience', points: 12,
    check: cv => cv.internshipLines.length === 0 && !has(cv, /\b(bank|investment|finance|financial|accountan|audit|asset|fund|capital|trading|valuation|equity|M&A|deal)\b/i),
    reason: 'Nothing on your CV shows you could do this job. A screener would move on.', headline: true },
  { id: 'no_quantified_lines', points: 10,
    check: cv => cv.bullets.filter(l => RX.number.test(l)).length === 0,
    reason: 'There isn\'t a single number on your CV. To a screener, that reads as no impact.', headline: true },
  { id: 'no_leadership', points: 9,
    check: cv => !has(cv, /\b(led|lead|leader|captain|president|chair|founded|co-founded|organis|organiz|managed|trained|mentored|coordinat|head of|vice[- ]president|treasurer|secretary|committee)\b/i),
    reason: 'Nothing shows you\'ve ever led or owned anything. Banks hire people who take charge.', headline: true },
  { id: 'no_commercial_awareness', points: 8,
    check: cv => !has(cv, /\b(deal|M&A|merger|acquisition|valuation|DCF|comps|market|portfolio|stock pitch|equity research|trading|fund|investment banking|IPO|bond|rates|FX)\b/i),
    reason: 'Nothing shows you follow markets or deals. You look like you\'re applying blind.', headline: true },
  { id: 'why_finance_missing', points: 7,
    check: cv => !cv.internshipLines.some(l => /\b(finance|valuation|acquisition|deal|investment|EBITDA|model|audit|M&A)\b/i.test(l))
      && !has(cv, /\b(valuation|DCF|spring week|insight (day|week)|investment (club|society)|trading (competition|challenge)|stock pitch|finance society.*(committee|analyst|pitch|led|organis)|case competition|virtual (internship|experience)|bright network|forage)\b/i),
    reason: 'Nothing proves you actually want finance. It reads like one application of many.', headline: true },
  { id: 'skills_as_claims', points: 6,
    check: cv => cv.skillsLines.some(l => RX.softClaim.test(l)) || cv.skillsLines.some(l => /\bexcel\b/i.test(l) && !/(model|pivot|vlookup|xlookup|macro|vba|dcf|lbo|build|built)/i.test(l)),
    reason: 'Your skills section is filler: claims anyone can make, with nothing to back them up.', headline: false },
  { id: 'interests_generic', points: 4,
    check: cv => cv.interestLines.length > 0 && cv.interestLines.every(l => !/\d|(compet|captain|marathon|grade|award|club|team.*(won|league)|published|founded|blog)/i.test(l)),
    reason: 'Your interests say nothing about you, and could start an interview question you can\'t answer.', headline: false },
];
export const FALLBACK_GAPS = [ // used only if fewer than 3 gaps fire (strong CVs)
  { id: 'so_what_layer', points: 5, check: () => true,
    reason: 'Your best work stops halfway: you say what you did, never what it meant.', headline: true },
  { id: 'firm_fit', points: 4, check: () => true,
    reason: 'Nothing ties you to {firm}. It reads like the same CV you sent everywhere.', headline: true },
  { id: 'ordering', points: 3, check: () => true,
    reason: 'Your strongest evidence is buried where a screener won\'t look.', headline: false },
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
  if (/\b(?:predicted|expected|achieved|awarded|classification[: ]*)\s*(?:a\s+)?(?:first|1st)\b|\b(?:first|1st)[ -]class\b/i.test(text)) return 'Predicted First: above the usual minimum for most graduate programmes.';
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
    if (/^(experience|work experience|employment|professional experience|internships?)$/.test(h)) { section = 'experience'; continue; }
    if (/^(education|academic)/.test(h)) { section = 'education'; continue; }
    if (/^(positions|leadership|extra.?curricular|activities|positions of responsibility|projects)/.test(h)) { section = 'positions'; continue; }
    if (/^(skills(?: (?:and )?interests)?|technical skills)$/.test(h)) { section = 'skills'; continue; }
    if (/^(?:technical )?skills(?: and interests)?:\s*.+/i.test(l)) section='skills';
    if (/^interests/.test(h)) { section = 'interests'; }
    const isBullet = /^[-•*·▪–]\s*/.test(l);
    const clean = l.replace(/^[-•*·▪–]\s*/, '').trim();
    const isRoleHeader = !isBullet && section === 'experience' && /\b(20\d\d|intern|assistant|analyst|associate|member)\b/i.test(clean) && /,|\s[—–|]\s/.test(clean);
    if (/^(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b.*\d{4}|(?:19|20)\d{2}(?:\s*[–-].*)?)$/i.test(clean)) continue;
    if(!isBullet&&section==='positions'&&!RX.memberOnly.test(clean)&&/[,—–|].*\b20\d\d\b/.test(clean)){out.currentRole=clean;continue;}
    if (isRoleHeader) { out.currentRole = clean; out.currentIsInternship = /intern|placement|insight|spring/i.test(clean); continue; }
    const sec = section === 'experience' && out.currentIsInternship ? 'internship' : (/^interests?:/i.test(clean) ? 'interests' : section);
    const item = { text: clean, section: sec, role: out.currentRole || null, isBullet }; 
    out.lines.push(item);
    if (isBullet || sec === 'positions' || ['internship','experience'].includes(sec)) out.bullets.push(clean);
    if (sec === 'internship') out.internshipLines.push(clean);
    if (sec === 'skills') out.skillsLines.push(clean);
    if (sec === 'interests') out.interestLines.push(clean);
  }
  return out;
}

// ---------- 6. Run the framework ----------
// Who's doing the screening, by route, so wording never says "banks" to a Big Four applicant.
export const ROUTE_NOUN = { ib: 'banks', markets: 'banks', am: 'asset managers', big4: 'Big Four firms', consulting: 'consultancies', unsure: 'employers' };
export function routeNoun(route = '') {
  const r = route.toLowerCase();
  if (Object.hasOwn(ROUTE_NOUN, r)) return ROUTE_NOUN[r];
  if (/big four|big 4|audit|accountanc/.test(r)) return ROUTE_NOUN.big4;
  if (/asset/.test(r)) return ROUTE_NOUN.am;
  if (/consult/.test(r)) return ROUTE_NOUN.consulting;
  if (/invest|bank|market|trading/.test(r)) return ROUTE_NOUN.ib;
  return ROUTE_NOUN.unsure;
}

export function runFramework(rawCv, { firm = 'the firm', route = '', tests } = {}) {
  const cv = parseCv(rawCv), noun = routeNoun(route);
  const wording = text => text.replace(/\bbanks\b/gi, word => word[0] === 'B' ? noun[0].toUpperCase() + noun.slice(1) : noun);
  // Flagged lines: bullets, positions and skills claims; ranked by weighted severity, then original order.
  const candidates = cv.lines.filter(x => ['internship','experience','positions','skills'].includes(x.section)
    && !/^(sep|jan|feb|mar|apr|may|jun|jul|aug|oct|nov|dec)\b/i.test(x.text)
    && !(x.section === 'positions' && /,\s*(19|20)\d\d\s*[–-]\s*((19|20)\d\d|present)\s*$/i.test(x.text))); // role headers, not claims
  const flagged = candidates.map((x, i) => {
    const allowed = SECTION_FAULTS[x.section];
    const strongLine = RX.number.test(x.text) && RX.outcome.test(x.text);
    const STRONG_EXEMPT = ['duty_not_achievement','weak_verb','no_outcome','no_number','too_short'];
    const ok0 = f => !(strongLine && STRONG_EXEMPT.includes(f.id));
    const ok = f => ok0(f) && (allowed === 'notSkills' ? f.id !== 'skill_claim_no_evidence' : (!allowed || allowed.includes(f.id)));
    const faults = LINE_FAULTS.filter(f => ok(f) && f.test(x.text))
      .sort((a, b) => WHY_PRIORITY.indexOf(a.id) - WHY_PRIORITY.indexOf(b.id));
    const sev = faults.reduce((s, f) => s + f.weight, 0) * (SECTION_WEIGHT[x.section] || 1);
    return { ...x, order: i, faults: faults.map(f => f.id), why: faults[0]?.why ? wording(faults[0].why) : null, severity: Math.round(sev * 10) / 10 };
  }).filter(x => x.faults.length).sort((a, b) => b.severity - a.severity || a.order - b.order);

  // Reasons: fired gaps by points, then fallbacks, always exactly 3.
  const weakTest=testGap(tests,noun);const fired = [...CV_GAPS.filter(g => g.check(cv)),...(weakTest?[weakTest]:[])].sort((a, b) => b.points - a.points);
  const numberWithoutOutcome=flagged.filter(line=>line.faults.includes('no_outcome')&&RX.number.test(line.text));
  const analytical=numberWithoutOutcome.filter(line=>/research|analys|valuat|DCF|model|sensitiv|comparison|screen|budget|events/i.test(line.text));
  const academicAnalysis=flagged.filter(line=>line.faults.includes('no_outcome')&&/DCF|valuat|model|analys/i.test(line.text)&&/university|academic|valuation.*project|dissertation|thesis/i.test(line.role||''));
  const specific=(academicAnalysis.length?academicAnalysis:analytical.length?analytical:numberWithoutOutcome)[0];
  const subjectFor=line=>{
    if(line.faults.includes('membership_only'))return line.text.replace(/^member[, ]*/i,'').trim()+' membership';
    const role=String(line.role||'').replace(/,?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d).*$/i,'').trim();
    const project=role.match(/^(.+?valuation)\b/i)?.[1];if(project)return project;
    const employer=role.split(/[,—–|]/).map(x=>x.trim()).filter(Boolean)[1];
    const task=/research|screen/i.test(line.text)?'company research':/DCF|valuat|sensitiv/i.test(line.text)?'valuation work':/budget|events/i.test(line.text)?'budget and events work':/analys|comparison/i.test(line.text)?'analysis':'work';
    return (employer?employer+' ':'')+task;
  };
  const firmMentioned=firm!=='the firm'&&firm!=='your target firm'&&cv.text.toLowerCase().includes(firm.toLowerCase());
  const relevantArea=/big four|big4|audit|accountanc/i.test(route)?/\b(audit|tax|assurance|accountancy)\b/i:/asset/i.test(route)?/\b(asset management|portfolio management|investment research)\b/i:/consult/i.test(route)?/\b(strategy consulting|management consulting|consulting)\b/i:/bank|invest|^ib$/i.test(route)?/\b(investment banking|corporate finance|M&A|capital markets)\b/i:null;
  const relevance=['internship','experience','positions','skills'];
  const secondary=flagged.filter(line=>line!==specific&&subjectFor(line)!==subjectFor(specific||{text:'',faults:[]})&&(line.faults.includes('no_outcome')||line.faults.includes('membership_only'))).sort((a,b)=>relevance.indexOf(a.section)-relevance.indexOf(b.section)||b.severity-a.severity||a.order-b.order)[0];
  const secondReason=secondary?{id:'second_line_gap',points:4,reason:'Your '+subjectFor(secondary)+(secondary.faults.includes('membership_only')?' doesn’t say what you contributed.':' doesn’t say what happened next.')}:null;
  const fallbacks=FALLBACK_GAPS.filter(g=>g.id!=='firm_fit'||!(firmMentioned||relevantArea?.test(cv.text))).map(g=>g.id==='so_what_layer'&&specific?{...g,reason:'Your best work stops halfway: your '+subjectFor(specific)+' says what you did, never what it meant.'}:g);
  if(secondReason)fallbacks.splice(fallbacks.findIndex(g=>g.id==='so_what_layer')+1,0,secondReason);
  const candidatesPool = [...fired, ...fallbacks, {id:'personal_contribution',points:2,headline:true,reason:'Your strongest result needs a clear explanation of your personal contribution.'}];
  const lead=candidatesPool.find(g=>g.headline);const pool=[lead,...candidatesPool.filter(g=>g!==lead)].slice(0,3);
  const reasons = pool.map((g, i) => ({ id: g.id, headline:g.headline===true, points: g.points, text: wording(g.reason.replace('{firm}', firm)), shown: i < 2 }));

  const edu = cv.lines.filter(x => x.section === 'education').map(x => x.text).join(' ') || cv.text.slice(0, 300);
  const degree=edu.match(/\b(?:BSc|BA|BEng|MEng|MSc|MA|BBA)\s*(?:\(Hons\))?\s+([^,;.\n]+)/i)?.[1]||edu;
  const degreeMatch=edu.match(/\b(BSc|BA|BEng|MEng|MSc|MA|BBA)\s*(?:\(Hons\))?\s+([^,;.\n]+?)(?=\s+[—–|]\s|\s+(?:19|20)\d{2}|[,;.]|\b(?:Predicted|Expected|Modules)\b|$)/i);
  const label=degreeMatch?[degreeMatch[1],degreeMatch[2].trim()].join(' '):'';
  const gradeMatch=edu.match(/\b(Predicted|Expected|Anticipated|Achieved|Awarded)\s*:?\s*(?:a\s+)?(First|1st|2[:.]1|2[:.]2|Upper Second|Lower Second)\b/i);
  const gradeValue=gradeMatch?(/first|1st/i.test(gradeMatch[2])?'First':/upper|2[:.]1/i.test(gradeMatch[2])?'2:1':'2:2'):edu.match(/\b2[:.]([12])\b/)?.[0]?.replace('.',':');
  const gradeLabel=gradeValue?(gradeMatch&&/achieved|awarded/i.test(gradeMatch[1])?'Achieved ':gradeMatch?'Predicted ':'Grade ')+gradeValue:'Grade not stated';
  const SECTION_RANK = ['internship', 'experience', 'positions', 'skills'];
  const teaserLine = [...flagged].sort((a,b) => SECTION_RANK.indexOf(a.section)-SECTION_RANK.indexOf(b.section) || b.severity-a.severity || a.order-b.order)[0] || null;
  return {
    teaserLine, screener: noun, courseTeaser: `there's one thing ${noun} will check`,
    reasons,                                   // [#1, #2 shown] [#3 hidden: "the one most students miss"]
    allFlaggedLines: flagged,
    flaggedLines: flagged.slice(0, 3),         // the 3 lines (free full assessment)
    moreFlagged: Math.max(0, flagged.length - 3),
    course: { label, gradeLabel, type: courseType(degree), note: wording(COURSE_NOTES[courseType(degree)]), grade: gradeNote(edu) },
  };
}

// Gap labels are requests for evidence, never invented improvements or point gains.
export function lineMissingChips(line,validatedDraft){
 if(!line)return [];
 const faults=new Set(line.faults||[]),labels=[];const add=label=>{if(!labels.includes(label))labels.push(label);};
 for(const gap of String(validatedDraft?.line||'').match(/\[[^\]]+\]/g)||[]){
  if(/who|audience|recipient|used/i.test(gap))add('+ who used it');
  if(/what.*(?:show|achiev|chang)|finding|conclusion|outcome|result|impact/i.test(gap))add('+ what it achieved');
  if(/how many|number|scale|volume|amount/i.test(gap)&&faults.has('no_number'))add('+ a number');
  if(/contribution|your.*(?:task|action|role)|you.*did/i.test(gap))add('+ what you did');
 }
 if(faults.has('duty_not_achievement')||faults.has('exposure_not_contribution')||faults.has('weak_verb'))add('+ what you did');
 if(faults.has('membership_only'))add('+ your contribution');
 if(faults.has('soft_claim')||faults.has('skill_claim_no_evidence'))add('+ a real example');
 if(faults.has('no_outcome'))add('+ what it achieved');
 if(faults.has('no_number'))add('+ a number');
 if(faults.has('too_short'))add('+ the task and context');
 if(faults.has('self_undermining'))add('+ your contribution');
 if(labels.length<2&&faults.has('no_outcome'))add('+ why it mattered');
 if(labels.length<2)add('+ evidence behind the claim');
 return labels.slice(0,3);
}

// [RAO] Interest follow-up wording supplied for editorial approval. No score penalty is added by these prompts.
const LEGACY_INTEREST_TRAPS=[
 {id:'markets',match:/\b(investing|markets?|trading)\b/i,question:'What market story are you following?',alternative:'Pitch me a stock.',prep:['Choose a company or market story you genuinely follow.','Explain your view and one risk; use figures you can substantiate.']},
 {id:'writing',match:/\b(blog|newsletter)\b/i,question:'What was your last piece about?',prep:['Re-read your most recent piece and prepare its main point.','Explain why you wrote it and what you learned; do not invent readership or feedback.']},
 {id:'sports',match:/\b(?:football|netball|rugby|cricket|hockey|basketball|sports?)\b.*\bteam\b|\bteam\b.*\b(?:football|netball|rugby|cricket|hockey|basketball|sports?)\b/i,question:'What was your role in the team?',prep:['Describe your actual role in the team.','Prepare one occasion when your own contribution mattered.']},
 {id:'reading',match:/\breading\b/i,question:'What are you reading now, and what did you take from it?',prep:['Name something you are actually reading now.','Explain one idea you took from it and your own view.']},
 {id:'travel',match:/\btravell?ing\b/i,question:'Where, and what did you learn?',prep:['Choose a trip you actually took.','Explain one specific thing you learned, rather than listing destinations.']}
];
export function skillsInterestsCard(raw,unlocked=false){
 const cv=parseCv(raw),flagged=CV_GAPS.filter(g=>['skills_as_claims','interests_generic'].includes(g.id)&&g.check(cv)).map(g=>g.id);
 let softClaim;for(const line of cv.skillsLines){const hit=line.match(RX.softClaim);if(hit){softClaim=line.split(/[,;·]/).find(piece=>piece.toLowerCase().includes(hit[0].toLowerCase()))?.replace(/^skills:\s*/i,'').trim()||hit[0];break;}}
 let trap;for(const line of cv.interestLines){for(const interest of line.replace(/^interests?:\s*/i,'').split(/[,;·]/).map(s=>s.trim().replace(/\.$/,''))){const match=LEGACY_INTEREST_TRAPS.find(t=>t.match.test(interest));if(match){trap={interest,question:match.id==='markets'&&/investing|trading/i.test(interest)?match.alternative:match.question,prep:match.prep};break;}}if(trap)break;}
 if(!flagged.length&&!trap)return null;
 const tool=(cv.skillsLines.join(' ')+' '+cv.lines.filter(l=>['experience','internship','positions'].includes(l.section)).map(l=>l.text).join(' ')).match(/\b(?:Excel|Python|SQL|PowerPoint|VBA)\b/i)?.[0],evidence=cv.lines.find(l=>['experience','internship','positions'].includes(l.section)&&tool&&new RegExp('\\b'+tool+'\\b','i').test(l.text));
 const rewrite=tool?(tool+': '+(evidence?.text||'[Describe a real task you completed with this tool and its result.]')):'[Replace the soft-skill claim with one specific action and result from your experience.]';
 return {flags:flagged,...(softClaim?{softClaim}:{}),...(trap?{interest:trap.interest,question:trap.question}:{}),...(unlocked?{rewrite,prep:trap?.prep||['Choose one real example that supports the skill you have claimed.','Be ready to explain your own action and the result.']}:{})};
}

// ---------- 7. "The sections most students waste": education, skills, interests ----------
// Every row = WHAT IT SAYS (their exact words) -> WHAT'S WRONG (one plain line) -> WHAT TO CHANGE (one concrete instruction,
// naming a fact from their own CV where one exists). Banned words: leverage, showcase, passionate, dynamic, robust, impactful.

const SKILL_WORDS = ['Excel', 'PowerPoint', 'Python', 'SQL', 'MATLAB', 'VBA', 'Bloomberg', 'Tableau'];
const SKILL_USE = { // fallback words that show the skill in use, if the skill isn't named in an experience line
  Excel: /\b(spreadsheet|model|comparison table|reconcil)\b/i,
  PowerPoint: /\b(presented|presentation|slides|pitch(ed)?)\b/i,
  Python: /\b(script|code|automat|clean(ed)? (test )?data)\b/i,
  SQL: /\b(database|quer(y|ies))\b/i,
};
const SOFT = /\b(good communication|communication skills|team player|hard[- ]working|people person|self[- ]motivated|detail[- ]oriented|passionate|motivated|enthusiastic|fast learner|quick learner)\b/gi;
const SKILL_SPECIFIC = /\(([^)]*(dcf|lbo|comps|pivot|vlookup|xlookup|vba|macro|model|pandas)[^)]*)\)/i; // "Excel (DCF, comps)" = backed

// Interest -> the question it invites. Order matters: most specific first. [RAO] approve wording.
export const INTEREST_TRAPS = [
  { rx: /\b(blog|newsletter)\b/i, ask: 'What was your last piece about?', change: 'Be ready to talk through your latest piece in two minutes.' },
  { rx: /\b(investing|investment|stocks?|stock market|trading)\b/i, ask: 'Pitch me a stock.', change: 'Name one company you follow, or cut it.' },
  { rx: /\b(football|rugby|netball|hockey|cricket|basketball)\b/i, ask: 'What was your role in the team?', change: 'Add your role or level (e.g. captain, 1st XI), or cut it.' },
  { rx: /\b(reading|books?)\b/i, ask: 'What are you reading now?', change: 'Name a recent book, or cut it.' },
  { rx: /\b(travel(l)?ing|travel)\b/i, ask: 'Where did you go, and what did you learn?', change: 'Name one trip and what you did there, or cut it.' },
  { rx: /\b(chess)\b/i, ask: "What's your rating?", change: 'Add your rating or a result.' },
];

function shortEmployer(role) {
  if (!role) return null;
  const parts = role.replace(/\([^)]*\)/g, '').split(',').map(s => s.trim()).filter(Boolean);
  return parts[1] || parts[0];
}

export function sectionsCheck(rawCv) {
  const cv = parseCv(rawCv);
  const rows = [];
  // --- Education
  const eduText = cv.lines.filter(x => x.section === 'education').map(x => x.text).join(' ');
  if (eduText && !/module|coursework|project|dissertation|thesis/i.test(eduText)) {
    const course = ((eduText.match(/\b(?:BSc|BA|MEng|BEng|MSci|MA|LLB)\s+([^,.]+)/i) || [])[1] || 'your course').trim();
    rows.push({ kind: 'education', icon: '🎓',
      says: cv.lines.find(x=>x.section==='education').text,
      wrong: 'It names your degree but nothing you did in it.',
      change: `Add your best module and mark in ${course}, and one project you can talk about.` });
  }
  // --- Skills
  const skillsText = cv.skillsLines.join(', ');
  const softHits = [...new Set((skillsText.match(SOFT) || []).map(s => s.toLowerCase()))];
  const expLines = cv.lines.filter(x => ['internship', 'experience', 'positions'].includes(x.section));
  let proof = null;
  for (const sk of SKILL_WORDS) {
    const named = new RegExp(`\\b${sk}\\b`, 'i');
    if (!named.test(skillsText)) continue;
    const hit = expLines.find(x => named.test(x.text)) || (SKILL_USE[sk] && expLines.find(x => SKILL_USE[sk].test(x.text)));
    if (hit) { proof = { skill: sk, line: hit.text, where: shortEmployer(hit.role) || 'your experience' }; break; }
  }
  const bare = !SKILL_SPECIFIC.test(skillsText);
  if (softHits.length || (bare && skillsText)) {
    rows.push({ kind: 'skills', icon: '⚠',
      says: cv.skillsLines[0],
      wrong: softHits.length ? `"${softHits.slice(0, 2).join('", "')}": every applicant writes this.` : 'Just a list of tools. Nothing shows what you did with them.',
      change: proof
        ? `${softHits.length ? 'Cut the adjectives. ' : ''}Show ${proof.skill} with something you did: "${proof.line}" (${proof.where}).`
        : `${softHits.length ? 'Cut the adjectives. ' : ''}Next to each tool, add one thing you did with it.` });
  }
  // --- Interests
  const intText = cv.interestLines.join(', ').replace(/^interests?:\s*/i, '');
  const trap = INTEREST_TRAPS.find(t => t.rx.test(intText));
  if (trap) {
    const word = (intText.match(trap.rx) || [''])[0];
    rows.push({ kind: 'interests', icon: '⚠',
      says: cv.interestLines[0],
      wrong: `You wrote "${word}". They'll ask: "${trap.ask}"`,
      change: trap.change });
  }
  return rows.map(row=>({...row,id:row.kind,rewrite:row.kind==='skills'&&proof?proof.skill+': '+proof.line:row.says+' [Add your verified '+(row.kind==='education'?'module, mark and academic project':'specific detail and answer to the question')+'.]'})).sort((a,b)=>['interests','skills','education'].indexOf(a.kind)-['interests','skills','education'].indexOf(b.kind));
}

// ---------- 8. Test-based reason (input-driven) ----------
// Call with the test totals; returns a gap that competes with CV_GAPS on points.
export function testGap({ numerical = null, commercial = null } = {}, screener = 'banks') {
  if (![numerical,commercial].every(n=>Number.isInteger(n)&&n>=0&&n<=5)) return null;
  const total = numerical + commercial;
  if (total > 4) return null;
  return { id: 'tests_weak', points: Math.min(14, (10 - total) * 2),
    reason: `On these results, you'd struggle to pass the numbers test ${screener} use in the first round.`, headline: true };
}

export function sectionsPreview(raw,{unlocked=false,member=false}={}) {return sectionsCheck(raw).map(({id,says,wrong,change,rewrite},i)=>({id,says,...(unlocked||member||i===0?{wrong}:{}),...(member||unlocked&&i===0?{change}:{}),...(member?{rewrite}:{})}));}
