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
    const name = paid?.paidTitle?.split("—")[1]?.split("|")[0]?.trim() || profile?.name || "";

    const bulletRepair = (paid?.bulletRepair || []).map(b =>
      `- ${b.cvItem}: ${b.strongerAngle} | Structure: ${b.bulletStructure} | Direction: ${b.exampleBullet}`
    ).join("\n");

    const evidenceHierarchy = [
      ...(paid?.evidenceHierarchy?.leadWith || []).map(e => `LEAD: ${e.evidence} — ${e.howToUseIt}`),
      ...(paid?.evidenceHierarchy?.supportWith || []).map(e => `SUPPORT: ${e.evidence} — ${e.howToUseIt}`),
      ...(paid?.evidenceHierarchy?.reduceOrCut || []).map(e => `CUT/REDUCE: ${e.evidence} — ${e.whatToDoInstead}`)
    ].join("\n");

    const prompt = `You are a senior finance career practitioner rewriting a student CV for a ${div} application at ${firm}.

ORIGINAL CV:
${cvText}

REPAIR PLAN CONTEXT:
Target: ${firm} — ${div}
Evidence hierarchy:
${evidenceHierarchy}

Bullet repair directions:
${bulletRepair}

CV Repair notes:
${(paid?.cvRepairMap || []).map(s => `${s.section}: ${s.repairDirection}`).join("\n")}

STRICT RULES — you MUST follow these:
1. NEVER invent deals, clients, outcomes, numbers, responsibilities or roles
2. ONLY rewrite what is in the original CV — improve framing, not facts
3. If a bullet cannot be improved without inventing content, improve structure and language only
4. Keep all dates, job titles, company names, grades and qualifications exactly as in the original
5. Flag any bullet with "[Review: this direction assumes X — use only if accurate]" if it depends on unconfirmed detail
6. Every bullet should follow: context → action → analytical output where possible
7. Do NOT add experience that is not in the original CV

Generate a rewritten CV as JSON:
{
  "candidateName": "${name || "[Name from original CV]"}",
  "targetRole": "${div} — ${firm}",
  "sections": [
    {
      "title": "Education",
      "items": [
        {
          "heading": "[University | Degree | Dates]",
          "subheading": "[Grade if present]",
          "bullets": ["[Rewritten bullet]"]
        }
      ]
    },
    {
      "title": "Experience",
      "items": [
        {
          "heading": "[Company | Role | Dates]",
          "subheading": "[Location if present]",
          "bullets": ["[Rewritten bullet 1]", "[Rewritten bullet 2]"]
        }
      ]
    },
    {
      "title": "Societies and Activities",
      "items": [
        {
          "heading": "[Society | Role | Dates]",
          "subheading": "",
          "bullets": ["[Rewritten bullet]"]
        }
      ]
    },
    {
      "title": "Skills",
      "items": [
        {
          "heading": "Technical Skills",
          "subheading": "",
          "bullets": ["[Skills list from original CV]"]
        }
      ]
    }
  ],
  "writingNotes": ["[Note 1 about what was changed and why]", "[Note 2]"],
  "accuracyFlags": ["[Any bullet that needs candidate verification]"]
}`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.2,
      system: `You are a senior finance career practitioner rewriting student CVs. You never invent content. You only improve framing, structure and language. You flag anything that depends on unconfirmed detail. Return ONLY valid JSON.`,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.content[0]?.text || "";
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first < 0) throw new Error("No JSON returned");
    const cv = JSON.parse(raw.slice(first, last + 1));

    return res.status(200).json({ success: true, cv });
  } catch (e) {
    console.error("generate-cv error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
