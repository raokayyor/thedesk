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
    const { result: r, cvText, profile, quiz, part } = req.body || {};
    if (!r || !r.overallScore) return res.status(400).json({ success: false, error: "Missing free MOT result" });

    const ctx = buildContext(r, cvText || "", profile || {}, quiz || {});
    const p = part || "verdict";

    const prompts = {
      verdict:  buildVerdictPrompt(ctx),
      evidence: buildEvidencePrompt(ctx),
      route:    buildRoutePrompt(ctx),
      prep:     buildPrepPrompt(ctx),
      plan:     buildPlanPrompt(ctx)
    };

    const promptText = prompts[p];
    if (!promptText) return res.status(400).json({ success: false, error: "Unknown part: " + p });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1800,
      temperature: 0.25,
      system: `You are a senior finance career practitioner. Be concise. Never invent deals, clients, outcomes or numbers. Label uncertain bullets "Use only if accurate". Use safe firm language ("may", "likely") never "will fail". Return ONLY compact valid JSON, no markdown, no backticks.`,
      messages: [{ role: "user", content: promptText }]
    });

    const data = safeJSON(response.content[0]?.text || "");
    return res.status(200).json({ success: true, part: p, data });
  } catch (e) {
    console.error("full-cycle error:", e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}

function buildContext(r, cvText, profile, quiz) {
  const firm = profile.targetFirm || r.targetFirm || "your target firm";
  const div  = profile.targetDivision || r.targetDivision || "finance";
  const name = r.candidateName || profile.name || "Candidate";
  const sc   = r.overallScore || 0;
  const namedD = (r.namedCvDetails || []).slice(0,4).join(", ");
  const gaps = (r.priorityGaps || []).slice(0,4).map((g,i) => `${i+1}.${g.title}`).join("; ");
  const comps = (r.competencies || []).slice(0,6).map(c => `${c.name}:${c.status}`).join(", ");
  const commScore = quiz.commercialCorrect || quiz.fS || 3;
  const techScore = quiz.technicalCorrect || quiz.nS || 3;
  const tone = sc < 40 ? "REBUILD" : sc < 55 ? "WEAK" : sc < 70 ? "BORDERLINE-REPAIR" : sc < 85 ? "COMPETITIVE-SHARPEN" : "STRONG-POLISH";
  const techPct = Math.round((techScore/5)*100);
  const commPct = Math.round((commScore/5)*100);

  const header = `Candidate:${name}|Uni:${profile.university||""} ${profile.course||""}|Target:${firm}-${div}|Score:${sc}/100 ${r.band||""}|Tone:${tone}|Killer:${r.killerSentence||""}|NamedCV:${namedD}|Gaps:${gaps}|Comps:${comps}|TechScore:${techPct}%|CommScore:${commPct}%|CV:${(cvText||"").slice(0,700)}`;
  return { firm, div, name, sc, commScore, techScore, commPct, techPct, header, planName: sc>=70?"7-Day Sharpening Plan":sc>=55?"7-Day Repair Plan":"7-Day Rebuild Start" };
}

function buildVerdictPrompt(ctx) {
  return `${ctx.header}

Return ONLY this compact JSON (1-2 sentences per field):
{"paidTitle":"Full Cycle — ${ctx.name} | ${ctx.firm} ${ctx.div}",
"executiveVerdict":{"summary":"[2 sentences]","readinessVerdict":"[1 sentence]","mostImportantFix":"[1 sentence]","submitAdvice":"[1 sentence]"},
"targetRouteMeaning":{"isRouteRealistic":"[1 sentence]","routeGap":"[1 sentence]","whatWouldMakeItCredible":"[1 sentence]","steppingStoneRoute":"[or null]"},
"applicationRiskMap":[{"risk":"[title]","severity":"High","whyItMatters":"[1 sentence]","howToFix":"[1 sentence]"},{"risk":"[2nd]","severity":"High","whyItMatters":"[1 sentence]","howToFix":"[1 sentence]"},{"risk":"[3rd]","severity":"Medium","whyItMatters":"[1 sentence]","howToFix":"[1 sentence]"}]}`;
}

function buildEvidencePrompt(ctx) {
  return `${ctx.header}

Return ONLY this compact JSON (1-2 sentences per field):
{"evidenceHierarchy":{"leadWith":[{"evidence":"[item]","whyItLeads":"[1 sentence]","howToUseIt":"[1 sentence]"},{"evidence":"[2nd]","whyItLeads":"[1 sentence]","howToUseIt":"[1 sentence]"}],"supportWith":[{"evidence":"[item]","whyItSupports":"[1 sentence]","howToUseIt":"[1 sentence]"}],"reduceOrCut":[{"evidence":"[item]","whyReduce":"[1 sentence]","whatToDoInstead":"[1 sentence]"}]},
"cvRepairMap":[{"section":"Experience","currentProblem":"[1 sentence]","whatThisSectionNeedsToProve":"[1 sentence]","repairDirection":"[1 sentence]","exampleDirection":"[1 sentence]","whatNotToDo":"[1 sentence]"},{"section":"Education","currentProblem":"[1 sentence]","whatThisSectionNeedsToProve":"[1 sentence]","repairDirection":"[1 sentence]","exampleDirection":"[1 sentence]","whatNotToDo":"[1 sentence]"}],
"bulletRepair":[{"cvItem":"[item]","currentIssue":"[1 sentence]","strongerAngle":"[1 sentence]","bulletStructure":"context→action→output","exampleBullet":"[1 sentence]","whyThisWorks":"[1 sentence]"},{"cvItem":"[2nd]","currentIssue":"[1 sentence]","strongerAngle":"[1 sentence]","bulletStructure":"context→action→output","exampleBullet":"[1 sentence]","whyThisWorks":"[1 sentence]"}]}`;
}

function buildRoutePrompt(ctx) {
  return `${ctx.header}

Return ONLY this compact JSON (1-2 sentences per field):
{"routePositioning":{"currentRouteFit":"[1 sentence]","routeRisk":"[1 sentence]","strongerPositioning":"[1 sentence]","alternativeRoutes":[{"route":"[alt]","fit":"Possible","why":"[1 sentence]"}]},
"firmDivisionFit":{"targetFirm":"${ctx.firm}","targetDivision":"${ctx.div}","whatTheFirmWillLike":"[1 sentence]","whatTheFirmWillQuestion":"[1 sentence]","howToMakeFitClearer":"[1 sentence]"},
"competencyRepair":[{"competency":"Analytical","currentStatus":"[status]","currentEvidence":"[1 sentence]","whatIsMissing":"[1 sentence]","howToStrengthen":"[1 sentence]","interviewRisk":"[1 sentence]"},{"competency":"Commercial","currentStatus":"[status]","currentEvidence":"[1 sentence]","whatIsMissing":"[1 sentence]","howToStrengthen":"[1 sentence]","interviewRisk":"[1 sentence]"},{"competency":"Leadership","currentStatus":"[status]","currentEvidence":"[1 sentence]","whatIsMissing":"[1 sentence]","howToStrengthen":"[1 sentence]","interviewRisk":"[1 sentence]"}]}`;
}

function buildPrepPrompt(ctx) {
  return `${ctx.header}

Return ONLY this compact JSON (1-2 sentences per field):
{"commercialAwarenessPlan":{"currentLevel":"${ctx.commPct}%","risk":"[1 sentence]","priorityTopics":["[t1]","[t2]","[t3]"],"tasks":[{"task":"[task]","whyItMatters":"[1 sentence]","outputToCreate":"[1 sentence]"}],"interviewUse":"[1 sentence]"},
"numericalTechnicalPlan":{"currentLevel":"${ctx.techPct}%","risk":"[1 sentence]","targetLevelBeforeSubmission":"[1 sentence]","priorityPracticeAreas":["[a1]","[a2]","[a3]"],"practicePlan":[{"task":"[task]","whyItMatters":"[1 sentence]","targetOutput":"[1 sentence]"}]},
"interviewRiskMap":[{"likelyQuestion":"[q]","whyThisQuestionExposesRisk":"[1 sentence]","weakAnswerPattern":"[1 sentence]","strongAnswerStructure":"[1 sentence]","candidateEvidenceToUse":"[1 sentence]"},{"likelyQuestion":"[q2]","whyThisQuestionExposesRisk":"[1 sentence]","weakAnswerPattern":"[1 sentence]","strongAnswerStructure":"[1 sentence]","candidateEvidenceToUse":"[1 sentence]"},{"likelyQuestion":"[q3]","whyThisQuestionExposesRisk":"[1 sentence]","weakAnswerPattern":"[1 sentence]","strongAnswerStructure":"[1 sentence]","candidateEvidenceToUse":"[1 sentence]"}]}`;
}

function buildPlanPrompt(ctx) {
  return `${ctx.header}

Return ONLY this compact JSON (1 sentence per field):
{"sevenDayActionPlan":[{"day":"Day 1","focus":"Evidence audit","tasks":["[t1]","[t2]"],"deliverable":"[1 sentence]"},{"day":"Day 2","focus":"CV repair","tasks":["[t1]","[t2]"],"deliverable":"[1 sentence]"},{"day":"Day 3","focus":"Technical practice","tasks":["[t1]","[t2]"],"deliverable":"[1 sentence]"},{"day":"Day 4","focus":"Commercial prep","tasks":["[t1]","[t2]"],"deliverable":"[1 sentence]"},{"day":"Day 5","focus":"Route positioning","tasks":["[t1]","[t2]"],"deliverable":"[1 sentence]"},{"day":"Day 6","focus":"Interview prep","tasks":["[t1]","[t2]"],"deliverable":"[1 sentence]"},{"day":"Day 7","focus":"Final check","tasks":["[t1]","[t2]"],"deliverable":"[1 sentence]"}],
"finalSubmissionChecklist":[{"item":"Lead evidence is route-specific","statusNeeded":"[1 sentence]","whyItMatters":"[1 sentence]"},{"item":"Firm motivation specific","statusNeeded":"[1 sentence]","whyItMatters":"[1 sentence]"},{"item":"Numerical readiness meets target","statusNeeded":"[1 sentence]","whyItMatters":"[1 sentence]"},{"item":"Commercial story ready","statusNeeded":"[1 sentence]","whyItMatters":"[1 sentence]"}],
"recheckRecommendation":"[1-2 sentences]"}`;
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
