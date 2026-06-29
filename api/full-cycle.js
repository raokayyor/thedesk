import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a senior finance career practitioner with 20+ years across Goldman Sachs, Barclays, JP Morgan and boutique advisory firms. You have hired, screened and interviewed hundreds of students. You give direct, honest, specific advice. Core rules:
- Never invent deal names, client names, outcomes, scores, responsibilities or roles
- If suggesting a bullet that depends on unconfirmed content, label it "Use only if accurate"
- If evidence is missing, say "This cannot be fixed by wording alone — evidence needs to be built first"
- For weak candidates: honest, not cruel. The value is showing the fastest route to a credible application
- For strong candidates: do not force strengths into gaps. Create gaps around thesis framing, route specificity, interview edge
- Return ONLY valid compact JSON — no markdown, no backticks, no comments`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { result: r, cvText, profile, quiz } = req.body || {};
    if (!r || !r.overallScore) return res.status(400).json({ success: false, error: "Missing free MOT result" });

    const ctx = buildContext(r, cvText || "", profile || {}, quiz || {});
    const planName = ctx.sc >= 70 ? "7-Day Sharpening Plan" : ctx.sc >= 55 ? "7-Day Repair Plan" : "7-Day Rebuild Start";

    const [r1, r2] = await Promise.allSettled([
      client.messages.create({
        model: MODEL, max_tokens: 4096, temperature: 0.3, system: SYSTEM,
        messages: [{ role: "user", content: buildPrompt1(ctx) }]
      }),
      client.messages.create({
        model: MODEL, max_tokens: 4096, temperature: 0.3, system: SYSTEM,
        messages: [{ role: "user", content: buildPrompt2(ctx, planName) }]
      })
    ]);

    const p1 = r1.status === "fulfilled" ? safeJSON(r1.value.content[0]?.text || "") : {};
    const p2 = r2.status === "fulfilled" ? safeJSON(r2.value.content[0]?.text || "") : {};
    const paid = Object.assign({ planName }, p1, p2);

    return res.status(200).json({ success: true, paid });
  } catch (e) {
    console.error("full-cycle error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

function buildContext(r, cvText, profile, quiz) {
  const firm = profile.targetFirm || r.targetFirm || "your target firm";
  const div  = profile.targetDivision || r.targetDivision || "finance";
  const name = r.candidateName || profile.name || "Candidate";
  const sc   = r.overallScore || 0;
  const band = r.band || "Borderline";
  const namedDetails = (r.namedCvDetails || []).join(", ");
  const gaps = (r.priorityGaps || []).map((g,i) => `${i+1}. ${g.title}: ${g.visibleRisk||""}`).join("\n");
  const comps = (r.competencies || []).map(c => `${c.name}: ${c.status} — ${c.visibleReason||""}`).join("\n");
  const dims = (r.dimensions || []).map(d => `${d.name}: ${Math.round(d.score)}`).join(" | ");
  const commScore = quiz.commercialCorrect || quiz.fS || 3;
  const techScore = quiz.technicalCorrect || quiz.nS || 3;

  const header = `CANDIDATE: ${name} | ${profile.university||""} | ${profile.course||""} | ${profile.grade||""}
TARGET: ${firm} — ${div}
SCORE: ${sc}/100 | ${band} | ${r.archetype||""}
KILLER: ${r.killerSentence||""}
MISREAD AS: ${r.beingMisreadAs||""}
UNCOMFORTABLE TRUTH: ${r.uncomfortableTruth||""}
NAMED CV EVIDENCE: ${namedDetails}
DIMENSIONS: ${dims}
QUIZ: Commercial ${commScore}/5 | Numerical ${techScore}/5
GAPS:\n${gaps}
COMPETENCIES:\n${comps}
FREE DIAGNOSTIC: ${r.diagnostic||""}
CV TEXT: ${cvText ? cvText.slice(0, 1800) : "Use named CV details above"}`;

  return { firm, div, name, sc, band, namedDetails, commScore, techScore, header, planName: "" };
}

function buildPrompt1(ctx) {
  const isWeak = ctx.sc < 55;
  const toneNote = isWeak
    ? "TONE: Honest but constructive. Do not pretend they can submit tomorrow. Include: The value of Full Cycle here is not polishing this version — it is showing the fastest route from weak evidence to a credible first application."
    : ctx.sc >= 70
    ? "TONE: Emphasise sharpening. Not a weak profile — the issue is the strongest evidence is not yet saying the right thing quickly enough."
    : "TONE: Emphasise repair. Fixable borderline — application will underperform unless lead evidence, technical readiness and commercial story are repaired.";

  return `${ctx.header}

${toneNote}

Generate ONLY this JSON (no line breaks inside string values):
{
"paidTitle":"Full Cycle Repair Plan — ${ctx.name} | ${ctx.firm} ${ctx.div}",
"executiveVerdict":{"summary":"[2-3 direct sentences. Is this ready? What is the biggest issue? How far away from credible?]","readinessVerdict":"[One sentence — ready / wait / rebuild]","mostImportantFix":"[The single highest-leverage change]","submitAdvice":"[Submit now, wait N weeks/months, or rebuild first — be specific and honest]"},
"targetRouteMeaning":{"isRouteRealistic":"[Is ${ctx.div} at ${ctx.firm} realistic NOW or only after repair?]","routeGap":"[What evidence gap makes it a stretch]","whatWouldMakeItCredible":"[Specific evidence that would make the route credible]","steppingStoneRoute":"[Better short-term route if target is unrealistic — or null if credible]"},
"applicationRiskMap":[
{"risk":"[Risk 1 — most likely failure point]","severity":"High","whyItMatters":"[Specific to ${ctx.firm} ${ctx.div} — what happens at this stage]","howToFix":"[Specific fix using their actual CV evidence or what to build]"},
{"risk":"[Risk 2]","severity":"High","whyItMatters":"[Why]","howToFix":"[Fix]"},
{"risk":"[Risk 3]","severity":"Medium","whyItMatters":"[Why]","howToFix":"[Fix]"},
{"risk":"[Risk 4 if relevant]","severity":"Medium","whyItMatters":"[Why]","howToFix":"[Fix]"}
],
"evidenceHierarchy":{
"leadWith":[{"evidence":"[Named CV item — use actual evidence]","whyItLeads":"[Why this should lead for ${ctx.div}]","howToUseIt":"[How to position it — what it should prove]"},{"evidence":"[2nd item if applicable]","whyItLeads":"[Why]","howToUseIt":"[How]"}],
"supportWith":[{"evidence":"[Supporting evidence]","whyItSupports":"[Why support not lead]","howToUseIt":"[How to use without overclaiming]"}],
"reduceOrCut":[{"evidence":"[What to reduce]","whyReduce":"[Why it weakens the application]","whatToDoInstead":"[What to replace it with]"}]
},
"cvRepairMap":[
{"section":"Experience","currentProblem":"[What is wrong with the experience section]","whatThisSectionNeedsToProve":"[For ${ctx.firm} ${ctx.div} this section must show...]","repairDirection":"[Specific repair — be explicit, this is paid content]","exampleDirection":"[Direction example — label as Use only if accurate if unconfirmed]","whatNotToDo":"[Common mistake to avoid]"},
{"section":"Education","currentProblem":"[Problem]","whatThisSectionNeedsToProve":"[What it needs to prove]","repairDirection":"[Direction]","exampleDirection":"[Example]","whatNotToDo":"[Avoid]"},
{"section":"Societies and Activities","currentProblem":"[Problem]","whatThisSectionNeedsToProve":"[What it needs to prove]","repairDirection":"[Direction]","exampleDirection":"[Example]","whatNotToDo":"[Avoid]"}
],
"bulletRepair":[
{"cvItem":"[Most important named CV item]","currentIssue":"[What the current bullet does wrong]","strongerAngle":"[What the bullet should prove for ${ctx.div}]","bulletStructure":"[e.g. context → action → analytical output]","exampleBullet":"[Stronger direction — label Use only if accurate if relies on unconfirmed detail]","whyThisWorks":"[Why this version lands better for ${ctx.firm} ${ctx.div}]"},
{"cvItem":"[2nd most important item]","currentIssue":"[Issue]","strongerAngle":"[Angle]","bulletStructure":"[Structure]","exampleBullet":"[Direction]","whyThisWorks":"[Why]"}
]
}`;
}

function buildPrompt2(ctx, planName) {
  const commPct = Math.round((ctx.commScore/5)*100);
  const techPct = Math.round((ctx.techScore/5)*100);
  const techAdvice = techPct >= 80 ? "strong — treat as an asset, do not force into a gap" : techPct >= 60 ? "borderline — target 80%+ before submission" : "screen-out risk — do not submit until above 70%";

  return `${ctx.header}

Generate ONLY this JSON (no line breaks inside string values):
{
"routePositioning":{"currentRouteFit":"[How credible is ${ctx.div} at ${ctx.firm} for this profile]","routeRisk":"[Main route risk]","strongerPositioning":"[How to position more convincingly]","alternativeRoutes":[{"route":"[Alt route 1]","fit":"Possible","why":"[Why this fits]"},{"route":"[Alt route 2]","fit":"Possible","why":"[Why]"}]},
"firmDivisionFit":{"targetFirm":"${ctx.firm}","targetDivision":"${ctx.div}","whatTheFirmWillLike":"[What ${ctx.firm} ${ctx.div} will respond positively to in this profile]","whatTheFirmWillQuestion":"[What they will probe or question]","howToMakeFitClearer":"[Specific to ${ctx.firm} ${ctx.div} — use safe language, do not fabricate internal criteria]"},
"commercialAwarenessPlan":{"currentLevel":"${commPct}% — [what this means for ${ctx.div} readiness]","risk":"[Specific commercial risk at ${ctx.firm} ${ctx.div} interview stage]","priorityTopics":["[Topic 1 relevant to ${ctx.div} at ${ctx.firm}]","[Topic 2]","[Topic 3]"],"tasks":[{"task":"[Specific task — not just read the FT]","whyItMatters":"[Why this for ${ctx.firm} ${ctx.div}]","outputToCreate":"[What to produce]"},{"task":"[Task 2]","whyItMatters":"[Why]","outputToCreate":"[Output]"},{"task":"[Task 3]","whyItMatters":"[Why]","outputToCreate":"[Output]"}],"interviewUse":"[How to deploy commercial prep in actual ${ctx.firm} interviews]"},
"numericalTechnicalPlan":{"currentLevel":"${techPct}% — ${techAdvice}","risk":"[Specific technical risk at ${ctx.firm} ${ctx.div}]","targetLevelBeforeSubmission":"[Target % and honest timeframe]","priorityPracticeAreas":["[Practice area 1 specific to ${ctx.div}]","[Area 2]","[Area 3]"],"practicePlan":[{"task":"[Specific practice task]","whyItMatters":"[Why this type for ${ctx.firm}]","targetOutput":"[Measurable improvement target]"}]},
"interviewRiskMap":[
{"likelyQuestion":"[Most dangerous question for this exact profile at ${ctx.firm} ${ctx.div}]","whyThisQuestionExposesRisk":"[Why it is dangerous for this specific candidate]","weakAnswerPattern":"[What a weak answer sounds like from this profile]","strongAnswerStructure":"[Structure for a strong answer]","candidateEvidenceToUse":"[Which actual CV evidence to anchor]"},
{"likelyQuestion":"[2nd question]","whyThisQuestionExposesRisk":"[Why]","weakAnswerPattern":"[Weak]","strongAnswerStructure":"[Strong]","candidateEvidenceToUse":"[Evidence]"},
{"likelyQuestion":"[3rd question]","whyThisQuestionExposesRisk":"[Why]","weakAnswerPattern":"[Weak]","strongAnswerStructure":"[Strong]","candidateEvidenceToUse":"[Evidence]"},
{"likelyQuestion":"[4th question]","whyThisQuestionExposesRisk":"[Why]","weakAnswerPattern":"[Weak]","strongAnswerStructure":"[Strong]","candidateEvidenceToUse":"[Evidence]"}
],
"competencyRepair":[
{"competency":"Analytical","currentStatus":"[From free result]","currentEvidence":"[What exists — use named details]","whatIsMissing":"[What would make it application-grade for ${ctx.firm} ${ctx.div}]","howToStrengthen":"[Specific direction]","interviewRisk":"[How this gap shows up in interview]","shouldItLead":"[Lead / Support — explain]"},
{"competency":"Commercial","currentStatus":"[Status]","currentEvidence":"[Evidence]","whatIsMissing":"[Missing]","howToStrengthen":"[Direction]","interviewRisk":"[Risk]","shouldItLead":"[Lead/Support]"},
{"competency":"Communication","currentStatus":"[Status]","currentEvidence":"[Evidence]","whatIsMissing":"[Missing]","howToStrengthen":"[Direction]","interviewRisk":"[Risk]","shouldItLead":"[Lead/Support]"},
{"competency":"Leadership","currentStatus":"[Status]","currentEvidence":"[Evidence]","whatIsMissing":"[Missing]","howToStrengthen":"[Direction]","interviewRisk":"[Risk]","shouldItLead":"[Lead/Support]"},
{"competency":"Resilience","currentStatus":"[Status]","currentEvidence":"[Evidence]","whatIsMissing":"[Missing]","howToStrengthen":"[Direction]","interviewRisk":"[Risk]","shouldItLead":"[Lead/Support]"}
],
"sevenDayActionPlan":[
{"day":"Day 1","focus":"Evidence audit and hierarchy","tasks":["[Specific task 1]","[Specific task 2]"],"deliverable":"[What they have at end of day]"},
{"day":"Day 2","focus":"CV and bullet repair","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},
{"day":"Day 3","focus":"Technical readiness","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},
{"day":"Day 4","focus":"Commercial awareness","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},
{"day":"Day 5","focus":"Route and firm positioning","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},
{"day":"Day 6","focus":"Interview preparation","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},
{"day":"Day 7","focus":"Final check and submission decision","tasks":["[Task]","[Task]"],"deliverable":"[Apply / wait / rebuild decision with reason]"}
],
"finalSubmissionChecklist":[
{"item":"Lead evidence is route-specific and appears in first-screen position","statusNeeded":"Lead bullet references named ${ctx.div} evidence","whyItMatters":"A screener spends under 30 seconds on first pass"},
{"item":"${ctx.firm} motivation is specific","statusNeeded":"Why ${ctx.firm} and why ${ctx.div} is clear in one sentence","whyItMatters":"Generic motivation answers are a common rejection trigger"},
{"item":"Numerical readiness meets target","statusNeeded":"Above ${ctx.techScore >= 4 ? '80' : '70'}% on practice tests","whyItMatters":"Screen-out risk at ${ctx.firm} if below threshold"},
{"item":"One commercial story ready","statusNeeded":"Can discuss a deal, market event or sector view coherently","whyItMatters":"${ctx.firm} ${ctx.div} interviewers will ask within first 10 minutes"},
{"item":"Passive evidence reduced or removed","statusNeeded":"No attendance-only bullets, no unrelated shadowing without purpose","whyItMatters":"Weakens the signal-to-noise ratio of the application"},
{"item":"Interview risks addressed","statusNeeded":"Prepared answers for top 3 likely risk questions","whyItMatters":"Unprepared answers to predictable questions is avoidable"},
{"item":"Application is honest and accurate","statusNeeded":"No overclaimed responsibilities or invented outcomes","whyItMatters":"${ctx.firm} background screening and interview will test specific claims"}
],
"recheckRecommendation":"[Specific recommendation: when to recheck, what trigger means the application is ready, and what retest score to aim for before submitting to ${ctx.firm}]"
}`;
}

function safeJSON(raw) {
  const first = raw.indexOf("{");
  if (first < 0) return {};
  const last = raw.lastIndexOf("}");
  try { return JSON.parse(raw.slice(first, last + 1)); }
  catch(e) {
    let partial = raw.slice(first)
      .replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, "")
      .replace(/,\s*"[^"]*"\s*:\s*\[$/, "")
      .replace(/,\s*"[^"]*"\s*:\s*$/, "");
    let opens = 0, sq = 0;
    for (let c of partial) { if(c==="{") opens++; else if(c==="}") opens--; else if(c==="[") sq++; else if(c==="]") sq--; }
    const close = "]".repeat(Math.max(0,sq)) + "}".repeat(Math.max(0,opens));
    try { return JSON.parse(partial + close); }
    catch(e2) { console.error("JSON recovery failed:", e2.message); return {}; }
  }
}
