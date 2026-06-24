// The Desk — Application MOT Backend
// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT:
//   Vercel:  place at /api/analyse-mot.js in your project root
//   Netlify: place at /netlify/functions/analyse-mot.js (minor adapter needed)
//   Express: app.post('/api/analyse-mot', handler)
//
// ENVIRONMENT VARIABLES REQUIRED:
//   ANTHROPIC_API_KEY   — your Anthropic API key (never put in frontend)
//   CLAUDE_MODEL        — optional, defaults to claude-sonnet-4-6
//
// DEPENDENCIES:
//   npm install @anthropic-ai/sdk pdf-parse mammoth formidable
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Lazy-load heavy extractors so cold start is fast
let pdfParse, mammoth;

export const maxDuration = 60;

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";
const CV_MIN_CHARS = 500; // minimum non-whitespace characters

// FIRM_PROCESS — researched, sourced recruitment process steps per firm, mirrored from the frontend.
// Used to make the diagnostic reference the actual stage a weakness would bite at, not just a score.
// Batch 1 (researched June 2026). Extend batch by batch — each entry must be grounded in real sourcing.
const FIRM_PROCESS = {
  "Goldman Sachs": {
    numericalStage: null,
    aiInterviewStage: "HireVue",
    distinctiveFact: "Goldman's HireVue is evaluated by AI across verbal and non-verbal delivery before a human reviews it, and Superday interviewers are trained to push hard on generic \"why Goldman\" answers specifically.",
  },
  "JP Morgan": {
    numericalStage: "Pymetrics",
    aiInterviewStage: "HireVue",
    distinctiveFact: "JPMorgan screens with Pymetrics before HireVue — a gamified neuroscience assessment of cognitive and behavioural traits, not a traditional numerical reasoning test.",
  },
  "Barclays": {
    numericalStage: "SHL Verify numerical reasoning",
    aiInterviewStage: "HireVue",
    distinctiveFact: "Barclays' SHL numerical test draws on 6-8 data sources per question — more demanding than the typical Tier 1 bank test — and every stage is explicitly scored against its own RISES values framework.",
  },
  "Lazard": {
    numericalStage: "pre-employment numerical assessment (lighter than bulge-bracket numerical tests)",
    aiInterviewStage: "video interview",
    distinctiveFact: "Lazard's process leans far more on direct networking with bankers than the standardised bulge-bracket funnel, and its Superday is consistently described by candidates as weighted toward fit over pure technical testing.",
  },
};

// FIX 2 — length alone isn't enough (500 chars of a cover letter or random text would
// pass); require recognisable CV-shaped content too. Mirrors the frontend's check exactly
// so behaviour is consistent whether the backend or the local fallback handles a request.
function hasUsableCvText(text) {
  if (!text) return false;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < CV_MIN_CHARS) return false;
  // Broadened from the original list, and threshold lowered from 2 hits to 1 — a stricter
  // gate was causing real, legitimately-formatted CVs (especially ones without explicit
  // "Education"/"Experience" section headers) to be falsely rejected.
  const usefulTerms = [
    "education", "university", "college", "school", "experience", "work", "employment",
    "internship", "intern", "society", "club", "committee", "project", "skills", "a-level", "gcse",
    "degree", "course", "module", "qualification", "graduate", "volunteer", "leadership", "captain",
    "treasurer", "president", "secretary", "responsible", "achievement", "award",
  ];
  const lower = clean.toLowerCase();
  const hits = usefulTerms.filter((t) => lower.includes(t)).length;
  return hits >= 1;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED", message: "Use POST." });
  }

  try {
    let profile, quiz, cvText, cvFileName;
    const contentType = req.headers["content-type"] || "";

    // ── Parse request ─────────────────────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      // File upload path
      const { fields, files } = await parseMultipart(req);
      profile = JSON.parse(fields.profile?.[0] || fields.profile || "{}");
      quiz    = JSON.parse(fields.quiz?.[0]    || fields.quiz    || "{}");
      const file = files.cvFile?.[0] || files.cvFile;
      cvFileName = file?.originalFilename || file?.name || "unknown";
      cvText = await extractTextFromFile(file);
    } else {
      // JSON path (cv.text already extracted or pasted)
      const body = req.body || {};
      profile    = body.profile || {};
      quiz       = body.quiz    || {};
      cvText     = String((body.cv && body.cv.text) ? body.cv.text : "").trim();
      cvFileName = (body.cv && body.cv.fileName) || "";
    }

    // ── CV validation ─────────────────────────────────────────────────────
    const compactLen = (cvText || "").replace(/\s/g, "").length;
    if (compactLen < CV_MIN_CHARS) {
      return res.status(400).json({
        success: false,
        source: "error",
        error: "CV_TEXT_EXTRACTION_FAILED",
        message: "We could not read enough text from this CV. Please upload a clearer PDF, Word document, or paste your CV text directly.",
      });
    }
    if (!hasUsableCvText(cvText)) {
      return res.status(400).json({
        success: false,
        source: "error",
        error: "CV_TEXT_NOT_RECOGNISABLE",
        message: "This does not look like a complete CV — make sure education, experience and skills sections are included, then try again.",
      });
    }

    // ── Build prompt and call Claude ──────────────────────────────────────
    const prompt = buildPrompt(profile, quiz, cvText);
    let result   = await callClaude(prompt);

    // ── Retry once if named CV details missing ────────────────────────────
    if (!isValidResult(result, true)) {
      console.log("First attempt missing named CV details — retrying");
      const retryPrompt = buildPrompt(profile, quiz, cvText) + `

RETRY INSTRUCTION — YOUR PREVIOUS RESPONSE WAS REJECTED:
Your output did not reference at least one named CV detail.
This is mandatory. Re-read the CANDIDATE CV TEXT above carefully.
Extract and reference at least one of:
- A named employer (e.g. Goldman Sachs, Tesco, boutique corporate finance firm)
- A named society (e.g. Bristol Finance Society, Warwick Trading Society)
- A named project (e.g. Python yield curve project, Diageo stock pitch)
- A named module (e.g. Corporate Finance, Valuation, Econometrics)
- A named role or internship title
- An A-level subject

Do NOT use generic phrases like "your finance experience" or "your project".
Return ONLY valid JSON matching the exact schema. No markdown. No explanation.`;

      result = await callClaude(retryPrompt);
    }

    // ── Final validation ──────────────────────────────────────────────────
    if (!isValidResult(result, true)) {
      return res.status(422).json({
        success: false,
        source: "error",
        error: "NO_NAMED_CV_DETAIL",
        message: "We could not generate a sufficiently specific CV read. Please upload a clearer CV, or paste your CV text directly and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      source: "claude",
      cvTextExtracted: true,
      namedCvDetailsFound: result.namedCvDetails || [],
      result,
    });

  } catch (err) {
    console.error("analyse-mot error:", err);

    if (err.message?.includes("API key") || err.status === 401) {
      return res.status(500).json({ success: false, source: "error", error: "AUTH_FAILED", message: "Server configuration error. Please contact support." });
    }
    if (err.message?.includes("JSON") || err.name === "SyntaxError") {
      return res.status(500).json({ success: false, source: "error", error: "INVALID_JSON", message: "The assessment model returned an unexpected response. Please try again." });
    }
    return res.status(500).json({ success: false, source: "error", error: "CLAUDE_FAILED", message: "Assessment could not be completed. Please try again." });
  }
}

// ── File text extraction ──────────────────────────────────────────────────────
async function extractTextFromFile(file) {
  if (!file) return "";
  const filePath = file.filepath || file.path;
  const fileName = (file.originalFilename || file.name || "").toLowerCase();

  if (fileName.endsWith(".pdf")) {
    if (!pdfParse) pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const buffer = fs.readFileSync(filePath);
    const data   = await pdfParse(buffer);
    return data.text || "";
  }

  if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    if (!mammoth) mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
    return fs.readFileSync(filePath, "utf-8");
  }

  throw Object.assign(new Error("Unsupported file type"), { code: "UNSUPPORTED_FILE_TYPE" });
}

// ── Multipart parser ──────────────────────────────────────────────────────────
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

// ── Claude API call ───────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    temperature: 0.2,
    system: "You are a former senior practitioner at an investment bank conducting The Desk Application MOT. Be direct, honest, specific and practitioner-voiced. Respond ONLY with valid JSON — no markdown, no preamble, no explanation.",
    messages: [{ role: "user", content: prompt }],
  });

  const text    = response.content?.[0]?.text || "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Result validation ─────────────────────────────────────────────────────────
function isValidResult(result, cvRequired) {
  if (!result || typeof result !== "object")             return false;
  if (typeof result.overallScore !== "number")           return false;
  if (result.overallScore < 0 || result.overallScore > 100) return false;
  if (!result.band             || typeof result.band             !== "string") return false;
  if (!result.archetype        || typeof result.archetype        !== "string") return false;
  if (!result.killerSentence   || typeof result.killerSentence   !== "string") return false;
  if (!Array.isArray(result.dimensions)  || result.dimensions.length  < 6)    return false;
  if (!Array.isArray(result.priorities)  || result.priorities.length  !== 3)  return false;
  if (!result.diagnostic       || typeof result.diagnostic       !== "string") return false;
  if (!result.highestLeverage  || typeof result.highestLeverage  !== "string") return false;
  if (!result.paidHook         || typeof result.paidHook         !== "string") return false;

  for (const d of result.dimensions) {
    if (!d.name  || typeof d.name  !== "string") return false;
    if (typeof d.score !== "number")             return false;
    if (d.score < 0 || d.score > 100)           return false;
    if (!d.note  || typeof d.note  !== "string") return false;
    if (!d.fix   || typeof d.fix   !== "string") return false;
  }

  if (cvRequired) {
    if (!Array.isArray(result.namedCvDetails))   return false;
    const real = result.namedCvDetails.filter(d => d && typeof d === "string" && d.length > 4);
    if (real.length < 1)                         return false;
    if (!result.specificSignalNoticed || typeof result.specificSignalNoticed !== "string") return false;
  }

  return true;
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(profile, quiz, cvText) {
  const track = profile.track || "General Finance";

  const weights = {
    "Investment Banking / IBD":        "Academic 15%, Experience 20%, Commercial 15%, Technical 20%, Positioning 20%, Clarity 10%",
    "Sales & Trading / Markets":       "Academic 15%, Experience 15%, Commercial 25%, Technical 25%, Positioning 10%, Clarity 10%",
    "Asset Management / Investing":    "Academic 15%, Experience 20%, Commercial 25%, Technical 15%, Positioning 15%, Clarity 10%",
    "General Finance":                 "Academic 20%, Experience 20%, Commercial 15%, Technical 15%, Positioning 20%, Clarity 10%",
  }[track] || "Academic 20%, Experience 20%, Commercial 15%, Technical 15%, Positioning 20%, Clarity 10%";

  const trackLanguage = {
    "Investment Banking / IBD":     `use "transaction exposure", "valuation", "deal rationale", "financing conditions", "analytical ownership", "first-round technicals"`,
    "Sales & Trading / Markets":    `use "market instinct", "rates", "FX", "volatility", "speed of reasoning", "risk/reward", "client flow"`,
    "Asset Management / Investing": `use "investment judgement", "thesis", "fundamentals", "valuation", "sector view", "downside risk", "portfolio thinking"`,
    "General Finance":              `use broader language around financial credibility, direction and commercial understanding`,
  }[track] || `use broader language around financial credibility, direction and commercial understanding`;

  const fPct = Math.round(((quiz.commercialCorrect || 0) / (quiz.commercialTotal || 5)) * 100);
  const nPct = Math.round(((quiz.technicalCorrect || 0) / (quiz.technicalTotal || 5)) * 100);

  const firmProc = FIRM_PROCESS[profile.targetFirm];
  const firmProcessInstruction = firmProc
    ? `FIRM-SPECIFIC PROCESS PERSONALISATION — the candidate's target firm is ${profile.targetFirm}, and we have researched, sourced detail on its actual recruitment process: ${firmProc.distinctiveFact} ${firmProc.numericalStage ? `Its numerical/cognitive screening stage is specifically called "${firmProc.numericalStage}".` : `It does not use a separate standardised numerical test the way some peers do — numerical ability is assessed within ${firmProc.aiInterviewStage} and Superday technical questions instead.`} Its early-stage video interview is called "${firmProc.aiInterviewStage}". If Technical Readiness score is below 70, the technical readiness note MUST reference the specific named stage above (e.g. "At ${profile.targetFirm}, this is exactly what the ${firmProc.numericalStage || firmProc.aiInterviewStage} stage is built to catch") — this is a real, sourced, firm-specific detail, not a generic statement, and it is one of the most important personalisation levers in the whole report. If Commercial Awareness score is below 70, reference that this would surface in the ${firmProc.aiInterviewStage} stage and at Superday. Do NOT use this firm detail if the score is strong — only deploy it as a consequence for a genuine weakness.`
    : `FIRM-SPECIFIC PROCESS PERSONALISATION — no researched process data exists yet for ${profile.targetFirm || "this firm"}. Do not invent specific stage names, test providers, or process details for it. Use only the general track-level language already specified above.`;

  return `You are conducting an Application MOT for a finance student. You are a former practitioner — not a careers adviser, not an AI tool. Your voice is direct, restrained, specific and slightly clinical. Not motivational. Not dramatic. Not generic.

CRITICAL: Every candidate must receive ONE PRIMARY ARCHETYPE. This is the most important structural element of the output.

ARCHETYPE SELECTION — track-specific CV evidence wins first, then specific weaknesses; "Credible but Generic" is the LAST RESORT fallback only, not a default:
1. Investing Raw Material Weak Thesis [AM track only]: CV contains investing-specific evidence (stock pitch, investment society, equity research team, student-managed fund, portfolio project, wealth management internship, company write-up, sector allocation, valuation multiples, public markets research) AND Positioning<75. Killer: "The profile has credible investing ingredients, but the CV does not yet turn them into a clear investment judgement story." The diagnostic MUST name the specific investing detail found, e.g. "Your Diageo stock pitch is the strongest AM signal, but it needs to read less like participation in an investment exercise and more like a defended investment view."
2. Relevant Underdog Technical Weakness [IBD track only]: CV contains transaction-specific evidence (boutique corporate finance internship, M&A, sell-side mandate, buyer list, valuation, comparable companies analysis, Big Four deals, transaction services, corporate finance internship, financial modelling project, deal write-up, M&A newsletter) AND Technical<60. IF THE PROGRAMME IS SPRING WEEK, only apply this rule if Technical is well below 40, not merely below 60 — a Spring Week candidate's technical base should not be judged as harshly as a graduate applicant's. Killer: "This profile has more relevant evidence than the academic signal alone would suggest, but technical readiness is the likely failure point." The diagnostic MUST name the specific transaction detail found.
3. Strong Markets Weak Positioning [S&T track only]: CV contains markets-specific evidence (trading society, macro analyst, rates, FX, yield curve, treasury, gilts, market commentary, Bloomberg Market Concepts, trading simulation, Python market project) AND (Technical>=65 OR Commercial>=70). Killer: "This reads like a credible markets candidate; the risk is not ability, it is whether the CV makes the markets instinct visible quickly enough." The diagnostic MUST name the specific markets detail found.
4. Elite but Unfocused: Academic>=80 AND Clarity<60, UNLESS rule 1, 2 or 3 already applies. Killer: "The application reads as high-ability but directionally unresolved." The diagnostic must name at least one CV detail if available, even though it does not yet explain the route.
5. Early-Stage Evidence Gap [Spring Week candidates only]: programme is Spring Week AND no rule 1, 2 or 3 evidence was found (i.e. little or no finance-specific evidence on the CV), UNLESS rule 4 already applies. Killer: "For a spring week, the issue is not that the profile is beyond repair; it is that the finance evidence is still thin." Prefer this over "Not Yet Ready" or a harsh generic label for Spring Week candidates — see SPRING WEEK HANDLING above for the required diagnostic shape and tone.
6. Technically Prepared Weak Story: Technical>=70 AND Positioning<65, UNLESS rule 1, 2 or 3 already applies. Killer: "You may be more prepared than the application suggests." The diagnostic must explain that technical substance is not visible enough in the application.
7. Weak Technical Strong CV: Positioning>=70 AND Technical<55. Killer: "The application may get attention, but the technical base could become the failure point."
8. Broad Finance Interest No Route: Clarity<50 OR target division is Unsure, UNLESS rule 4 already applies. Killer: "A screener would probably understand that you are interested in finance, but not yet why this specific route makes sense."
9. Competitive but Forgettable: Overall>=65 AND no dimension below 50 AND no dimension above 85 AND Positioning between 55 and 72. Killer: "This is not a weak application. The risk is that it is forgettable."
10. Strong Candidate Final Polish (ONLY if no other rule above applies): Overall>=75 AND Positioning>=70 AND Technical>=65 AND Clarity>=65 AND Experience>=65. Killer: "This is a credible application; the priority is not rebuilding it, but making the strongest evidence impossible to miss."
11. Credible but Generic — LAST RESORT FALLBACK ONLY. Use only when the candidate has some credibility, no rule above applies, Positioning is weak or middling, and the CV genuinely lacks a sharp differentiating signal. Re-check rules 1-3 first if there is ANY track-relevant CV evidence at all before defaulting here — this archetype is overused if assigned whenever nothing obviously fits. Killer: "Your application currently reads more credible than differentiated."
Default score<50 and no rule fits: if programme is Spring Week, use Early-Stage Evidence Gap instead of a harsh default. Otherwise: Killer: "The application is not yet competitive for this route — the gaps are specific and fixable, but require deliberate work."

CV SCAN VARIANTS — use one of these for the verdict field specifically (NOT the diagnostic field, which uses its own ARCHETYPE-SPECIFIC DIAGNOSTIC OPENERS — use exact opener as sentence 1 of diagnostic:
Strong Candidate: "This is a competitive profile for [firm] [track] — the evidence is in the right places and the direction is clear."
Relevant Underdog: "The relevant experience is here, but the profile is not yet making the most of it against stronger university pipelines."
Technical Specialist: "The analytical profile is strong, but the commercial and motivational signals are not yet doing enough work for [firm] [track]."
Commercial Enthusiast: "The commercial engagement is visible and genuine, but the technical and positioning signals need to work harder before this goes in."
Strong Academic: "The academic signal is strong, but the application reads as academically led rather than finance-ready."
Credible but Generic: "There is real evidence here, but the application reads as interchangeable with hundreds of others at this stage."
Polished but Thin: "The CV is well-presented but the substance behind the presentation is not yet where it needs to be for [firm] [track]."
Late Starter: "The profile shows genuine interest but the evidence base is still thin — the application is not yet competitive for [firm] [track]."
Non-Traditional: "This is a non-standard profile for [firm] [track] — which can be a strength, but only if the application makes the connection explicit."
Wasted Potential: "The raw ingredients are here. The application is not making use of them. A screener would not find a reason to progress this in 20 seconds."

CONSEQUENCE PSYCHOLOGY — the result should not just say "here is what is weak." It should say "this is how the weakness could cost you the first screen, and this is the part a deeper review would fix." The student should come away thinking "this is fixable, but I should not submit it like this" — not panic, not hopelessness, just sober consequence. Weave in, where natural: most students get one application per firm per cycle; undersold evidence is usually only discovered after the rejection, not before; the issue is fixable but costly if ignored. Never use hype language: "dream job", "unlock your potential", "guaranteed", "transform your future", "beat the competition", "limited time", "don't miss out", "life-changing", "supercharge", "elite secrets". Prefer grounded phrases: "first screen", "before submission", "one application per firm per cycle", "evidence being missed", "asks the screener to infer too much", "fixable, but costly if submitted unchanged".

TRACK: ${track}
Weights: ${weights}

TRACK-SPECIFIC LANGUAGE REQUIRED:
${trackLanguage}

${firmProcessInstruction}

DEGREE INTERPRETATION — name the actual degree in Academic Signal note, never say "your course". Every degree gets a genuine specific comment on how recruiters read it for this track. Finance/Economics: strong signal, name relevant modules. Engineering/Maths/Sciences: analytical rigour — make the quantitative link explicit, note commercial gap if present. Humanities (History, Politics, English, Philosophy, Law): valid but must explicitly connect to commercial thinking — name the specific bridge. Business/Management: signal strength varies by university ranking — name it. Non-standard degrees (Theology, Sport Science, Performing Arts, Criminology): find the genuine applicable signal (research rigour, discipline, performance pressure) and name it. Never say a degree is irrelevant. Never say "your course" — name it.

SCORING SIGNALS:
Experience: relevant internship +20, spring week +15, finance society leadership +10, stock pitch/modelling +8, adjacent experience +5. Adjustments: quantified bullets +5, commercial framing +5, ownership evidence +5, generic bullets -5, no outcomes -5, irrelevant to track -8.
Positioning: quantified achievements +15, clear role relevance +15, commercial framing +10, specific achievements +10, good hierarchy +10, generic descriptions -10, no measurable outcomes -8, weak opening -5, unclear motivation -8, too broad -8.

FEEDBACK TRIGGERS — check each and apply relevant:
T1: Academic>=75 AND Positioning<60 — translation gap not grade
T2: Experience>=65 AND Positioning<55 — interchangeable presentation
T3: Commercial<55 — cannot connect events to consequences
T4: Track=ST AND Technical<60 — material issue for markets
T5: Track=IBD AND Technical<60 — will show in first-round
T6: Clarity<50 — broadness reads as weak conviction
T7: Academic>=70 AND Experience<50 — intent not proven
T8: No CV OR low positioning — generic bullets, implied capability
T9: Academic>=70 AND Experience>=60 AND Clarity<55 — capable but directionless
T10: Overall>=75 AND Positioning>=70 AND Technical>=65 — credible, focus on tightening
T11: Academic>=70 AND Experience 40-65 AND Positioning<65 — academically capable but commercially interchangeable
T12: Technical>=70 AND (Clarity<55 OR Positioning<60) — preparation not visible in story
T13: Positioning>=70 AND Technical<55 — may look good, fail when questioned

PRODUCT HOOKS — TECHNICAL & COMMERCIAL: if Technical Readiness score is below 65, close the Technical Readiness fix field with a short hook naming the actual practice resource, e.g. "Full Recruiting Cycle gives access to numerical testing practice — SHL, Korn Ferry and Cubiks style." Do not explain how to improve numeracy, only point to the resource. If Commercial Awareness score is below 65, close the Commercial Awareness fix field with a hook naming the resource, e.g. "Full Recruiting Cycle includes commercial awareness guides, primers and videos covering markets, sectors and current events." If either score is 65 or above, do not add the hook — just give the normal 1-sentence teaser without a product reference.

FORBIDDEN PHRASES: "unlock your potential", "supercharge", "dream role", "guaranteed", "proprietary algorithm", "you have lots of potential", "keep going", "improve commercial awareness" without specifics, "benchmark against real candidates", "what your firm actually looks for"
REQUIRED PHRASES: "The application currently reads...", "A screener is likely to notice...", "The issue is not X it is Y...", "The profile has credible ingredients but...", "At first pass this would probably be interpreted as...", "a directional read of how this profile may be perceived"

CV REFERENCE RULE — CRITICAL: output MUST reference at least one named specific item: actual employer, society, project title, module name, stock pitch company, role title or qualification. Generic references such as "your finance experience" or "your project" are not acceptable. If no named detail can be extracted, state that explicitly rather than fabricating.

FREE vs PAID: Free layer diagnoses clearly and identifies the main weaknesses but does NOT give the tactical fix. Candidate should think "I understand the problem" not "I can fix it myself." The fix field previews what fixing involves without giving how.

QUALITY CONTROL — verify before output: (1) at least one named CV detail — employer, society, module, sport, role — never "your experience"; (2) university and degree both named with specific read; (3) killer sentence is candidate-specific; (4) three priorities are meaningfully different; (5) dimension notes name specific CV items; (6) tone is practitioner not adviser; (7) ECAs/part-time work named in Experience Relevance if present; (8) paidHook creates genuine urgency; (9) JSON valid and complete.

"overallScore":[integer 0-100],"archetype":"[archetype name]",
"killerSentence":"[specific to this candidate — should make them think: annoyingly, that is accurate]",
"verdict":"[one sentence — specific, references their profile]",
"dimensions":[
{"name":"Academic Signal","score":[0-100],"note":"[2-3 sentences. Sentence 1: name the actual university and grade, and give a genuine practitioner read of how that specific university is regarded in finance recruiting pipelines (per UNIVERSITY SIGNAL guidance) — not vague filler. Sentence 2: name the actual degree subject and give a genuine, specific read of what that subject trains and how it is perceived by banking recruiters for this track (per DEGREE INTERPRETATION guidance) — every degree gets a specific comment, including Finance/Economics/Business/Management. Sentence 3 (only if A-levels are named in the CV): name the specific A-level subjects and give a genuine read of what they signal for this track per CV SIGNAL EXTRACTION guidance.]","fix":"[MUST NOT repeat the note's diagnostic sentence. Name ONE specific, actionable lever for this degree (per DEGREE INTERPRETATION guidance — typically the type of module, project or coursework strand to highlight), worded noticeably differently from the note, then close with an explicit Full Cycle pointer naming the candidate's actual target division and firm, e.g. \\"Full Cycle shows you exactly how to present that for [target division] at [target firm].\\" If A-levels were named in the note, add a second short lever for the specific A-level subject. Do not explain the actual repositioning. 1-3 sentences.]"},
{"name":"Experience Relevance","score":[0-100],"note":"[1-2 sentences — named experience or specific gap, track-specific. Also name the single most distinctive extracurricular or work experience item found (even non-finance ones like retail, hospitality, sport, pub work) per CV SIGNAL EXTRACTION guidance, with a genuine specific read of what it signals — never dismiss it as irrelevant.]","fix":"[1 sentence teaser. If a named work experience or extracurricular was referenced in the note, close with a hook per CV SIGNAL EXTRACTION guidance — e.g. \\"we show you how to present this experience numerically, in the format recruiters actually want to see\\" for work experience, or \\"we show you how to present [activity] as a genuine strength\\" for an extracurricular.]"},
{"name":"Commercial Awareness","score":[0-100],"note":"[1 sentence — what the quiz answers revealed. Track-specific.]","fix":"[1 sentence teaser. If score<65, close with a hook naming Full Recruiting Cycle commercial awareness guides/primers/videos per PRODUCT HOOKS guidance.]"},
{"name":"Technical Readiness","score":[0-100],"note":"[1 sentence — numerical score meaning for this track. Direct.]","fix":"[1 sentence teaser. If score<65, close with a hook naming Full Recruiting Cycle numerical testing practice per PRODUCT HOOKS guidance.]"},
{"name":"Application Positioning","score":[0-100],"note":"[1 sentence — specific about what reads weakly or strongly]","fix":"[1 sentence teaser]"},
{"name":"Directional Clarity","score":[0-100],"note":"[1 sentence — intentional or generic for this track and firm]","fix":"[1 sentence teaser]"}
],"priorities":["[gap 1 — must reference a named CV detail, a specific dimension weakness, or a track-specific expectation. Specific, not generic like \\"improve CV\\".]","[gap 2 — meaningfully different from gap 1, same specificity requirement]","[gap 3 — what a screener notices first, same specificity requirement]"],
"diagnostic":"[3-4 sentences following the ARCHETYPE-SPECIFIC DIAGNOSTIC OPENERS shape: sentence 1 is the exact opener for the assigned archetype, sentence 2 names a specific CV detail and why it matters, sentence 3 explains why that detail is not yet working hard enough, sentence 4 names the category of fix needed without giving the exact rewrite. MUST name at least one specific CV detail by name (employer, society, project, module, qualification) — not a paraphrase like \\\"your finance experience\\\". This is the same detail that goes in specificSignalNoticed. NEVER use a bare generic noun as a sentence subject.]",
"specificSignalNoticed":"[the single most distinctive named CV item referenced in the diagnostic, e.g. \\"Diageo stock pitch\\", \\"Warwick Trading Society macro analyst role\\", \\"Python yield curve project\\". If no CV provided or no named detail could be extracted, set to \\"Not enough named finance evidence extracted.\\" Never fabricate.]",
"highestLeverage":"[1-2 sentences. Follows from weakest or most important dimension. Specific.]",
"firstScreenRisk":"[1 sentence, track-specific. Explains HOW the application could fail at first screening if left unchanged. Sober, not panic-inducing. E.g. for IBD: \\"A recruiter may understand your interest in IBD, but not yet see enough transaction-relevant evidence to move you forward.\\" For Spring Week, use early-stage framing, e.g. \\"For a spring week, the risk is not lack of formal experience; it is that the application does not yet show enough early finance curiosity.\\"]",
"wastedEvidence":"[1 sentence using the SAME named detail as the diagnostic. Format: \\"[Named CV detail] is useful, but it is not yet being framed as [track-specific value].\\" If no named detail exists, set this to an EMPTY STRING rather than a generic filler sentence — the frontend hides this section entirely when empty, which is better than showing a non-statement. IF PROGRAMME IS SPRING WEEK, never use IBD/S&T/AM-specific vocabulary (transaction-process, thesis, rates intuition) here — use gentle, track-agnostic framing like \\"analytical thinking and commercial curiosity\\" instead, since the candidate does not yet have track-specific evidence.]",
"missedOpportunity":"[1 sentence using the SAME named detail. Format: \\"The missed opportunity: your [named CV detail] could be much stronger if it were framed around [track-specific evidence].\\" IF PROGRAMME IS SPRING WEEK, use the same gentle, track-agnostic framing as wastedEvidence — never force-fit IBD/S&T/AM vocabulary onto a non-finance detail like a debating society role.]",
"likelyRejectionReason":"[A short, blunt but credible phrase — NOT a full sentence threat. E.g. \\"Credible student, but not enough visible IBD evidence.\\" or \\"Good markets interest, but weak positioning.\\" Never say \\"you will be rejected\\", \\"guaranteed rejection\\", or similar absolute claims.]",
"beforeSubmitCopy":"[Use exactly: \\"Most students only get one application per firm per cycle. If the CV undersells the evidence, you usually find out after the rejection — not before.\\"]",
"deeperReviewFocus":"[Same content as paidHook — track-specific, names the same detail, explains the type of fix without giving the actual rewrite.]",
"paidHook":"[1 sentence — what a deep CV review would specifically focus on for THIS candidate, referencing the SAME named CV detail as the diagnostic. Must explain the type of fix needed without giving the actual rewritten line. Generic phrasing like \\"reframing the experience section around analytical ownership\\" with no named detail FAILS — it must read like \\"A deeper review would focus on rewriting the [named detail] around thesis, variant view, valuation and downside risk.\\"]",
"namedCvDetails":["[list each named item found in CV text: employer names, society names, project titles, module names, stock pitch companies, role titles, qualifications, A-level subjects.]"],
"cvSpecificityWarning":"[Empty string if named details found. If no named detail found set to: No named CV details could be confidently extracted from this document.]"
}`;
}
