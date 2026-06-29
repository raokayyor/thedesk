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
    const { result: freeResult, cvText, profile, quiz } = req.body || {};
    if (!freeResult || !freeResult.overallScore) {
      return res.status(400).json({ success: false, error: "Missing free MOT result" });
    }

    const ctx = buildContext(freeResult, cvText || "", profile || {}, quiz || {});

    const SYSTEM = `You are a senior finance career practitioner with 20+ years at Goldman Sachs, Barclays and JP Morgan. You give direct, honest, specific advice. Never invent CV evidence. Work from what the candidate has actually done. Return ONLY valid compact JSON — no markdown, no comments.`;

    // CALL 1 — diagnosis and evidence
    const p1 = `${ctx.header}

Generate ONLY this JSON (compact, no line breaks inside strings):
{
"paidTitle":"Full Cycle Repair Plan — ${ctx.name} | ${ctx.firm} ${ctx.div}",
"executiveVerdict":{"summary":"[2-3 direct sentences. Is this ready? What is the core issue?]","readinessVerdict":"[One sentence]","mostImportantFix":"[One sentence — highest leverage change]","submitAdvice":"[Submit now / wait / rebuild first — be specific]"},
"applicationRiskMap":[{"risk":"[title]","severity":"High","whyItMatters":"[specific to ${ctx.firm} ${ctx.div}]","howToFix":"[specific direction using their CV]"},{"risk":"[title]","severity":"High","whyItMatters":"[2nd risk]","howToFix":"[fix]"},{"risk":"[title]","severity":"Medium","whyItMatters":"[3rd risk]","howToFix":"[fix]"}],
"evidenceHierarchy":{"leadWith":[{"evidence":"[named CV item]","whyItLeads":"[why]","howToUseIt":"[how]"},{"evidence":"[2nd item]","whyItLeads":"[why]","howToUseIt":"[how]"}],"supportWith":[{"evidence":"[item]","whyItSupports":"[why]","howToUseIt":"[how]"}],"reduceOrCut":[{"evidence":"[what to cut]","whyReduce":"[why]","whatToDoInstead":"[instead]"}]},
"cvRepairMap":[{"section":"Experience","currentProblem":"[what is wrong]","whatThisSectionNeedsToProve":"[what ${ctx.firm} ${ctx.div} needs to see]","repairDirection":"[specific direction]","exampleDirection":"[example direction — no invented facts]","whatNotToDo":"[avoid]"},{"section":"Education","currentProblem":"[problem]","whatThisSectionNeedsToProve":"[what it needs to prove]","repairDirection":"[direction]","exampleDirection":"[example]","whatNotToDo":"[avoid]"},{"section":"Societies/Activities","currentProblem":"[problem]","whatThisSectionNeedsToProve":"[what it needs to prove]","repairDirection":"[direction]","exampleDirection":"[example]","whatNotToDo":"[avoid]"}],
"bulletRepair":[{"cvItem":"[most important named CV item]","currentIssue":"[what is wrong with current bullet]","strongerAngle":"[what it should prove]","bulletStructure":"context → action → analytical output","exampleBullet":"[stronger direction grounded in real evidence]","whyThisWorks":"[why this lands better for ${ctx.firm} ${ctx.div}]"},{"cvItem":"[2nd CV item]","currentIssue":"[issue]","strongerAngle":"[angle]","bulletStructure":"[structure]","exampleBullet":"[direction]","whyThisWorks":"[why]"}]
}`;

    const r1 = await client.messages.create({
      model: MODEL, max_tokens: 4000, temperature: 0.3,
      system: SYSTEM, messages: [{ role: "user", content: p1 }]
    });

    // CALL 2 — plan sections
    const p2 = `${ctx.header}

Generate ONLY this JSON (compact, no line breaks inside strings):
{
"routePositioning":{"currentRouteFit":"[how credible is ${ctx.div} at ${ctx.firm} for this profile]","routeRisk":"[main risk]","strongerPositioning":"[how to position more convincingly]","alternativeRoutes":[{"route":"[alt route]","fit":"Possible","why":"[why fits]"}]},
"firmDivisionFit":{"targetFirm":"${ctx.firm}","targetDivision":"${ctx.div}","whatTheFirmWillLike":"[what ${ctx.firm} will respond to]","whatTheFirmWillQuestion":"[what they will probe]","howToMakeFitClearer":"[specific to ${ctx.firm} ${ctx.div}]"},
"commercialAwarenessPlan":{"currentLevel":"[${ctx.commScore}/5 — what this means]","risk":"[specific risk at ${ctx.firm} ${ctx.div}]","priorityTopics":["[topic 1]","[topic 2]","[topic 3]"],"tasks":[{"task":"[specific task not just read FT]","whyItMatters":"[why for ${ctx.firm} ${ctx.div}]","outputToCreate":"[what to produce]"},{"task":"[task 2]","whyItMatters":"[why]","outputToCreate":"[output]"}],"interviewUse":"[how to use in interviews]"},
"numericalTechnicalPlan":{"currentLevel":"[${ctx.techScore}/5 — what this means]","risk":"[specific risk]","targetLevelBeforeSubmission":"[target and timeframe]","priorityPracticeAreas":["[area 1]","[area 2]","[area 3]"],"practicePlan":[{"task":"[specific task]","whyItMatters":"[why for ${ctx.firm}]","targetOutput":"[improvement target]"}]},
"interviewRiskMap":[{"likelyQuestion":"[most dangerous question for this profile]","whyThisQuestionExposesRisk":"[why it is risky]","weakAnswerPattern":"[what weak sounds like]","strongAnswerStructure":"[strong answer structure]","candidateEvidenceToUse":"[their actual CV evidence to anchor]"},{"likelyQuestion":"[2nd question]","whyThisQuestionExposesRisk":"[why]","weakAnswerPattern":"[weak]","strongAnswerStructure":"[strong]","candidateEvidenceToUse":"[evidence]"},{"likelyQuestion":"[3rd question]","whyThisQuestionExposesRisk":"[why]","weakAnswerPattern":"[weak]","strongAnswerStructure":"[strong]","candidateEvidenceToUse":"[evidence]"}],
"competencyRepair":[{"competency":"Analytical","currentStatus":"[from free result]","currentEvidence":"[what exists]","whatIsMissing":"[what would make it application-grade]","howToStrengthen":"[specific direction]","interviewRisk":"[how gap shows up in interview]"},{"competency":"Commercial","currentStatus":"[status]","currentEvidence":"[evidence]","whatIsMissing":"[missing]","howToStrengthen":"[direction]","interviewRisk":"[risk]"},{"competency":"Leadership","currentStatus":"[status]","currentEvidence":"[evidence]","whatIsMissing":"[missing]","howToStrengthen":"[direction]","interviewRisk":"[risk]"}],
"sevenDayActionPlan":[{"day":"Day 1","focus":"Evidence & CV","tasks":["[task 1]","[task 2]"],"deliverable":"[what they have at end of day]"},{"day":"Day 2","focus":"Bullet repair","tasks":["[task]","[task]"],"deliverable":"[deliverable]"},{"day":"Day 3","focus":"Technical readiness","tasks":["[task]","[task]"],"deliverable":"[deliverable]"},{"day":"Day 4","focus":"Commercial awareness","tasks":["[task]","[task]"],"deliverable":"[deliverable]"},{"day":"Day 5","focus":"Route & firm positioning","tasks":["[task]","[task]"],"deliverable":"[deliverable]"},{"day":"Day 6","focus":"Interview preparation","tasks":["[task]","[task]"],"deliverable":"[deliverable]"},{"day":"Day 7","focus":"Final check","tasks":["[task]","[task]"],"deliverable":"[submit or hold decision]"}],
"finalSubmissionChecklist":[{"item":"[checklist item]","statusNeeded":"[done = this]","whyItMatters":"[why for ${ctx.firm}]"},{"item":"[item 2]","statusNeeded":"[done]","whyItMatters":"[why]"},{"item":"[item 3]","statusNeeded":"[done]","whyItMatters":"[why]"},{"item":"[item 4]","statusNeeded":"[done]","whyItMatters":"[why]"},{"item":"[item 5]","statusNeeded":"[done]","whyItMatters":"[why]"}],
"recheckRecommendation":"[when and how to recheck before submitting]"
}`;

    const r2 = await client.messages.create({
      model: MODEL, max_tokens: 4000, temperature: 0.3,
      system: SYSTEM, messages: [{ role: "user", content: p2 }]
    });

    const p1json = safeParseJSON(r1.content[0]?.text || "");
    const p2json = safeParseJSON(r2.content[0]?.text || "");

    const paid = Object.assign({}, p1json, p2json);

    return res.status(200).json({ success: true, paid });

  } catch (e) {
    console.error("full-cycle error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

function safeParseJSON(raw) {
  const first = raw.indexOf("{");
  const last  = raw.lastIndexOf("}");
  if (first < 0) return {};
  try {
    return JSON.parse(raw.slice(first, last + 1));
  } catch(e) {
    // Try recovery — close unclosed structures
    let partial = raw.slice(first);
    partial = partial.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, "");
    partial = partial.replace(/,\s*"[^"]*"\s*:\s*\[$/, "");
    partial = partial.replace(/,\s*"[^"]*"\s*:\s*$/, "");
    let opens = 0, sq = 0;
    for (let i = 0; i < partial.length; i++) {
      if (partial[i] === "{") opens++;
      else if (partial[i] === "}") opens--;
      else if (partial[i] === "[") sq++;
      else if (partial[i] === "]") sq--;
    }
    let close = "";
    for (let i = 0; i < sq; i++) close += "]";
    for (let i = 0; i < opens; i++) close += "}";
    try { return JSON.parse(partial + close); }
    catch(e2) { console.error("JSON recovery failed:", e2.message); return {}; }
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
  const comps = (r.competencies || []).map(c => `${c.name}: ${c.status}`).join(", ");
  const dims = (r.dimensions || []).map(d => `${d.name}: ${d.score}/100`).join(" | ");
  const commScore = quiz.commercialCorrect || 3;
  const techScore = quiz.technicalCorrect || 3;

  const header = `CANDIDATE: ${name} | ${profile.university||""} | ${profile.course||""} | ${profile.grade||""}
TARGET: ${firm} — ${div}
SCORE: ${sc}/100 | ${band} | ${r.archetype||""}
KILLER: ${r.killerSentence||""}
BEING MISREAD: ${r.beingMisreadAs||""}
NAMED CV EVIDENCE: ${namedDetails}
DIMENSIONS: ${dims}
QUIZ: Commercial ${commScore}/5 | Numerical ${techScore}/5
GAPS:\n${gaps}
COMPETENCIES: ${comps}
CV EXTRACT: ${cvText ? cvText.slice(0, 1500) : "Use named CV details above"}`;

  return { firm, div, name, sc, band, namedDetails, commScore, techScore, header };
}
