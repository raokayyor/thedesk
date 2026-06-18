// ════════════════════════════════════════════════════════════════════════════
// THE DESK — FULL CYCLE REPORT GENERATOR
// ════════════════════════════════════════════════════════════════════════════
// This is a DELIBERATELY SEPARATE backend prompt/model from analyse-mot.js.
//
// analyse-mot.js   = the FREE MOT. Diagnostic, short, creates tension.
//                     Tells the student WHAT is wrong.
// generate-fullcycle.js (this file) = the PAID product, triggered only after
//                     a student has completed the free MOT AND paid for
//                     Full Cycle access. Deeper, generates fixes, reframe
//                     structures, quantification questions, targeted unlocks.
//                     Tells the student HOW to fix it.
//
// Do not merge these two prompts. If the free MOT gives away the fix, the
// paid product becomes weaker. Keep the free result diagnostic-only and let
// THIS file carry all the "how to fix it" depth.
//
// Deploy at: /api/generate-fullcycle.js
//
// Env vars required:
//   ANTHROPIC_API_KEY   — required
//   CLAUDE_MODEL        — optional, defaults to claude-sonnet-4-6
//
// Expected request body (JSON):
// {
//   "profile": {
//     "name": "Rohan Mehta",
//     "university": "University of Bristol",
//     "course": "BSc Economics",
//     "year": "Year 2",
//     "grade": "Predicted 2:1",
//     "targetFirm": "Goldman Sachs",
//     "targetDivision": "Investment Banking",
//     "programmeType": "Summer Internship",
//     "track": "Investment Banking / IBD"
//   },
//   "cvText": "...full CV text from the original MOT submission...",
//   "motResult": {
//     "overallScore": 57, "band": "Borderline", "archetype": "Credible but Generic",
//     "dimensions": [ {"name":"Academic Signal","score":68,"note":"...","fix":"..."}, ... ],
//     "firstScreenRisk": "...", "wastedEvidence": "...", "missedOpportunity": "...",
//     "likelyRejectionReason": "...", "specificSignalNoticed": "..."
//   },
//   "quiz": { "commercialCorrect": 3, "commercialTotal": 5, "technicalCorrect": 4, "technicalTotal": 5 }
// }
//
// Response (200): { "success": true, "report": { ...structured JSON... }, "markdown": "..." }
// Response (4xx/5xx): { "success": false, "error": "ERROR_CODE", "message": "..." }
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED", message: "Use POST." });
  }

  try {
    const body = req.body || {};
    const profile = body.profile || {};
    const cvText = String(body.cvText || "").trim();
    const motResult = body.motResult || {};
    const quiz = body.quiz || {};

    if (!profile.name) {
      return res.status(400).json({ success: false, error: "MISSING_PROFILE", message: "Candidate profile (at least name) is required." });
    }
    const compactLen = cvText.replace(/\s/g, "").length;
    if (compactLen < 500) {
      return res.status(400).json({ success: false, error: "CV_TEXT_TOO_SHORT", message: "Full Cycle report needs the original CV text (500+ characters) to generate specific fixes." });
    }
    if (!motResult.archetype || typeof motResult.overallScore !== "number") {
      return res.status(400).json({ success: false, error: "MISSING_MOT_RESULT", message: "Full Cycle report requires the completed free MOT result (archetype, score, dimensions) as input." });
    }

    const prompt = buildFullCyclePrompt(profile, cvText, motResult, quiz);

    let report;
    try {
      report = await callClaudeForReport(prompt);
    } catch (err) {
      console.error("Full Cycle generation failed:", err);
      return res.status(502).json({ success: false, error: "CLAUDE_FAILED", message: "Could not generate the Full Cycle report. Please try again." });
    }

    if (!isValidReport(report)) {
      // one retry with a stricter reminder, same pattern as the free MOT backend
      try {
        const retryPrompt = prompt + `\n\nYour previous attempt was missing required fields or invented evidence. Re-read CORE REPORT PRINCIPLE and OUTPUT REQUIREMENTS and return a complete, valid report — every field in the schema must be present, experienceFixes must have at least 2 entries, and no numbers may be invented that are not in the CV text.`;
        report = await callClaudeForReport(retryPrompt);
      } catch (err) {
        console.error("Full Cycle retry failed:", err);
      }
      if (!isValidReport(report)) {
        return res.status(422).json({ success: false, error: "INCOMPLETE_REPORT", message: "Could not generate a complete report. Please try again." });
      }
    }

    const markdown = reportToMarkdown(report);

    return res.status(200).json({ success: true, report, markdown });
  } catch (err) {
    console.error("Unhandled error in generate-fullcycle:", err);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Something went wrong generating the report." });
  }
}

// ── Track helpers ──────────────────────────────────────────────────────────
function resolveTrack(profile) {
  const d = `${profile.targetDivision || ""} ${profile.track || ""}`.toLowerCase();
  if (d.includes("bank") || d.includes("ibd") || d.includes("advisory") || d.includes("m&a")) return "IBD";
  if (d.includes("trading") || d.includes("markets") || d.includes("s&t")) return "ST";
  if (d.includes("asset") || d.includes("invest") || d.includes("fund")) return "AM";
  if (d.includes("research")) return "Research";
  return "General";
}

const TECH_GUIDE_NAME = { IBD: "IBD technical guide", ST: "Markets technical guide", AM: "Investing technical guide", Research: "Research technical guide", General: "Application technical guide" };

const TRACK_LANGUAGE = {
  IBD: "transaction relevance, valuation readiness, deal rationale, buyer/seller logic, financing costs, M&A activity, DCF, trading comps, transaction comps, EV vs equity value, technical first-round risk. Do not overuse investment thesis, downside risk or portfolio fit unless discussing an actual stock pitch.",
  ST: "market instinct, rates, FX, bonds, inflation, central banks, volatility, risk/reward, client hedging, market drivers, speed and accuracy.",
  AM: "investment judgement, thesis, variant view, valuation, downside risk, portfolio fit, earnings drivers, stock pitch, company view.",
  Research: "written judgement, sector view, forecast risk, catalysts, valuation assumptions, evidence quality, company drivers.",
  General: "route clarity, strongest evidence, narrative focus, application direction, removing distractions, clarifying the target.",
};

const CORE_CONCEPTS = {
  IBD: ["valuation", "DCF", "trading comps", "transaction comps", "EV vs equity value", "accounting links", "EBITDA", "leverage", "interest rates and M&A", "deal rationale"],
  ST: ["rates", "bonds", "FX", "inflation", "central banks", "volatility", "risk/reward", "client hedging", "market drivers"],
  AM: ["stock pitch", "investment thesis", "valuation", "downside risk", "earnings drivers", "competitive advantage", "portfolio fit", "sector view"],
  Research: ["company drivers", "sector view", "written judgement", "valuation", "earnings", "catalysts", "downside risks"],
  General: ["commercial credibility", "route-specific evidence", "narrative coherence"],
};

const CURRENT_MARKET_TOPICS = [
  "inflation and Bank of England rate expectations", "oil prices and geopolitical risk",
  "Strait of Hormuz and energy markets", "capital-intensive growth and private markets funding",
  "UK M&A activity", "IPO windows", "AI capex and equity valuations",
  "gilt yields and valuation discount rates", "sterling moves and FX exposure",
];

// ── Prompt builder ────────────────────────────────────────────────────────
function buildFullCyclePrompt(profile, cvText, motResult, quiz) {
  const track = resolveTrack(profile);
  const techGuideName = TECH_GUIDE_NAME[track];
  const trackLang = TRACK_LANGUAGE[track];
  const coreConcepts = CORE_CONCEPTS[track].join(", ");
  const marketTopics = CURRENT_MARKET_TOPICS.join("; ");

  const fPct = quiz.commercialTotal ? Math.round(((quiz.commercialCorrect || 0) / quiz.commercialTotal) * 5) : null;
  const nPct = quiz.technicalTotal ? Math.round(((quiz.technicalCorrect || 0) / quiz.technicalTotal) * 5) : null;

  return `You are writing the PAID Full Cycle Report for The Desk — a personalised, professional, pre-submission review of a finance student's CV, application positioning, numerical readiness and technical readiness.

This is the PAID product. The student has already seen the free Application MOT (a short diagnostic). This report must feel materially more valuable: the free MOT diagnoses, this report FIXES. Do not repeat the free MOT's brevity — go deep, be specific, and show exactly how to reframe the candidate's actual evidence.

CORE REPORT PRINCIPLE — for every weak piece of evidence you address, show all of:
1. What the student currently has (quote or summarise the actual CV line)
2. Why it is not yet working hard enough (what a recruiter may miss)
3. What extra facts the student should provide (3-6 specific questions)
4. How the experience should be reframed (a stronger draft, using placeholders for any missing numbers)
5. Why the stronger version is more credible
6. What unlocks in the Full Cycle next (more reworks, benchmarking, guides, etc.)

NEVER INVENT EVIDENCE. Do not invent budget sizes, revenue, member counts, transaction values, client counts, hours worked, grades, firm names, or transaction names. If a number is not in the CV text, use a placeholder like £[amount] or [number]+ members and explicitly ask the student to supply it. This is a hard rule — fabricating a number is a severe quality failure.

Do not produce generic careers advice ("improve your CV", "quantify your experience", "show more commercial awareness", "prepare technical questions") — every piece of feedback must be tied to the student's actual CV content.

The student should come away feeling: "This has actually read my CV. This is not copy-paste advice. This is showing me what to fix before I submit. This is worth paying for because it is personal to me."

CANDIDATE PROFILE:
Name: ${profile.name || "Not provided"}
University: ${profile.university || "Not provided"} — ${profile.course || "Not provided"}
Year: ${profile.year || "Not provided"} | Grade: ${profile.grade || "Not provided"}
Target: ${profile.targetFirm || "Not provided"} — ${profile.targetDivision || "Not provided"} — ${profile.programmeType || "Not provided"}
Track: ${track}

FREE MOT RESULT (use these as the starting point — do not contradict them, build on them):
Overall score: ${motResult.overallScore}/100 | Band: ${motResult.band} | Archetype: ${motResult.archetype}
First-screen risk: ${motResult.firstScreenRisk || "Not provided"}
Wasted evidence: ${motResult.wastedEvidence || "Not provided"}
Missed opportunity: ${motResult.missedOpportunity || "Not provided"}
Likely rejection reason if unchanged: ${motResult.likelyRejectionReason || "Not provided"}
Specific signal noticed: ${motResult.specificSignalNoticed || "Not provided"}
Dimensions: ${JSON.stringify(motResult.dimensions || [])}

QUIZ SCORES:
Commercial/finance awareness: ${quiz.commercialCorrect ?? "?"}/${quiz.commercialTotal ?? 5}${fPct !== null ? ` (≈${fPct}/5)` : ""}
Numerical reasoning: ${quiz.technicalCorrect ?? "?"}/${quiz.technicalTotal ?? 5}${nPct !== null ? ` (≈${nPct}/5)` : ""}

CANDIDATE CV TEXT:
"""
${cvText}
"""

TRACK-SPECIFIC LANGUAGE (use throughout): ${trackLang}
CORE TECHNICAL CONCEPTS FOR THIS TRACK: ${coreConcepts}
CURRENT-MARKET TOPIC AREAS (use as topics to discuss, NEVER as factual news claims — you do not have live market data, so frame these as "what to prepare to discuss," not "what is happening right now"): ${marketTopics}
TECHNICAL GUIDE NAME FOR THIS TRACK: "${techGuideName}"

NUMERICAL READINESS TONE — calibrate to the actual score:
0-2/5: "This is a clear risk before online tests."
3/5: "This is not a disaster, but it is below the level expected for competitive banking applications."
4/5: "The base is credible, but careless errors or speed could still cost marks."
5/5: "Numerical performance is a relative strength, but it should be maintained through practice."
Any benchmark comparison must be labelled "Indicative benchmark based on The Desk assessment logic" — never claim it is based on real bank data.

EXPERIENCE FIXES — select AT LEAST TWO, and THREE if the CV supports it, of the student's actual CV experiences (work experience, societies, projects, leadership, courses) and build a full fix for each, following CORE REPORT PRINCIPLE above. Prioritise the most track-relevant evidence first, but a generic part-time job (retail, hospitality, tutoring, bar work) should never be dismissed — reframe it around consistency, accuracy, time management, responsibility, handling money, or customer interaction, exactly as a transferable-skills signal, not finance experience. Only use a generic invented example (clearly labelled "example structure only") if the CV genuinely lacks enough material — prefer the student's real evidence every time.

TONE — calm, direct, practitioner-like, specific, slightly uncomfortable, useful, sober, credible. Create consequence without panic. Never say "you will be rejected", "guaranteed", or similar absolutes — use "likely rejection reason if unchanged: [reason]" framing instead. Never use hype language (dream job, unlock your potential, transform your future, life-changing, supercharge, elite secrets).

DO NOT GIVE TOO MUCH AWAY — this report can show reworked sections and a positioning note because the student has paid, but do not produce a complete, finished, ready-to-submit CV. Show selected reworked sections, the positioning note, the preparation plan, and the unlocked resources — not a generic template or a fake "perfect application."

OUTPUT — respond ONLY with this JSON, no markdown, no preamble, no code fences. (A separate deterministic step converts this JSON into the markdown/PDF report, so you do not need to also produce markdown — focus all effort on making this JSON complete and specific.)

{
"candidate": {"name":"${profile.name || ""}","university":"${profile.university || ""}","course":"${profile.course || ""}","targetFirm":"${profile.targetFirm || ""}","targetDivision":"${profile.targetDivision || ""}","programmeType":"${profile.programmeType || ""}"},
"summary": {
  "overallScore": ${motResult.overallScore},
  "band": "${motResult.band || ""}",
  "archetype": "${motResult.archetype || ""}",
  "executiveRead": "[Use this exact structure, max 120 words: '[Name]'s application is [credible/early-stage/promising/under-positioned/technically exposed], but currently [main weakness]. The strongest evidence is [specific CV detail], but it is not yet being used as [track-specific evidence]. If submitted unchanged, the likely first-screen risk is [risk].']",
  "firstScreenRisk": "[track-specific, builds on the MOT's firstScreenRisk but can go deeper]",
  "likelyRejectionReason": "[short, sober phrase, never an absolute claim]",
  "wastedEvidence": "[builds on the MOT's wastedEvidence]"
},
"dimensions": [
  {"name":"Academic Signal","score":0,"interpretation":"[specific, references actual university/course/grade]","whatNeedsToImprove":"[specific]"},
  {"name":"Experience Relevance","score":0,"interpretation":"[specific, names actual CV experience]","whatNeedsToImprove":"[specific]"},
  {"name":"Commercial Awareness","score":0,"interpretation":"[ties to quiz result]","whatNeedsToImprove":"[specific]"},
  {"name":"Technical Readiness","score":0,"interpretation":"[ties to quiz result]","whatNeedsToImprove":"[specific, names ${techGuideName}]"},
  {"name":"Application Positioning","score":0,"interpretation":"[specific]","whatNeedsToImprove":"[specific]"},
  {"name":"Directional Clarity","score":0,"interpretation":"[specific to target firm/route]","whatNeedsToImprove":"[specific]"}
],
"experienceFixes": [
  {
    "title":"[actual CV experience name, e.g. 'Tesco — Customer Assistant']",
    "currentVersion":"[quote or closely summarise the actual CV line(s)]",
    "whyNotWorking":"[specific — what a recruiter may miss; vary the phrasing, do not reuse the same sentence across fixes]",
    "whatNumbersWeWouldLookFor":"The Full Cycle gives access to what we look for as recruiters and market professionals. This allows us to compare candidates, benchmark the evidence and analyse whether the experience is being framed strongly enough.",
    "questionsToAsk": ["[3-6 specific factual questions whose answers would strengthen THIS exact experience — hours, scale, process, outcome, pressure, etc, tailored to what's actually missing from this CV line]"],
    "strongerVersion":"[a stronger draft using placeholders like £[amount], [number]+ members, [number] hours per week for any missing facts — NEVER invent a specific number that is not in the CV]",
    "whyThisWorks":"[specific to this experience and the target track]",
    "whatUnlocksInFullCycle":"[specific — e.g. 'Full Cycle access would produce the final wording after confirming [specific missing facts for this experience].']"
  }
],
"numericalReadiness": {
  "scoreOutOfFive": ${nPct !== null ? nPct : 0},
  "interpretation": "[use the calibrated tone above for this score, personalised with the candidate's name]",
  "benchmark": "Indicative benchmark based on The Desk assessment logic: [candidate name] [score]/5, competitive applicant ~4/5, strong applicant ~5/5.",
  "whatUnlocksInFullCycle": ["practice questions","worked solutions","retest bank","benchmark analysis based on the MOT score","targeted drills for percentage change, ratios, charts, CAGR and time pressure"]
},
"technicalReadiness": {
  "interpretation": "[ties to quiz score and CV technical evidence, names what's missing]",
  "coreConcepts": ${JSON.stringify(CORE_CONCEPTS[track])},
  "currentMarketPrompts": ${JSON.stringify(CURRENT_MARKET_TOPICS.slice(0,5))},
  "whatUnlocksInFullCycle": ["${techGuideName}","daily news briefing and current-answer structures","application guides","live/recorded Zoom briefing"]
},
"applicationPositioningNote": {
  "strongestEvidenceToLeadWith": ["[2-4 actual named CV items, strongest first]"],
  "evidenceToReduce": ["[2-4 specific generic phrases or weak lines actually on the CV]"],
  "missingProof": ["[2-4 specific things the application currently lacks for this track]"],
  "howApplicationShouldRead": "[1-2 sentences, a positioning summary using the candidate's actual degree/university/track]",
  "preSubmissionChecklist": ["[4-6 specific, checkable items]"]
},
"fullCycleUnlocks": [
  {"area":"Reframed experience sections","whatItDoes":"[name the actual experiences that would be reframed for this student]"},
  {"area":"Application positioning note","whatItDoes":"A one-page route-specific note showing how the candidate should present the application for ${track === "IBD" ? "IBD" : track === "ST" ? "Sales & Trading" : track === "AM" ? "Asset Management" : track === "Research" ? "Research" : "this route"}."},
  {"area":"Numerical reasoning pack","whatItDoes":"Practice questions, worked solutions, retest bank and benchmark analysis based on the MOT score."},
  {"area":"${techGuideName}","whatItDoes":"Track-specific technical guide covering the concepts most likely to be tested for this route."},
  {"area":"Daily news briefing and current answers","whatItDoes":"Current-market prompts and answer structures so students can discuss recent commercial topics without sounding generic."},
  {"area":"Application guides","whatItDoes":"Track- and firm-specific application guides."},
  {"area":"Zoom briefing / workshops","whatItDoes":"Live or recorded sessions on applications, Q&A, technical readiness and commercial awareness."}
],
"finalVerdict": "[Use this shape: 'This is not a hopeless application. The issue is that the current version is not using the evidence well enough.' then make it personal using the candidate's name and actual CV evidence, 2-3 sentences, then end with exactly: \\"The safest time to fix this is before the application goes in.\\"]"
}`;
}

// ── Claude API call ───────────────────────────────────────────────────────
async function callClaudeForReport(prompt) {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    temperature: 0.3,
    system: "You are a former senior practitioner at an investment bank writing The Desk's paid Full Cycle Report. Be specific, practitioner-voiced, and never invent facts or numbers not present in the candidate's CV. Respond ONLY with valid JSON — no markdown, no preamble, no explanation, no code fences.",
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content?.[0]?.text || "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Validation ───────────────────────────────────────────────────────────
function isValidReport(r) {
  if (!r || typeof r !== "object") return false;
  if (!r.candidate || !r.summary || !r.summary.executiveRead) return false;
  if (!Array.isArray(r.dimensions) || r.dimensions.length < 6) return false;
  if (!Array.isArray(r.experienceFixes) || r.experienceFixes.length < 2) return false;
  for (const fix of r.experienceFixes) {
    if (!fix.title || !fix.currentVersion || !fix.strongerVersion || !Array.isArray(fix.questionsToAsk) || fix.questionsToAsk.length < 1) return false;
  }
  if (!r.numericalReadiness || !r.technicalReadiness || !r.applicationPositioningNote) return false;
  if (!Array.isArray(r.fullCycleUnlocks) || r.fullCycleUnlocks.length < 5) return false;
  if (!r.finalVerdict) return false;
  return true;
}

// ── Deterministic JSON → Markdown conversion ────────────────────────────────
// Doing this conversion in code (rather than asking Claude to also produce
// markdown) guarantees the markdown and JSON never disagree, and roughly
// halves the output-token cost of each report.
function reportToMarkdown(r) {
  const c = r.candidate || {};
  const s = r.summary || {};
  let md = `# THE DESK\n\n## FULL CYCLE REPORT\n\n`;
  md += `**Candidate:** ${c.name || ""}\n\n`;
  md += `**University:** ${c.university || ""} — ${c.course || ""}\n\n`;
  md += `**Target:** ${c.targetFirm || ""} — ${c.targetDivision || ""} — ${c.programmeType || ""}\n\n`;
  md += `**Current Positioning:** ${s.band || ""}\n\n`;
  md += `**Overall Readiness:** ${s.overallScore || 0} / 100\n\n`;
  md += `**Archetype:** ${s.archetype || ""}\n\n---\n\n`;

  md += `## SECTION 1 — EXECUTIVE READ\n\n${s.executiveRead || ""}\n\n---\n\n`;

  md += `## SECTION 2 — CURRENT POSITIONING\n\n`;
  md += `- **Overall score:** ${s.overallScore || 0}/100\n- **Band:** ${s.band || ""}\n- **Archetype:** ${s.archetype || ""}\n`;
  md += `- **First-screen risk:** ${s.firstScreenRisk || ""}\n- **Likely rejection reason if unchanged:** ${s.likelyRejectionReason || ""}\n- **Evidence currently being wasted:** ${s.wastedEvidence || ""}\n\n---\n\n`;

  md += `## SECTION 3 — DIMENSION SNAPSHOT\n\n`;
  (r.dimensions || []).forEach((d) => {
    md += `**${d.name}** — ${d.score}/100\n${d.interpretation || ""}\n*What needs to improve:* ${d.whatNeedsToImprove || ""}\n\n`;
  });
  md += `---\n\n## SECTION 4 — LET'S FIX IT IN THE FULL CYCLE\n\n`;
  (r.experienceFixes || []).forEach((f, i) => {
    md += `### Fix ${i + 1} — ${f.title || ""}\n\n`;
    md += `**Current version**\n${f.currentVersion || ""}\n\n`;
    md += `**Why it is not working hard enough**\n${f.whyNotWorking || ""}\n\n`;
    md += `**What numbers we would look for**\n${f.whatNumbersWeWouldLookFor || ""}\n\n`;
    md += `Ask for:\n` + (f.questionsToAsk || []).map((q) => `- ${q}`).join("\n") + `\n\n`;
    md += `**Stronger version**\n${f.strongerVersion || ""}\n\n`;
    md += `**Why this works**\n${f.whyThisWorks || ""}\n\n`;
    md += `**What unlocks in the Full Cycle**\n${f.whatUnlocksInFullCycle || ""}\n\n---\n\n`;
  });

  const nr = r.numericalReadiness || {};
  md += `## SECTION 5 — NUMERICAL READINESS\n\n**Score:** ${nr.scoreOutOfFive || 0}/5\n\n${nr.interpretation || ""}\n\n${nr.benchmark || ""}\n\n`;
  md += `What unlocks in the Full Cycle:\n` + (nr.whatUnlocksInFullCycle || []).map((x) => `- ${x}`).join("\n") + `\n\n---\n\n`;

  const tr = r.technicalReadiness || {};
  md += `## SECTION 6 — TECHNICAL READINESS\n\n${tr.interpretation || ""}\n\n`;
  md += `**Core concepts:** ${(tr.coreConcepts || []).join(", ")}\n\n`;
  md += `**Current-market prompts to prepare:** ${(tr.currentMarketPrompts || []).join("; ")}\n\n`;
  md += `What unlocks in the Full Cycle:\n` + (tr.whatUnlocksInFullCycle || []).map((x) => `- ${x}`).join("\n") + `\n\n---\n\n`;

  const pn = r.applicationPositioningNote || {};
  md += `## SECTION 8 — APPLICATION POSITIONING NOTE\n\n`;
  md += `**Strongest evidence to lead with:**\n` + (pn.strongestEvidenceToLeadWith || []).map((x) => `- ${x}`).join("\n") + `\n\n`;
  md += `**Evidence to reduce:**\n` + (pn.evidenceToReduce || []).map((x) => `- ${x}`).join("\n") + `\n\n`;
  md += `**Missing proof:**\n` + (pn.missingProof || []).map((x) => `- ${x}`).join("\n") + `\n\n`;
  md += `**How the application should read:**\n${pn.howApplicationShouldRead || ""}\n\n`;
  md += `**Pre-submission checklist:**\n` + (pn.preSubmissionChecklist || []).map((x) => `- ${x}`).join("\n") + `\n\n---\n\n`;

  md += `## SECTION 9 — WHAT UNLOCKS IN THE FULL CYCLE\n\n`;
  (r.fullCycleUnlocks || []).forEach((u) => { md += `**${u.area}**\n${u.whatItDoes}\n\n`; });

  md += `---\n\n## SECTION 10 — FINAL PRE-SUBMISSION VERDICT\n\n${r.finalVerdict || ""}\n`;
  return md;
}
