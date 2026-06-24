export const maxDuration = 60;
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const t = Date.now();

    const prompt = `You are assessing a finance student CV. Return ONLY valid JSON, no markdown, no backticks.

CANDIDATE: Sarah Chen, LSE Economics Year 2, targeting Goldman Sachs IBD Summer Internship, quiz score 4/5 commercial, 3/5 numerical.

CV: LSE BSc Economics predicted First. Modules: Corporate Finance, Econometrics. A-levels: Maths A*, Economics A*, History A. Intern at Rothschild M&A summer 2024 - assisted on two live transactions, built comparable company analysis. Captain LSE Women's Football. LSE Investment Society equity analyst. Part-time barista Costa Coffee term-time.

Return this exact JSON structure:
{"overallScore":72,"band":"Competitive","archetype":"Strong Candidate","killerSentence":"The Rothschild internship is the strongest signal here but the application is not yet making it do enough work.","diagnostic":"This is a competitive profile but not yet a standout.","priorities":["Technical readiness needs work before HireVue","Positioning of Rothschild internship is too generic","Why Goldman answer will not survive Superday"],"dimensions":[{"name":"Academic Signal","score":85,"note":"LSE Economics is a core Goldman target.","fix":"Name the specific modules and connect them to IBD work."},{"name":"Experience Relevance","score":75,"note":"Rothschild M&A is strong but bullets are generic.","fix":"Lead with the deal names and your specific analytical output."},{"name":"Technical Readiness","score":60,"note":"3/5 on numerical quiz is a HireVue risk.","fix":"Practice SHL-style tests for two weeks before applying."},{"name":"Commercial Awareness","score":80,"note":"Investment Society and FT reading are evidenced.","fix":"Name the sectors and specific stocks you have covered."},{"name":"Application Positioning","score":65,"note":"CV opens with generic personal statement.","fix":"Lead with Rothschild deal exposure in your opening line."},{"name":"Directional Clarity","score":70,"note":"IBD intent is clear but why Goldman is generic.","fix":"Build a Goldman-specific motivation using their sector strengths."}],"wastedEvidence":"The Rothschild internship is being undersold.","missedOpportunity":"Football captaincy is not being used as a leadership signal.","highestLeverage":"Rewrite the Rothschild bullets with deal-specific language.","paidHook":"Your Full Cycle plan is ready — fixes for all six dimensions specific to Goldman IBD this cycle.","namedCvDetails":["LSE","Rothschild","Costa Coffee","LSE Investment Society"],"specificSignalNoticed":"Captain of LSE Women Football team shows leadership that is not currently evidenced in the application positioning.","cvSpecificityWarning":""}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      temperature: 0,
      system: "You are a finance recruiting expert. Return ONLY valid JSON with no markdown formatting, no backticks, no explanation.",
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.content?.[0]?.text || "";
    const ms = Date.now() - t;
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    let parsed = null;
    let parseError = null;
    try {
      parsed = JSON.parse(raw.slice(first, last + 1));
    } catch(e) {
      parseError = e.message;
    }

    return res.status(200).json({
      ms,
      rawLength: raw.length,
      rawStart: raw.slice(0, 200),
      rawEnd: raw.slice(-200),
      parseError,
      hasScore: parsed?.overallScore,
      hasDimensions: parsed?.dimensions?.length,
      hasPriorities: parsed?.priorities?.length,
      parsedOk: !!parsed
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
