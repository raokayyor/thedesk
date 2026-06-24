export const maxDuration = 60;
import Anthropic from "@anthropic-ai/sdk";

// Inline a simplified buildPrompt to test
function buildTestPrompt(profile, quiz, cvText) {
  return `You are assessing a finance student application. Return ONLY valid JSON, no markdown, no backticks, no explanation.

CANDIDATE DATA:
- University: ${profile.university || "Unknown"}
- Course: ${profile.course || "Unknown"}
- Year: ${profile.year || "Unknown"}
- Grade: ${profile.grade || "Unknown"}
- Target Firm: ${profile.targetFirm || "Unknown"}
- Target Division: ${profile.targetDivision || "Unknown"}
- Programme: ${profile.programme || "Unknown"}
- Commercial quiz: ${quiz.commercialCorrect || 0}/${quiz.commercialTotal || 5}
- Numerical quiz: ${quiz.technicalCorrect || 0}/${quiz.technicalTotal || 5}

CV TEXT:
"""
${cvText}
"""

Return this JSON (fill in real values based on the candidate above):
{"overallScore":65,"band":"Borderline","archetype":"Credible but Generic","killerSentence":"One specific sentence about this candidate.","diagnostic":"Two sentences about what is weak and why it matters.","priorities":["First gap","Second gap","Third gap"],"dimensions":[{"name":"Academic Signal","score":70,"note":"Specific note about their university and degree.","fix":"Specific fix for their academic presentation."},{"name":"Experience Relevance","score":60,"note":"Note about their experience.","fix":"Fix for their experience section."},{"name":"Technical Readiness","score":55,"note":"Note about technical score.","fix":"Fix for technical preparation."},{"name":"Commercial Awareness","score":65,"note":"Note about commercial knowledge.","fix":"Fix for commercial signals."},{"name":"Application Positioning","score":60,"note":"Note about CV structure.","fix":"Fix for positioning."},{"name":"Directional Clarity","score":65,"note":"Note about motivation clarity.","fix":"Fix for direction."}],"wastedEvidence":"Something being undersold.","missedOpportunity":"Something not mentioned.","highestLeverage":"Most important fix.","paidHook":"Your personalised fix plan is ready — Full Cycle unlocks all six dimension fixes specific to your CV and this firm.","beforeSubmitCopy":"Fix this before you submit.","deeperReviewFocus":"Focus area for deeper review.","namedCvDetails":["University name","Any employer"],"specificSignalNoticed":"One specific thing noticed in the CV.","cvSpecificityWarning":""}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const profile = { university: "University of Warwick", course: "Economics", year: "Final Year", grade: "2:1 predicted", targetFirm: "Goldman Sachs", targetDivision: "Investment Banking / IBD", programme: "Summer Internship", track: "Investment Banking / IBD" };
    const quiz = { commercialCorrect: 3, commercialTotal: 5, technicalCorrect: 2, technicalTotal: 5 };
    const cvText = `Rohan Mehta, University of Warwick BSc Economics predicted 2:1.
Intern at Hawkpoint Partners (Boutique CF) Summer 2023 - assisted on M&A mandates, supported information memoranda.
Captain Warwick 2nd XI Football 2023-present, team of 18 players.
Part-time barista Costa Coffee 15hrs/week during term.
Warwick Finance Society general member.`;

    const prompt = buildTestPrompt(profile, quiz, cvText);
    const t = Date.now();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are a finance recruiting expert. Return ONLY valid JSON. No markdown. No backticks. No explanation.",
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.content?.[0]?.text || "";
    const ms = Date.now() - t;
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    let parsed = null, parseError = null;
    try { parsed = JSON.parse(raw.slice(first, last+1)); }
    catch(e) { parseError = e.message + " | tail: " + raw.slice(-300); }

    return res.status(200).json({
      ms,
      rawLength: raw.length,
      rawStart: raw.slice(0,100),
      parseError,
      score: parsed?.overallScore,
      dims: parsed?.dimensions?.length,
      priorities: parsed?.priorities?.length,
      parsedOk: !!parsed && !parseError,
      promptLength: prompt.length
    });

  } catch(e) {
    return res.status(500).json({ error: e.message, stack: e.stack?.slice(0,300) });
  }
}
