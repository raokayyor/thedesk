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
    const { cvText, paid, profile, quiz } = req.body || {};
    if (!cvText && !paid) return res.status(400).json({ success: false, error: "Missing CV text or repair plan" });

    const firm = profile?.targetFirm || "your target firm";
    const div  = profile?.targetDivision || "finance";
    const name = profile?.name || "";

    const evidenceOrder = [
      ...(paid?.evidenceHierarchy?.leadWith    || []).map(e => `LEAD: ${e.evidence} — ${e.howToUseIt}`),
      ...(paid?.evidenceHierarchy?.supportWith || []).map(e => `SUPPORT: ${e.evidence} — ${e.howToUseIt}`),
      ...(paid?.evidenceHierarchy?.reduceOrCut || []).map(e => `REDUCE: ${e.evidence} — ${e.whatToDoInstead}`)
    ].join("\n");

    const bulletDirections = (paid?.bulletRepair || []).map(b =>
      `${b.cvItem}:\n  Issue: ${b.currentIssue}\n  Stronger angle: ${b.strongerAngle}\n  Structure: ${b.bulletStructure}\n  Direction: ${b.exampleBullet}`
    ).join("\n\n");

    const repairNotes = (paid?.cvRepairMap || []).map(s =>
      `${s.section}: ${s.repairDirection}`
    ).join("\n");

    const prompt = `You are a senior finance career practitioner rewriting a student CV for ${div} at ${firm}.

ORIGINAL CV:
${cvText || "(not provided — use the named CV details from the repair plan)"}

EVIDENCE ORDER FROM REPAIR PLAN:
${evidenceOrder}

BULLET REPAIR DIRECTIONS:
${bulletDirections}

SECTION REPAIR NOTES:
${repairNotes}

EXECUTIVE VERDICT: ${paid?.executiveVerdict?.summary || ""}

STRICT RULES:
1. NEVER invent deals, clients, outcomes, numbers, modelling assumptions, responsibilities, committee presentations, investor reporting details or roles
2. Keep ALL dates, company names, job titles, grades and qualifications exactly as in the original
3. Reorder sections based on the evidence hierarchy above — lead evidence must appear first in Experience
4. Every bullet must follow: context → action → analytical output where possible
5. Label each bullet with a confidence level: "ready" / "if_accurate" / "needs_confirmation" / "build_first"
   - ready: CV already clearly supports this wording
   - if_accurate: depends on details that may be true but are not fully confirmed
   - needs_confirmation: needs more information from the student
   - build_first: candidate lacks underlying evidence — do not include yet
6. If a section cannot be improved without inventing content, flag it as build_first
7. The draft is for editing — be explicit about what needs student verification

Return ONLY valid JSON:
{
  "candidateName": "${name || "[Name]"}",
  "targetRole": "${div} at ${firm}",
  "sections": [
    {
      "title": "Education",
      "items": [
        {
          "heading": "[University | Degree | Expected Year]",
          "subheading": "[Grade / predicted grade]",
          "bullets": [
            { "text": "[Bullet text]", "confidence": "ready|if_accurate|needs_confirmation|build_first", "note": "[Optional note to student]" }
          ]
        }
      ]
    },
    {
      "title": "Experience",
      "orderNote": "[Explain the evidence ordering — e.g. KKR leads because it is stronger technical evidence than Goldman Insight]",
      "items": [
        {
          "heading": "[Company | Role | Dates]",
          "subheading": "[Location if in original]",
          "bullets": [
            { "text": "[Rewritten bullet]", "confidence": "ready|if_accurate|needs_confirmation|build_first", "note": "[Note if needed]" }
          ]
        }
      ]
    },
    {
      "title": "Societies and Activities",
      "items": [
        {
          "heading": "[Society | Role | Dates]",
          "subheading": "",
          "bullets": [
            { "text": "[Bullet]", "confidence": "ready|if_accurate|needs_confirmation|build_first", "note": "" }
          ]
        }
      ]
    },
    {
      "title": "Skills",
      "items": [
        {
          "heading": "Technical Skills",
          "subheading": "",
          "bullets": [
            { "text": "[Skills from original CV exactly]", "confidence": "ready", "note": "" }
          ]
        }
      ]
    }
  ],
  "whatChangedAndWhy": [
    { "change": "[What was changed]", "reason": "[Why — connect to repair plan logic]" }
  ],
  "accuracyFlags": [
    { "item": "[CV item needing verification]", "question": "[Specific question for student to answer]" }
  ],
  "buildFirst": [
    { "gap": "[What evidence needs to be built]", "why": "[Why it matters for ${div} at ${firm}]" }
  ]
}`;

    const response = await client.messages.create({
      model: MODEL, max_tokens: 4096, temperature: 0.2,
      system: `You are a senior finance career practitioner rewriting student CVs. You never invent content. You improve framing, structure and language only. You flag everything uncertain. Return ONLY valid JSON.`,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.content[0]?.text || "";
    const first = raw.indexOf("{");
    const last  = raw.lastIndexOf("}");
    if (first < 0) throw new Error("No JSON returned");
    const cv = JSON.parse(raw.slice(first, last + 1));

    return res.status(200).json({ success: true, cv });
  } catch (e) {
    console.error("generate-cv error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
