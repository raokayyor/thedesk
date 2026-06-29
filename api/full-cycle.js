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

    const prompt = buildFullCyclePrompt(freeResult, cvText || "", profile || {}, quiz || {});

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      temperature: 0.3,
      system: `You are a senior finance career practitioner with 20+ years at Goldman Sachs, Barclays, JP Morgan and boutique firms. You have hired, screened and interviewed hundreds of students. You give direct, honest, specific advice. You do not use motivational language. You do not invent CV evidence. You work from what the candidate has actually done. Your paid repair plan must feel materially more valuable than the free diagnostic — it gives specific direction, not just diagnosis.`,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.content[0]?.text || "";
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first < 0 || last < 0) throw new Error("No JSON in response");
    const paid = JSON.parse(raw.slice(first, last + 1));

    return res.status(200).json({ success: true, paid });

  } catch (e) {
    console.error("full-cycle error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

function buildFullCyclePrompt(r, cvText, profile, quiz) {
  const firm = profile.targetFirm || r.targetFirm || "your target firm";
  const div  = profile.targetDivision || r.targetDivision || "finance";
  const name = r.candidateName || profile.name || "Candidate";
  const sc   = r.overallScore || 0;
  const band = r.band || "Borderline";
  const namedDetails = (r.namedCvDetails || []).join(", ");
  const gaps = (r.priorityGaps || []).map((g,i) => `${i+1}. ${g.title}: ${g.visibleRisk||""}`).join("\n");
  const comps = (r.competencies || []).map(c => `${c.name}: ${c.status} — ${c.visibleReason||""}`).join("\n");
  const dims = (r.dimensions || []).map(d => `${d.name}: ${d.score}/100 — ${d.visibleSummary||""}`).join("\n");

  return `You are building the paid Full Cycle repair plan for this candidate's finance application.

CANDIDATE PROFILE:
Name: ${name}
University: ${profile.university || ""}
Course: ${profile.course || ""}
Grade: ${profile.grade || ""}
Target Firm: ${firm}
Target Division: ${div}

FREE MOT RESULT:
Score: ${sc}/100 | Band: ${band} | Archetype: ${r.archetype || ""}
Killer sentence: ${r.killerSentence || ""}
Being misread as: ${r.beingMisreadAs || ""}
Uncomfortable truth: ${r.uncomfortableTruth || ""}
Free diagnostic: ${r.diagnostic || ""}
Named CV details: ${namedDetails}
Commercial quiz: ${quiz.commercialCorrect || r.quizScores?.commercial || "?"}/5
Numerical quiz: ${quiz.technicalCorrect || r.quizScores?.numerical || "?"}/5

DIMENSION SCORES:
${dims}

PRIORITY GAPS:
${gaps}

COMPETENCIES:
${comps}

CV TEXT:
${cvText ? cvText.slice(0, 3000) : "Not provided — use named CV details above"}

TASK:
Generate the full paid Full Cycle repair plan. This must materially exceed the free diagnostic. It must be specific to this candidate's actual CV evidence — do not invent facts or outcomes not in the CV.

Return ONLY valid JSON in this exact structure:

{
  "paidTitle": "Full Cycle Repair Plan — ${name} | ${firm} ${div}",
  "executiveVerdict": {
    "summary": "[2-3 sentences. Is this application ready? What is the core issue? Direct and honest.]",
    "readinessVerdict": "[One sentence. Ready / Not ready / Needs specific repair before submitting]",
    "mostImportantFix": "[The single highest-leverage change. One sentence.]",
    "submitAdvice": "[Should they submit now, wait, or rebuild first? Be specific.]"
  },
  "applicationRiskMap": [
    {
      "risk": "[Risk title]",
      "severity": "High",
      "whyItMatters": "[Why this specific risk matters for ${firm} ${div}]",
      "howToFix": "[Specific fix direction using their actual CV evidence]"
    }
  ],
  "evidenceHierarchy": {
    "leadWith": [
      {
        "evidence": "[Named CV item to lead with]",
        "whyItLeads": "[Why this should be the lead signal]",
        "howToUseIt": "[How to position it in the application]"
      }
    ],
    "supportWith": [
      {
        "evidence": "[Supporting evidence]",
        "whyItSupports": "[Why it supports rather than leads]",
        "howToUseIt": "[How to use it]"
      }
    ],
    "reduceOrCut": [
      {
        "evidence": "[What to reduce]",
        "whyReduce": "[Why]",
        "whatToDoInstead": "[Alternative]"
      }
    ]
  },
  "cvRepairMap": [
    {
      "section": "[Education / Experience / Societies etc]",
      "currentProblem": "[What is wrong with this section]",
      "whatThisSectionNeedsToProve": "[For ${firm} ${div}, this section needs to show...]",
      "repairDirection": "[Specific repair direction]",
      "exampleDirection": "[Example of the direction — not invented facts, but direction]",
      "whatNotToDo": "[Common mistake to avoid]"
    }
  ],
  "bulletRepair": [
    {
      "cvItem": "[Named CV item]",
      "currentIssue": "[What the current bullet does wrong]",
      "strongerAngle": "[What the bullet should prove instead]",
      "bulletStructure": "[Structure: context → action → outcome or similar]",
      "exampleBullet": "[A stronger bullet direction grounded in their real evidence — flag if inventing any detail]",
      "whyThisWorks": "[Why this version is stronger for ${firm} ${div}]"
    }
  ],
  "routePositioning": {
    "currentRouteFit": "[How credible is ${div} at ${firm} for this profile?]",
    "routeRisk": "[What is the route risk?]",
    "strongerPositioning": "[How to position for this route more convincingly]",
    "alternativeRoutes": [
      {
        "route": "[Alternative route]",
        "fit": "Possible",
        "why": "[Why this alternative fits]"
      }
    ]
  },
  "firmDivisionFit": {
    "targetFirm": "${firm}",
    "targetDivision": "${div}",
    "whatTheFirmWillLike": "[What ${firm} ${div} will respond well to in this profile]",
    "whatTheFirmWillQuestion": "[What they will probe or question]",
    "howToMakeFitClearer": "[Specific to ${firm} ${div} — safe language, not invented process details]"
  },
  "commercialAwarenessPlan": {
    "currentLevel": "[Based on ${quiz.commercialCorrect || "?"}]/5 quiz and CV signals]",
    "risk": "[Specific commercial risk for this candidate at ${firm} ${div}]",
    "priorityTopics": ["[Topic 1 relevant to ${div}]", "[Topic 2]", "[Topic 3]"],
    "tasks": [
      {
        "task": "[Specific task — not just read the FT]",
        "whyItMatters": "[Why this specific task matters for ${firm} ${div}]",
        "outputToCreate": "[What to produce from this task]"
      }
    ],
    "interviewUse": "[How to use this commercial prep in actual interviews]"
  },
  "numericalTechnicalPlan": {
    "currentLevel": "[${quiz.technicalCorrect || "?"}/5 — what this means]",
    "risk": "[Specific technical risk at ${firm} ${div}]",
    "targetLevelBeforeSubmission": "[Target score and timeframe]",
    "priorityPracticeAreas": ["[Area 1]", "[Area 2]", "[Area 3]"],
    "practicePlan": [
      {
        "task": "[Specific practice task]",
        "whyItMatters": "[Why this type for ${firm} ${div}]",
        "targetOutput": "[What improvement to aim for]"
      }
    ]
  },
  "interviewRiskMap": [
    {
      "likelyQuestion": "[Question this candidate is likely to face]",
      "whyThisQuestionExposesRisk": "[Why this question is dangerous for this specific profile]",
      "weakAnswerPattern": "[What a weak answer sounds like]",
      "strongAnswerStructure": "[Structure for a strong answer]",
      "candidateEvidenceToUse": "[Which of their actual CV evidence to anchor the answer]"
    }
  ],
  "competencyRepair": [
    {
      "competency": "[Competency name]",
      "currentStatus": "[Status from free result]",
      "currentEvidence": "[What evidence exists]",
      "whatIsMissing": "[What would make this application-grade]",
      "howToStrengthen": "[Specific direction]",
      "interviewRisk": "[How this competency gap shows up in interview]"
    }
  ],
  "sevenDayActionPlan": [
    {
      "day": "Day 1",
      "focus": "[Focus area]",
      "tasks": ["[Specific task 1]", "[Specific task 2]"],
      "deliverable": "[What they should have at end of day]"
    }
  ],
  "finalSubmissionChecklist": [
    {
      "item": "[Checklist item]",
      "statusNeeded": "[What done looks like]",
      "whyItMatters": "[Why this matters for ${firm} ${div}]"
    }
  ],
  "recheckRecommendation": "[When and how to recheck the application before submitting]"
}`;
}
