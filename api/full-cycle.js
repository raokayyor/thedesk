import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    // TWO sequential calls — call 1 is the main report, call 2 is the action plan
    const response1 = await client.messages.create({
      model: MODEL, max_tokens: 4096, temperature: 0.3,
      system: buildSystem(),
      messages: [{ role: "user", content: buildPrompt1(ctx) }]
    });

    const p1 = safeJSON(response1.content[0]?.text || "");

    const response2 = await client.messages.create({
      model: MODEL, max_tokens: 4096, temperature: 0.3,
      system: buildSystem(),
      messages: [{ role: "user", content: buildPrompt2(ctx, planName) }]
    });

    const p2 = safeJSON(response2.content[0]?.text || "");
    const paid = Object.assign({ planName }, p1, p2);

    return res.status(200).json({ success: true, paid });
  } catch (e) {
    console.error("full-cycle error:", e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}

function buildSystem() {
  return `You are a senior finance career practitioner with 20+ years across Goldman Sachs, Barclays, JP Morgan and boutique advisory firms. Rules:
- Never invent deals, clients, outcomes, numbers or responsibilities
- Label uncertain bullets "Use only if accurate"  
- Use safe firm language: "may", "likely", "would typically" — never "will fail" or "will screen out"
- Strong candidates (top uni + relevant finance + strong scores): frame as evidence hierarchy issues, not weak
- Return ONLY valid compact JSON, no markdown, no backticks`;
}

function buildContext(r, cvText, profile, quiz) {
  const firm = profile.targetFirm || r.targetFirm || "your target firm";
  const div  = profile.targetDivision || r.targetDivision || "finance";
  const name = r.candidateName || profile.name || "Candidate";
  const sc   = r.overallScore || 0;
  const band = r.band || "Borderline";
  const namedD = (r.namedCvDetails || []).join(", ");
  const gaps = (r.priorityGaps || []).map((g,i) => `${i+1}. ${g.title}: ${g.visibleRisk||""}`).join("\n");
  const comps = (r.competencies || []).map(c => `${c.name}: ${c.status}`).join(", ");
  const dims = (r.dimensions || []).map(d => `${d.name}: ${Math.round(d.score||0)}`).join(" | ");
  const commScore = quiz.commercialCorrect || quiz.fS || 3;
  const techScore = quiz.technicalCorrect || quiz.nS || 3;
  const tone = sc < 40 ? "REBUILD — honest, not cruel. This is not a polish job. Give a real path."
    : sc < 55 ? "WEAK — fixable but needs significant repair. Do not say submit now."
    : sc < 70 ? "BORDERLINE — usable evidence, needs repair. Do not submit as-is."
    : sc < 85 ? "COMPETITIVE — strong raw material. Issue is framing not evidence. Sharpen before submission."
    : "STRONG — final polish. Focus on evidence hierarchy, firm nuance, interview edge.";

  const header = `CANDIDATE: ${name} | ${profile.university||""} ${profile.course||""} ${profile.grade||""}
TARGET: ${firm} — ${div}
SCORE: ${sc}/100 | ${band} | ${r.archetype||""}
TONE: ${tone}
KILLER: ${r.killerSentence||""}
MISREAD: ${r.beingMisreadAs||""}
NAMED CV: ${namedD}
DIMENSIONS: ${dims}
QUIZ: Commercial ${commScore}/5 | Numerical ${techScore}/5
GAPS:\n${gaps}
COMPETENCIES: ${comps}
CV: ${cvText ? cvText.slice(0, 1500) : "Use named CV details above"}`;

  return { firm, div, name, sc, band, namedD, commScore, techScore, header, planName: "" };
}

function buildPrompt1(ctx) {
  return `${ctx.header}

Return ONLY this JSON (string values must have no line breaks):
{"paidTitle":"Full Cycle — ${ctx.name} | ${ctx.firm} ${ctx.div}","executiveVerdict":{"summary":"[2-3 direct sentences. Ready? Biggest issue? How far from credible?]","readinessVerdict":"[One sentence]","mostImportantFix":"[Single highest-leverage change]","submitAdvice":"[Specific: submit / sharpen first / repair first / rebuild first]"},"targetRouteMeaning":{"isRouteRealistic":"[Realistic now, after repair, or stretch?]","routeGap":"[What makes it a stretch]","whatWouldMakeItCredible":"[Specific evidence needed]","steppingStoneRoute":"[Better short-term route or null]"},"applicationRiskMap":[{"risk":"[title]","severity":"High","whyItMatters":"[Specific to ${ctx.firm} ${ctx.div}]","howToFix":"[Specific fix using their CV]"},{"risk":"[2nd risk]","severity":"High","whyItMatters":"[Why]","howToFix":"[Fix]"},{"risk":"[3rd risk]","severity":"Medium","whyItMatters":"[Why]","howToFix":"[Fix]"}],"evidenceHierarchy":{"leadWith":[{"evidence":"[Named CV item]","whyItLeads":"[Why it should lead for ${ctx.div}]","howToUseIt":"[How to position it]"},{"evidence":"[2nd item]","whyItLeads":"[Why]","howToUseIt":"[How]"}],"supportWith":[{"evidence":"[Item]","whyItSupports":"[Why support not lead]","howToUseIt":"[How]"}],"reduceOrCut":[{"evidence":"[What to reduce]","whyReduce":"[Why]","whatToDoInstead":"[Replace with]"}]},"cvRepairMap":[{"section":"Experience","currentProblem":"[What is wrong]","whatThisSectionNeedsToProve":"[For ${ctx.firm} ${ctx.div}]","repairDirection":"[Specific repair]","exampleDirection":"[Example — label Use only if accurate if unconfirmed]","whatNotToDo":"[Avoid]"},{"section":"Education","currentProblem":"[Problem]","whatThisSectionNeedsToProve":"[What it needs to show]","repairDirection":"[Direction]","exampleDirection":"[Example]","whatNotToDo":"[Avoid]"},{"section":"Societies","currentProblem":"[Problem]","whatThisSectionNeedsToProve":"[What it needs]","repairDirection":"[Direction]","exampleDirection":"[Example]","whatNotToDo":"[Avoid]"}],"bulletRepair":[{"cvItem":"[Most important named item]","currentIssue":"[What is wrong]","strongerAngle":"[What it should prove for ${ctx.div}]","bulletStructure":"context → action → analytical output","exampleBullet":"[Direction — label Use only if accurate]","whyThisWorks":"[Why for ${ctx.firm} ${ctx.div}]"},{"cvItem":"[2nd item]","currentIssue":"[Issue]","strongerAngle":"[Angle]","bulletStructure":"[Structure]","exampleBullet":"[Direction]","whyThisWorks":"[Why]"}]}`;
}

function buildPrompt2(ctx, planName) {
  const commPct = Math.round((ctx.commScore/5)*100);
  const techPct = Math.round((ctx.techScore/5)*100);
  const techNote = techPct>=80?"strong — treat as an asset":techPct>=60?"borderline — target 80% before submission":"likely screen-out risk — rebuild before submitting";

  return `${ctx.header}

Return ONLY this JSON (string values must have no line breaks):
{"routePositioning":{"currentRouteFit":"[How credible is ${ctx.div} at ${ctx.firm}]","routeRisk":"[Main risk]","strongerPositioning":"[How to position more convincingly]","alternativeRoutes":[{"route":"[Alt 1]","fit":"Possible","why":"[Why]"},{"route":"[Alt 2]","fit":"Possible","why":"[Why]"}]},"firmDivisionFit":{"targetFirm":"${ctx.firm}","targetDivision":"${ctx.div}","whatTheFirmWillLike":"[What ${ctx.firm} will respond to]","whatTheFirmWillQuestion":"[What they may probe — use safe language]","howToMakeFitClearer":"[Specific steps]"},"commercialAwarenessPlan":{"currentLevel":"${commPct}% — [what this means]","risk":"[Specific risk at ${ctx.firm} ${ctx.div}]","priorityTopics":["[Topic 1]","[Topic 2]","[Topic 3]"],"tasks":[{"task":"[Specific task]","whyItMatters":"[Why for ${ctx.firm}]","outputToCreate":"[What to produce]"},{"task":"[Task 2]","whyItMatters":"[Why]","outputToCreate":"[Output]"}],"interviewUse":"[How to use in ${ctx.firm} interviews]"},"numericalTechnicalPlan":{"currentLevel":"${techPct}% — ${techNote}","risk":"[Specific risk]","targetLevelBeforeSubmission":"[Target and timeframe]","priorityPracticeAreas":["[Area 1]","[Area 2]","[Area 3]"],"practicePlan":[{"task":"[Task]","whyItMatters":"[Why]","targetOutput":"[Target]"}]},"interviewRiskMap":[{"likelyQuestion":"[Most dangerous question for this profile at ${ctx.firm} ${ctx.div}]","whyThisQuestionExposesRisk":"[Why dangerous]","weakAnswerPattern":"[What weak sounds like]","strongAnswerStructure":"[Strong structure]","candidateEvidenceToUse":"[Their actual CV evidence]"},{"likelyQuestion":"[2nd question]","whyThisQuestionExposesRisk":"[Why]","weakAnswerPattern":"[Weak]","strongAnswerStructure":"[Strong]","candidateEvidenceToUse":"[Evidence]"},{"likelyQuestion":"[3rd question]","whyThisQuestionExposesRisk":"[Why]","weakAnswerPattern":"[Weak]","strongAnswerStructure":"[Strong]","candidateEvidenceToUse":"[Evidence]"}],"competencyRepair":[{"competency":"Analytical","currentStatus":"[Status]","currentEvidence":"[Evidence]","whatIsMissing":"[Missing for ${ctx.firm} ${ctx.div}]","howToStrengthen":"[Direction]","interviewRisk":"[How gap shows in interview]"},{"competency":"Commercial","currentStatus":"[Status]","currentEvidence":"[Evidence]","whatIsMissing":"[Missing]","howToStrengthen":"[Direction]","interviewRisk":"[Risk]"},{"competency":"Leadership","currentStatus":"[Status]","currentEvidence":"[Evidence]","whatIsMissing":"[Missing]","howToStrengthen":"[Direction]","interviewRisk":"[Risk]"}],"sevenDayActionPlan":[{"day":"Day 1","focus":"Evidence audit","tasks":["[Task]","[Task]"],"deliverable":"[What they have]"},{"day":"Day 2","focus":"CV repair","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},{"day":"Day 3","focus":"Technical practice","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},{"day":"Day 4","focus":"Commercial prep","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},{"day":"Day 5","focus":"Route positioning","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},{"day":"Day 6","focus":"Interview prep","tasks":["[Task]","[Task]"],"deliverable":"[Deliverable]"},{"day":"Day 7","focus":"Final check","tasks":["[Task]","[Task]"],"deliverable":"[Submit / wait / rebuild decision]"}],"finalSubmissionChecklist":[{"item":"Lead evidence is route-specific and appears first","statusNeeded":"${ctx.div} evidence leads Experience section","whyItMatters":"Screeners spend under 30 seconds on first pass"},{"item":"${ctx.firm} motivation is specific","statusNeeded":"Why ${ctx.firm} and why ${ctx.div} clear in one sentence","whyItMatters":"Generic motivation is a common rejection trigger"},{"item":"Numerical readiness meets target","statusNeeded":"Above ${ctx.techScore>=4?80:70}% on practice tests","whyItMatters":"Screening risk if below threshold"},{"item":"One commercial story prepared","statusNeeded":"Can discuss a deal, market event or sector view","whyItMatters":"Will be asked within first 10 minutes"},{"item":"Passive evidence reduced","statusNeeded":"No attendance-only bullets","whyItMatters":"Weakens signal-to-noise ratio"},{"item":"Interview risks addressed","statusNeeded":"Prepared for top 3 risk questions","whyItMatters":"Predictable questions should not surprise you"}],"recheckRecommendation":"[When to recheck, what trigger means ready, what score to hit before submitting to ${ctx.firm}]"}`;
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
    for (const c of partial) { if(c==="{")opens++; else if(c==="}") opens--; else if(c==="[")sq++; else if(c==="]")sq--; }
    try { return JSON.parse(partial + "]".repeat(Math.max(0,sq)) + "}".repeat(Math.max(0,opens))); }
    catch(e2) { return {}; }
  }
}
