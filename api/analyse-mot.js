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

    // ── Validation ───────────────────────────────────────────────────────────
    if (!isValidResult(result, false)) {
      console.log("VALIDATION FAIL - keys:", Object.keys(result||{}));
      return res.status(422).json({ success: false, source: "error", error: "INVALID_RESULT", message: "Assessment could not be completed. Please try again." });
    }

    // ── POST-PARSE REPAIR ──────────────────────────────────────────────────────

    // 1. Normalise band
    var validBands2 = ['Strong','Competitive','Borderline','Weak','Not yet ready'];
    if (!validBands2.includes(result.band)) {
      var sc2 = result.overallScore || 0;
      result.band = sc2>=85?'Strong':sc2>=70?'Competitive':sc2>=55?'Borderline':sc2>=40?'Weak':'Not yet ready';
    }

    // 2. Ensure priorityGaps always has exactly 4 with correct fields
    var namedD = result.namedCvDetails || [];
    var diagT = ((result.diagnostic||'')+(result.killerSentence||'')+ namedD.join(' ')).toLowerCase();
    var dims4 = result.dimensions || [];
    var pgOk = Array.isArray(result.priorityGaps) && result.priorityGaps.length === 4
            && result.priorityGaps.every(function(g){ return g && g.title; });
    if (!pgOk) {
      var techD = dims4.find(function(d){ return d.name==='Technical Readiness'; }) || {};
      var commD = dims4.find(function(d){ return d.name==='Commercial Awareness'; }) || {};
      var pris2 = result.priorities || [];
      result.priorityGaps = [
        { title: pris2[0] || 'Application positioning needs work',
          visibleRisk: 'The CV is not yet translating evidence into a clear first-screen story.',
          lockedWhyItMatters: 'Screeners spend under 30 seconds on first pass.',
          lockedFixType: 'Reframe around the target route using the strongest named evidence.',
          lockedFullCycleTeaser: 'Full Cycle would rebuild the application story.' },
        { title: pris2[1] || 'Evidence present but under-framed',
          visibleRisk: 'The strongest CV signals are not landing clearly with a screener.',
          lockedWhyItMatters: 'Evidence buried in generic descriptions reads as participation, not ownership.',
          lockedFixType: 'Surface the strongest signals and reframe around outcomes.',
          lockedFullCycleTeaser: 'Full Cycle would identify what to lead with.' },
        { title: 'Technical readiness'+(( techD.score||50) < 70?' — below screening threshold':' — maintain under pressure'),
          visibleRisk: 'Technical score of '+Math.round(techD.score||50)+'/100 '+(( techD.score||50) < 70?'is a screening risk at this firm.':'must hold under real timed conditions.'),
          lockedWhyItMatters: 'Most tier-1 banks use automated numerical screening before a human reads the application.',
          lockedFixType: 'Targeted timed numerical practice on the specific question types used at this firm.',
          lockedFullCycleTeaser: 'Full Cycle gives you unlimited timed SHL, Korn Ferry and Cubiks practice.' },
        { title: 'Commercial awareness — connecting events to deal consequences',
          visibleRisk: 'Commercial score of '+Math.round(commD.score||50)+'/100 suggests market awareness at headline level with a gap in deal-consequence reasoning.',
          lockedWhyItMatters: 'Interviewers test whether you can connect a macro event to deal flow.',
          lockedFixType: 'Build a framework for connecting current events to the target sectors.',
          lockedFullCycleTeaser: 'Full Cycle includes weekly market briefings and commercial awareness primers.' }
      ];
      console.log('REPAIR: rebuilt priorityGaps');
    }
    // Migrate old field names to new ones
    result.priorityGaps.forEach(function(g){
      if (!g.visibleRisk && g.risk) g.visibleRisk = g.risk;
      if (!g.lockedWhyItMatters && g.whyItMatters) g.lockedWhyItMatters = g.whyItMatters;
      if (!g.lockedFixType && g.fixType) g.lockedFixType = g.fixType;
      if (!g.lockedFullCycleTeaser && g.fullCycleTeaser) g.lockedFullCycleTeaser = g.fullCycleTeaser;
    });

    // 3. Migrate dimension notes to visibleSummary/lockedDetail
    dims4.forEach(function(d){
      if (d.note && !d.visibleSummary) {
        var sentences = d.note.split(/\.\s+/);
        d.visibleSummary = sentences[0] + '.';
        d.lockedDetail = sentences.slice(1).join('. ');
        if (!d.lockedDetail) d.lockedDetail = d.note;
      }
    });

    // 4. Repair competencies
    var allComp = Array.isArray(result.competencies) && result.competencies.length === 6;
    if (allComp) {
      var allNotEv = result.competencies.every(function(c){ return c.status === 'Not yet evidenced'; });
      result.competencies.forEach(function(c){
        // Migrate old fields
        if (!c.visibleReason && c.note) c.visibleReason = c.note;
        if (!c.lockedImprovement) c.lockedImprovement = 'Full Cycle shows how to strengthen and position this competency for the target route.';

        if (allNotEv) {
          if (c.name === 'Analytical' && (( diagT.indexOf('dissert')>-1)||( diagT.indexOf('research')>-1)||( diagT.indexOf('model')>-1)||( diagT.indexOf('quant')>-1)||( diagT.indexOf('python')>-1)||( diagT.indexOf('valuat')>-1)||( diagT.indexOf('analy')>-1))) {
            c.status = 'Partially evidenced';
            c.visibleReason = 'Research or technical work shows analytical potential, but not yet finance-specific analysis.';
          }
          if (c.name === 'Communication' && (( diagT.indexOf('dissert')>-1)||( diagT.indexOf('essay')>-1)||( diagT.indexOf('history')>-1)||( diagT.indexOf('waiter')>-1)||( diagT.indexOf('customer')>-1)||( diagT.indexOf('society')>-1))) {
            c.status = 'Partially evidenced';
            c.visibleReason = 'Written and customer-facing experience suggests communication ability, but not yet as a deliberate signal.';
          }
          if (c.name === 'Resilience' && (( diagT.indexOf('waiter')>-1)||( diagT.indexOf('barista')>-1)||( diagT.indexOf('tesco')>-1)||( diagT.indexOf('retail')>-1)||( diagT.indexOf('part-time')>-1)||( diagT.indexOf('part time')>-1)||( diagT.indexOf('hrs')>-1))) {
            c.status = 'Partially evidenced';
            c.visibleReason = 'Sustained work alongside study shows reliability under pressure, though not yet a finance signal.';
          }
          if (c.name === 'Teamwork' && (( diagT.indexOf('society')>-1)||( diagT.indexOf('team')>-1)||( diagT.indexOf('waiter')>-1)||( diagT.indexOf('group')>-1)||( diagT.indexOf('intern')>-1))) {
            c.status = 'Partially evidenced';
            c.visibleReason = 'Work and activity context shows some team exposure, but not yet a named collaborative signal.';
          }
          if (c.name === 'Leadership' && (( diagT.indexOf('president')>-1)||( diagT.indexOf('captain')>-1)||( diagT.indexOf('committee')>-1)||( diagT.indexOf('chair')>-1)||( diagT.indexOf('head')>-1))) {
            c.status = 'Evidenced';
            c.visibleReason = 'Leadership role present. Needs named outcomes to land clearly.';
          }
        }
      });
    } else {
      result.competencies = [
        {name:'Leadership',status:'Not yet evidenced',visibleReason:'No clear ownership or committee role is visible yet.',lockedImprovement:'Full Cycle identifies whether existing experience can show ownership, or whether new evidence is needed.'},
        {name:'Analytical',status:(diagT.indexOf('dissert')>-1||diagT.indexOf('model')>-1||diagT.indexOf('quant')>-1)?'Partially evidenced':'Not yet evidenced',visibleReason:'Research or technical work shows potential but not yet finance-specific analysis.',lockedImprovement:'Full Cycle shows how to position this without overstating it.'},
        {name:'Commercial',status:'Not yet evidenced',visibleReason:'Interest in finance is visible but active commercial reasoning is not yet evidenced.',lockedImprovement:'Full Cycle identifies what commercial evidence to build before applying.'},
        {name:'Communication',status:'Partially evidenced',visibleReason:'Written and customer-facing experience suggests communication ability.',lockedImprovement:'Full Cycle shows how to translate this into application evidence.'},
        {name:'Resilience',status:(diagT.indexOf('waiter')>-1||diagT.indexOf('barista')>-1||diagT.indexOf('retail')>-1||diagT.indexOf('part')>-1)?'Partially evidenced':'Not yet evidenced',visibleReason:'Work experience shows reliability, but not yet positioned as a finance signal.',lockedImprovement:'Full Cycle shows where this supports the application.'},
        {name:'Teamwork',status:'Partially evidenced',visibleReason:'Work and activity context shows team exposure, but not yet a named signal.',lockedImprovement:'Full Cycle identifies whether this is enough or whether a stronger example is needed.'}
      ];
      console.log('REPAIR: rebuilt competencies from scratch');
    }

    // 5. Ensure new narrative fields have fallback values
    var top2 = namedD[0] || 'key experience';
    if (!result.recruiterMayMiss) result.recruiterMayMiss = 'The strongest signal in this CV is '+top2+', but it may currently read as participation rather than evidence of judgement.';
    if (!result.beingMisreadAs) result.beingMisreadAs = 'You are being read as interested in this route, but not yet ready for it.';
    if (!result.uncomfortableTruth) result.uncomfortableTruth = 'The problem is not the quality of the experience. It is that the application makes the recruiter work too hard to find the right signals.';
    if (!result.fullCycleFirstFix) result.fullCycleFirstFix = 'Full Cycle would start by rebuilding the application around '+top2+'.';
    if (!result.lockedFixPreview) result.lockedFixPreview = 'Locked in Full Cycle: the rewritten evidence hierarchy, the stronger version of the lead CV bullets, and the route-specific application story.';
    if (!result.fullCycleCta) {
      var sc3 = result.overallScore || 0;
      result.fullCycleCta = sc3>=70?'You have real evidence. Full Cycle shows how to turn it into a cleaner first-screen application before the firm sees it.'
        :sc3>=55?'You have usable material. Full Cycle shows how to rebuild the application around the evidence that matters.'
        :sc3>=40?'Do not submit this version yet. Full Cycle shows what evidence, numerical readiness and commercial proof need rebuilding before applying.'
        :'This version is not ready to submit. Full Cycle shows what needs to be rebuilt before targeting competitive finance roles.';
    }

    // ── SANITISE FREE FIELDS — strip repair language before sending ──────────────

    // These fields appear on the FREE page. They must NEVER contain:
    // - specific reframing concepts (rates, FX, yield curve, capital allocation etc)
    // - "how to rewrite", "how to reframe", "how to build", "how to position"
    // - named repair steps or strategy
    // Instead: diagnose the gap, withhold the fix, point to Full Cycle

    var FORBIDDEN_REPAIR_PHRASES = [
      /how to rewrite/gi, /how to reframe/gi, /how to rebuild/gi,
      /how to position/gi, /how to build/gi, /how to turn/gi,
      /how to clarify/gi, /how to demonstrate/gi, /how to present/gi,
      /reframe.{0,30}around/gi, /rebuild.{0,30}around/gi,
      /turn.{0,50}into evidence/gi, /position.{0,50}as evidence/gi,
      /analytical ownership/gi, /deal rationale/gi, /market instinct/gi,
      /yield curve/gi, /central bank positioning/gi, /rates direction/gi,
      /capital allocation/gi, /thesis defence/gi, /downside protection/gi,
      /client flow reasoning/gi, /rates intuition/gi,
      /the fix is to/gi, /to identify or create/gi, /a valuation exercise/gi,
      /a deal write.up/gi, /before submission\./gi, /before applying\./gi
    ];

    function sanitiseFreeField(text) {
      if (!text) return text;
      var clean = text;
      FORBIDDEN_REPAIR_PHRASES.forEach(function(pattern) {
        if (pattern.test(clean)) {
          console.log('SANITISE: removed repair language from free field:', pattern.toString());
        }
      });
      // If any forbidden phrase detected, replace entire field with safe template
      var hasForbidden = FORBIDDEN_REPAIR_PHRASES.some(function(p) { return p.test(text); });
      return hasForbidden ? null : text; // null = use template fallback
    }

    // Sanitise and apply template for fullCycleCta
    var ctaSanitised = sanitiseFreeField(result.fullCycleCta);
    var sc4 = result.overallScore || 0;
    var firmName = (result.targetFirm || '').trim();
    var routeName = (result.targetDivision || result.track || '').trim();
    var safeCtaFirm = firmName || 'your target firm';
    result.fullCycleCta = ctaSanitised || (
      sc4 >= 70
        ? 'You have real evidence, but it is not yet sharp enough for '+safeCtaFirm+'. Full Cycle shows what to lead with, what to reduce, and how to rebuild the profile before submission.'
        : sc4 >= 55
        ? 'You have usable material, but it is not yet landing as a '+safeCtaFirm+' application. Full Cycle shows what to lead with, what to cut, and how to rebuild the profile around the evidence that matters.'
        : sc4 >= 40
        ? 'This profile needs work before submitting to competitive finance roles. Full Cycle shows what evidence, readiness and structure need to be in place first.'
        : 'This version is not ready to submit. Full Cycle shows what evidence needs building, which gaps matter first, and whether the current route is realistic before you apply.'
    );

    // Sanitise diagnostic — strip any fix/solution language at the end
    if (result.diagnostic) {
      var diagSentences = result.diagnostic.split(/\.\s+/);
      var cleanDiag = [];
      var hitRepair = false;
      diagSentences.forEach(function(s) {
        if (!hitRepair && /the fix is|to identify|to create|to build|to reframe|a valuation|a deal write|before submission|before applying|needs to become|should become/i.test(s)) {
          hitRepair = true;
        }
        if (!hitRepair) cleanDiag.push(s);
      });
      if (hitRepair) {
        var base = cleanDiag.join('. ') + (cleanDiag.length ? '.' : '');
        result.diagnostic = base + ' The application needs a clearer bridge between academic research, commercial finance intent and readiness for this route. The detailed rebuild work belongs in Full Cycle.';
        console.log('SANITISE: stripped repair language from diagnostic, added bridge sentence');
      }
    }

    // Sanitise fullCycleFirstFix — if it reveals strategy, replace with safe version
    var fixSanitised = sanitiseFreeField(result.fullCycleFirstFix);
    var topEvidence = (result.namedCvDetails || [])[0] || 'your strongest CV evidence';
    result.fullCycleFirstFix = fixSanitised || (topEvidence+' is your starting point. Full Cycle shows what to do with it before you submit.');

    // Sanitise lockedFixPreview — this one CAN have more detail but still no exact reframing
    // Keep it as-is since it's already blurred on the page

    // ── END REPAIR ──────────────────────────────────────────────────────────────

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
    max_tokens: 8000,
    temperature: 0.2,
    system: "You are a former senior practitioner at an investment bank conducting The Desk Application MOT. Be direct, honest, specific and practitioner-voiced. Respond ONLY with valid JSON — no markdown, no preamble, no explanation.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content?.[0]?.text || "";
  const first = text.indexOf("{"), last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new SyntaxError("No JSON in response");
  return JSON.parse(text.slice(first, last + 1));
}

// ── Result validation ─────────────────────────────────────────────────────────
function isValidResult(result, cvRequired) {
  if (!result || typeof result !== "object")   { console.log("FAIL: not object"); return false; }
  if (typeof result.overallScore !== "number") { console.log("FAIL: no score"); return false; }
  if (!result.band)          { console.log("FAIL: no band"); return false; }
  if (!result.archetype)     { console.log("FAIL: no archetype"); return false; }
  if (!result.killerSentence){ console.log("FAIL: no killerSentence"); return false; }
  if (!Array.isArray(result.dimensions) || result.dimensions.length < 4) { console.log("FAIL: dims", result.dimensions?.length); return false; }
  // Accept both old priorities array and new priorityGaps array
  var hasPriorities = (Array.isArray(result.priorities) && result.priorities.length >= 1)
                   || (Array.isArray(result.priorityGaps) && result.priorityGaps.length >= 1);
  if (!hasPriorities) { console.log("FAIL: no priorities or priorityGaps"); return false; }
  if (!result.diagnostic)    { console.log("FAIL: no diagnostic"); return false; }
  // Warnings only — don't fail on missing new fields
  if (!result.recruiterMayMiss)   console.log("WARN: no recruiterMayMiss");
  if (!result.uncomfortableTruth) console.log("WARN: no uncomfortableTruth");
  if (!result.fullCycleFirstFix)  console.log("WARN: no fullCycleFirstFix");
  if (!result.paidHook)           console.log("WARN: no paidHook");
  console.log("PASS: score", result.overallScore);
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

CV SCAN VARIANTS — use one of these for the verdict field specifically (NOT the diagnostic field, which uses its own ARCHETYPE-SPECIFIC DIAGNOSTIC OPENERS below):
If strong academics AND low commercial evidence: "Your profile currently reads as academically capable but commercially under-evidenced."
If finance experience AND generic presentation: "Your CV has relevant raw material, but the evidence is not yet being made to work hard enough."
If technical strength AND weak positioning: "Your technical profile may be stronger than the CV currently suggests."
If low directional clarity: "Your application currently reads as capable but directionally broad."
If high experience AND unknown technical: "Your experience creates credibility, but technical readiness may become the pressure point."
If no strong finance evidence: "Your application currently needs more role-specific evidence before it will feel competitive."
Default: "Your profile has credible signals, but the strongest evidence still needs to be made easier to see."

CANDIDATE DATA:
University: ${profile.university || "Not provided"} | Course: ${profile.course || "Not provided"} | Year: ${profile.year || "Not provided"} | Grade: ${profile.grade || "Not provided"}
Target: ${profile.targetFirm || "Not provided"} | Division: ${profile.targetDivision || "Not provided"} | Programme: ${profile.programme || "Not provided"}
Commercial quiz: ${quiz.commercialCorrect || 0}/${quiz.commercialTotal || 5} (${fPct}%) | Numerical: ${quiz.technicalCorrect || 0}/${quiz.technicalTotal || 5} (${nPct}%)

CV UPLOADED AND TEXT PROVIDED BELOW. You MUST reference at least one named item from it: actual employer name, society name, project title, module name, stock pitch company, role title, A-level subject, or qualification. Generic phrases such as "your finance experience", "your project", "your society" or "your CV" are NOT acceptable and fail quality control. This named reference MUST appear inside the diagnostic field or the highestLeverage field itself — it is NOT enough for it to only appear in the separate namedCvDetails list. Set namedCvDetails array with the named items you reference. Set specificSignalNoticed to the single most distinctive named item used in the diagnostic — the same detail, not a different one. If no named detail could be confidently extracted, set specificSignalNoticed to "Not enough named finance evidence extracted."

NEVER EXTRACT TARGET/PROGRAMME LINES AS EVIDENCE — lines in the CANDIDATE DATA or CV text that state the target firm, division or programme (e.g. "Target: Goldman Sachs Investment Banking Summer Internship", "Applying to: Citi Sales & Trading", "Lazard Spring Week") describe what the candidate is APPLYING FOR, not what they have DONE. These can inform which track/firm to discuss, but must never be used as specificSignalNoticed, in namedCvDetails, or as evidence in the diagnostic or paidHook. If the only "evidence" available is the stated target programme itself, treat that as no named evidence and use the "Not enough named finance evidence extracted." fallback instead of fabricating evidence from the target line.

NEVER EXTRACT NEGATIVE PHRASES AS POSITIVE EVIDENCE — the CV may contain honest negative statements such as "no finance society role", "no internship", "without finance experience", "limited finance exposure", or "no formal finance experience". These describe an ABSENCE, not evidence, and must never become specificSignalNoticed, a namedCvDetails entry, or be referenced as if they were a positive signal (e.g. never produce something like "your no finance internship" or "finance society role no internship"). If a candidate phrase contains a negation word (no, none, without, lack, lacking, limited, minimal, absent, missing, not yet, little), reject it and search for a genuine alternative signal instead — including non-finance signals such as debating society, charity volunteering, retail or hospitality work, sports leadership, or a course project, which are legitimate to use carefully (see HONEST EVIDENCE HANDLING below). If no genuine signal exists at all, use "Not enough named finance evidence extracted." rather than inventing or repurposing a negative statement.

HONEST EVIDENCE HANDLING — if the CV genuinely shows little or no finance-specific evidence, do not invent any. Say so plainly: "Not enough named finance evidence extracted." or "The CV does not yet show a strong named finance signal." If non-finance evidence exists (debating society, charity volunteering, retail work, sports leadership, course projects), it is legitimate to name it specifically and discuss what it does and does not yet demonstrate — e.g. "The debating society role gives some evidence of communication and structured argument, but it does not yet create a finance-specific case." This is honest personalisation; inventing finance evidence that is not in the CV is not.

PROJECT EXTRACTION SPECIFICITY — when a project, pitch or course is named, capture the FULL descriptive phrase, not a collapsed generic version. "Python project modelling energy price sensitivity" not "Python project". "Python yield curve project" not "project". "Diageo stock pitch" not "stock pitch". Look for the complete phrase including what the project models, analyses, or covers (modelling X, on X, covering X, analysing X) before falling back to a shorter form, and only use the short form as a last resort if no fuller phrase exists anywhere in the CV.

SPRING WEEK HANDLING — if the programme field contains "Spring Week" (or similar early-stage programme), the candidate should NOT be judged like a final-year graduate or summer-internship applicant. The absence of a formal internship or finance society role is normal at this stage, not a failure. Do not default to "Relevant Underdog, Technical Weakness" for a Spring Week candidate unless they have genuine, specific finance evidence and a clearly poor technical score — for Spring Week, only assign that archetype if technical readiness is very poor (well below 40), not merely below 60. If a Spring Week candidate has little or no finance-specific evidence, prefer the archetype "Early-Stage Evidence Gap" over "Not Yet Ready" or a harsh generic label. Use early-stage, honest-but-not-brutal language: "This is an early-stage profile with too little finance evidence yet. That is normal for a spring week applicant, but the application still needs a clearer reason for the route." rather than "This profile is weak and technically unprepared." Never imply the candidate has failed a graduate-level screen.

ARCHETYPE: Early-Stage Evidence Gap [use for Spring Week candidates with little or no finance-specific evidence] — Killer: "For a spring week, the issue is not that the profile is beyond repair; it is that the finance evidence is still thin." Diagnostic shape (3 sentences, no separate why-sentence): opener, then "The [degree] background and [named non-finance detail, if any] can work, but only if the application makes the analytical and commercial link explicit.", then "The fix is to build a clearer bridge between academic strengths, commercial curiosity and the target route." The paidHook for this archetype must use gentle, track-agnostic language regardless of the target division — e.g. "A deeper review would focus on building an explicit bridge between the [named detail] and a specific finance route, even at this early stage." Never apply IBD/S&T/AM-specific vocabulary (transaction-process, thesis, rates intuition, etc.) to this archetype, since the candidate does not yet have track-specific evidence to support that framing.

NAMED DETAIL SPECIFICITY — always prefer the fuller, more specific phrase over a bare generic noun. "Diageo stock pitch" not "stock pitch". "Warwick Trading Society macro analyst role" not "trading society". "Python yield curve project" not "rates" or "project". "boutique corporate finance internship" not "internship". A bare generic noun (rates, FX, markets, valuation, stock pitch, trading society, finance society, project, internship, experience, CV, background) must NEVER be the subject of a sentence or the value of specificSignalNoticed — these read as broken and unconvincing, e.g. "Your rates is relevant" is a severe quality failure. If the CV only supports a generic term with no company, society, or project name attached, do not invent one — fall back to "Not enough named finance evidence extracted." rather than displaying the bare generic term.

PREFERRED SIGNAL RANKING — when multiple named details exist on the CV, choose specificSignalNoticed using this priority order for the candidate's track:
IBD: 1) boutique corporate finance internship 2) M&A/transaction/valuation experience 3) comparable companies analysis 4) financial modelling course 5) finance society role 6) retail/customer role only if nothing else exists.
S&T: 1) trading society macro analyst role 2) Python yield curve project 3) bank markets insight event 4) rates/FX/macro project 5) engineering/quantitative project 6) general finance society.
AM: 1) named stock pitch (e.g. Diageo stock pitch) 2) student-managed fund 3) investment society research role 4) wealth management internship 5) company write-up/sector report 6) finance society.
Research: 1) sector report/company write-up 2) equity research role 3) stock pitch 4) written analytical project 5) investment society research.
Unsure/General: 1) highest-status named signal 2) most finance-relevant evidence 3) most analytical evidence 4) leadership role 5) work experience.
Spring Week: 1) academic signal 2) finance/investment society if present 3) debating/analytical society 4) commercial curiosity evidence 5) customer-facing work 6) volunteering/leadership.
Capture full project phrases (8-12 words around project/modelling/model/pitch/write-up/analysis/valuation/yield curve/sensitivity/M&A/research/report) rather than truncating — e.g. "Python project modelling energy price sensitivity" not "Python project model".

ARCHETYPE-SPECIFIC DIAGNOSTIC OPENERS — open the diagnostic with the sentence matching the assigned archetype, then connect it to the named detail:
Credible but Generic: "The profile is credible, but the route-specific argument is still mostly implied."
Strong Markets Candidate, Weak Positioning: "The markets evidence is present, but it needs to become visible in the first scan."
Investing Raw Material, Weak Thesis Framing: "The investing evidence is useful, but it needs to read more like judgement than participation."
Elite but Unfocused: "The profile signals ability before it signals direction."
Relevant Underdog, Technical Weakness: "The experience is doing useful work, but the technical base is the obvious risk."
Technically Prepared, Weak Story: "The substance may be stronger than the application currently suggests."
Weak Technical, Strong CV: "The application may get attention, but the technical base could become the failure point."
Broad Finance Interest, No Clear Route: "The application shows interest in finance, but not yet conviction for a specific route."
Competitive but Forgettable: "This is not a weak application. The risk is that it is forgettable."
Strong Candidate, Final Polish: "The core evidence is credible; the job now is to make the strongest signals impossible to miss."
Early-Stage Evidence Gap: "For a spring week, the issue is not that the profile is beyond repair; it is that the finance evidence is still thin."
After the opener, the diagnostic should follow this shape: sentence 2 names the CV detail and why it matters, sentence 3 explains why that detail is not yet working hard enough, sentence 4 names the category of fix needed without giving the exact rewrite. Example: "The investing ingredients are real, but the CV has not yet turned them into judgement. Your Diageo stock pitch is the strongest AM signal, but it needs to read less like participation in an exercise and more like a defended investment view. For AM, the question is not whether you are interested in markets; it is whether you can form and defend a view. The fix is to frame the pitch around thesis, valuation and downside risk."

PAID HOOK MUST USE TRACK-CORRECT LANGUAGE AND NAME THE SAME DETAIL — the paidHook must reference the SAME named detail as the diagnostic, AND use vocabulary appropriate to the candidate's actual track. Do not mix track language.
IBD paidHook language: transaction-process evidence, deal rationale, valuation readiness, technical interview gaps, buyer lists, sell-side process, comparable companies analysis, transaction relevance, analytical ownership, first-round interview risk. Example: "A deeper review would focus on turning the boutique corporate finance internship into transaction-process evidence, tightening valuation language, and identifying the technical gaps most likely to be tested."
AM paidHook language: investment thesis, variant view, valuation, downside risk, portfolio fit, investment judgement, earnings drivers, sector view. Example: "A deeper review would focus on rewriting the Diageo stock pitch around thesis, variant view, valuation and downside risk."
S&T paidHook language: market instinct, rates/FX/macro framing, risk/reward, market commentary, speed of reasoning, client flow awareness, trade rationale. Example: "A deeper review would focus on making the Python yield curve project read as evidence of rates intuition, market reasoning and risk/reward thinking."
Research paidHook language: company/sector view, evidence quality, written judgement.
General/Unsure paidHook language: route clarity, evidence selection, narrative focus.
CRITICAL: never use AM language (thesis, variant view, downside risk) for an IBD candidate, and never use IBD language (transaction-process, deal rationale) for an AM candidate. "Thesis, variant view, downside risk" for a boutique corporate finance internship is a severe quality failure — that internship needs transaction-process and valuation-readiness language instead.

GENERAL FINANCE / CONSULTING / AUDIT / TAX / RISK — if the track is General Finance (i.e. not IBD, S&T or AM), do not force IBD-style transaction language onto the diagnostic. Use broader language about commercial credibility, direction and route-specific evidence instead, and do not claim the assessment is a role-specific consulting, audit, tax or risk evaluation — it is a general application-readiness read.

CONSEQUENCE PSYCHOLOGY — the result should not just say "here is what is weak." It should say "this is how the weakness could cost you the first screen, and this is the part a deeper review would fix." The student should come away thinking "this is fixable, but I should not submit it like this" — not panic, not hopelessness, just sober consequence. Weave in, where natural: most students get one application per firm per cycle; undersold evidence is usually only discovered after the rejection, not before; the issue is fixable but costly if ignored. Never use hype language: "dream job", "unlock your potential", "guaranteed", "transform your future", "beat the competition", "limited time", "don't miss out", "life-changing", "supercharge", "elite secrets". Prefer grounded phrases: "first screen", "before submission", "one application per firm per cycle", "evidence being missed", "asks the screener to infer too much", "fixable, but costly if submitted unchanged".

TRACK: ${track}
Weights: ${weights}

TRACK-SPECIFIC LANGUAGE REQUIRED:
${trackLanguage}

${firmProcessInstruction}

DEGREE INTERPRETATION — the course named in CANDIDATE DATA is a signal, not just an academic input. Name the actual degree in the Academic Signal note (never say "your course"). EVERY degree — including Finance, Economics, Accounting, Business and Management Sciences — must get a genuine, specific comment on what that subject actually trains and how recruiters generally read it in the NOTE field. No degree gets "directly relevant, no further comment needed" as a free pass — even the most finance-aligned degrees are broad enough that recruiters want to know which strand the candidate leaned into, so there is always something specific to say. You must have a genuine, specific opinion on ANY degree named, even obscure or unlisted ones — never fall back to vague filler; reason about what the actual discipline trains and how a banking recruiter would plausibly read it.

CRITICAL — THE FIX FIELD MUST NOT REPEAT THE NOTE. The note diagnoses (what the degree signals and how recruiters read it). The fix must do something DIFFERENT: give ONE concrete, actionable LEVER specific to that degree — typically naming the TYPE of module, project, or coursework strand the candidate should highlight (e.g. for a generic Business/Management degree: "naming the specific modules — strategy, finance, operations or quantitative methods — that sat within the degree"; for Engineering: "naming the specific technical or quantitative modules and projects, not just the degree title"; for History: "naming the specific dissertation or research project that best demonstrates evidence-based argument-building"). This lever must be worded NOTICEABLY differently from the note's diagnostic sentence — reusing the same clause or sentence between note and fix is a severe quality failure. After the lever, close the fix with an explicit pointer to the paid product that names the candidate's ACTUAL target division and firm from CANDIDATE DATA, e.g. "Full Cycle shows you exactly how to present that for [target division] at [target firm]." Do not explain the actual repositioning itself — only name the lever and point to where the "how" gets answered. Use this logic, adapted to the actual degree named, with particular depth on UK business school degree titles since these are the most common among applicants:

UK BUSINESS SCHOOL DEGREES (treat each as a distinct, specific title — do not collapse them all into "Business"):
Accounting and Finance: the closest thing to a default finance degree recruiters see — directly relevant, but so common that the title alone does no differentiating work; modules and specialism need to be named.
Banking and Finance: reads as a deliberate signal of intent for IBD or markets specifically, which recruiters like, but can look narrow if no commercial breadth is shown alongside it.
Economics and Management (joint): reads as a stronger, more deliberate combination than Economics alone — recruiters will want to see whether the candidate leaned toward the analytical/econ side or the strategy/management side.
International Business: sounds relevant but vaguer than Finance or Accounting — recruiters will want to know which markets or regions and how deep the cross-border exposure actually was.
Business Analytics / Business Information Systems: increasingly well regarded as a genuine technical and data signal, but needs real evidence of coding or data work, not just the module title.
Marketing / Marketing Management: less obviously aligned to IBD or S&T, but ties well to consumer-sector coverage and client-facing roles if explicitly reframed as commercial and analytical rather than "soft".
Human Resource Management: one of the least directly aligned business degrees for traditional finance recruiting — the genuine angle is organisational and incentive-design thinking, but recruiters will not make that connection themselves.
Entrepreneurship: signals initiative and risk appetite, which can read well for buy-side or principal investing roles, but can also raise doubt about whether the real intent is to start a business rather than build a career in markets — motivation needs to be explicit.
Supply Chain Management / Operations Management: ties well to industrials, logistics and operational due diligence in private equity, but is niche and needs explicit translation for most other tracks.
Real Estate / Real Estate Finance: a strong, specific signal for real estate finance, REITs and structured property roles, but narrower outside that niche.
Actuarial Science: a very strong quantitative signal, often read as more rigorous than a generic finance degree — particularly well regarded for quant, risk and insurance-linked roles.

OTHER DEGREES:
Finance / Economics: directly relevant on paper, but recruiters will probe which modules were taken and how quantitative the candidate actually is — the degree title alone does not differentiate from hundreds of other Finance/Economics applicants.
Accounting: technically credible and well regarded, particularly for IBD and credit-related roles, but needs to be distinguished from a pure compliance/audit reading.
Business / Management / Management Sciences: reads as broadly relevant but is one of the most generic-sounding degree titles recruiters see — it needs a specific strand named (quantitative methods, strategy, operations, finance) or it risks reading as undifferentiated.
Engineering (Mechanical, Civil, Electrical, Chemical, etc.): structured problem-solving and quantitative modelling under constraints — ties to valuation mechanics, structuring and risk; recruiters generally respect the rigour but will not infer commercial motivation automatically, so it must be stated.
Computer Science / Data Science / Statistics: among the strongest non-finance signals available, especially for quant, structuring and increasingly AI-driven research roles — but needs evidence of real technical depth, not just the title.
Physics / Maths: hypothesis-driven, quantitative thinking — ties to structuring, quant-adjacent and risk roles; same caveat on stating commercial motivation explicitly.
Architecture: structured, technical design-under-constraint thinking — ties well to real estate and project/structured finance.
Medicine / Dentistry / Veterinary Science / Pharmacy: high rigour but signals a different career intent — recruiters will assume the genuine motivation is clinical, so the pivot to finance needs to be explained, not implied.
Geography: spatial and data reasoning, understanding of regional and resource trends — ties to natural resources, EM, real assets, ESG.
Environmental Science / Geology / Earth Science: ties directly and credibly to commodities, natural resources and ESG-driven investing.
Agriculture / Agricultural Science: ties to commodities and natural resources trading.
Politics / International Relations: policy and regulatory reasoning, geopolitical risk reading — ties to macro, country risk, rates.
History: long-form research and evidence-based argument-building — ties to building an investment or deal thesis.
Archaeology: similar research rigor and evidence-based reasoning to History.
Law: structured reasoning around obligation and risk — ties to deal structuring and contractual analysis.
Psychology: reading behaviour and incentives — ties to client coverage, sales, trading psychology.
Sociology / Anthropology / Social Policy: people- and systems-level analysis, transferable to behavioural, ESG or policy-driven angles, but needs more explicit translation than most degrees.
Criminology: structured analysis of risk and incentive structures — can tie to compliance, AML and risk roles if framed that way.
Urban Planning / Town Planning: ties to real estate and infrastructure finance.
Languages / Area Studies: cross-border fluency — ties to international coverage and EM desks.
Linguistics: structured, rule-based reasoning distinct from language fluency — ties to quant-adjacent and structured-reasoning roles if framed that way.
Biology / Life Sciences: hypothesis-driven analysis — ties to healthcare and biotech coverage.
Philosophy / Classics: structured logical reasoning — useful in case-based technical and fit interviews.
Theology / Religious Studies: structured, evidence-based argument and ethics-based reasoning — one of the more distant degrees, needs the most explicit translation of all.
English / Literature / Journalism / Media Studies: narrative construction, research under deadline, and communication — ties to client-facing, research and IR-adjacent roles.
Art / Design / Architecture (creative strand): visual and structured-constraint thinking, less obviously aligned, needs the most explicit translation of all degrees.
Music / Drama / Performing Arts: discipline and performance-under-pressure — genuinely transferable to client-facing and trading-floor environments if framed that way, though rarely is.
Sports Science: performance, data and pressure-management framing — ties to quant or performance-analytics-adjacent roles.
Education: communication and structured explanation skills — relevant to client-facing or training-heavy roles, though one of the harder degrees to position for traditional IBD/S&T.
For any degree not explicitly listed, infer the closest plausible transferable strength using the same logic and the same hook structure — reason genuinely about the discipline, do not default to a placeholder. Never state that a degree has no relevance to finance, and never say a degree needs "no reframing" — there is always something specific worth saying.

UNIVERSITY SIGNAL — name the actual university in the Academic Signal note and give a genuine, practitioner-voiced read of how that specific institution is generally regarded in UK finance recruiting pipelines. Use general knowledge of which universities banks recruit most heavily from as a calibration steer, not a rigid rule:
Oxford, Cambridge, LSE, Imperial, Warwick, UCL: typically core target schools with the deepest, most established pipelines into banking and asset management.
Durham, Bath, Bristol, Exeter, Nottingham, Manchester, Edinburgh, King's College London, and similar: strong non-core targets — solid representation and active recruiting, particularly for firms that cast a wider net or for technically rigorous degrees, but typically a less saturated direct pipeline than the core targets.
Other UK universities: generally a less established direct pipeline into the largest firms — the application needs to work harder on other signals (experience, positioning, technical readiness) to compensate.
This must read as a specific, genuine view — e.g. naming that the university is known for strong technical/engineering output, or has growing representation at certain firms — not a vague "this is a good university" filler. Never imply a university disqualifies a candidate; frame any gap as something other signals need to compensate for.

CV SIGNAL EXTRACTION — A-LEVELS, EXTRACURRICULARS, WORK EXPERIENCE: beyond the headline finance-relevant experience already covered by the CV DETAIL RULE, actively look for and comment on three further categories if present: (1) A-level subjects or equivalent pre-university qualifications, (2) extracurricular activities, sports, hobbies or society involvement, (3) any work experience, INCLUDING non-finance and service/manual roles such as retail, hospitality, bar or pub work, lifeguarding, tutoring, or sports coaching. Never dismiss a non-finance job as irrelevant — service and manual roles genuinely signal transferable qualities (handling pressure, working with the public, cash handling, multitasking under time pressure, reliability) that recruiters do value once positioned correctly. For each category found, give a genuine, SPECIFIC read of what that exact named item signals — not a generic platitude — then close with a brief HOOK pointing to the paid review, following the same structure as DEGREE INTERPRETATION: name the specific item, one clause on what it signals, then an explicit pointer such as "we show you how to present [item] as a genuine strength" for extracurriculars, or "we show you how to present this experience numerically, in the format recruiters actually want to see" for work experience. Do not explain the actual repositioning — only signal it exists and is teachable.
PLACEMENT — A-levels: if A-level subjects are named in the CV, add ONE additional sentence to the end of the Academic Signal note naming the specific subjects and giving a genuine read of what they signal for this track. Add a corresponding clause to the Academic Signal fix field naming the specific subject and the hook, e.g. "we show you how to present your Chemistry A-level as a relevant signal for this track."
PLACEMENT — extracurriculars and work experience: name the single most distinctive item found (the one a screener would notice first or find most memorable — do not list everything) as an additional sentence in the Experience Relevance note, with a genuine specific read of what it signals. Add a corresponding hook to the Experience Relevance fix field. If both a notable extracurricular and a notable piece of work experience exist, you may reference both, but keep each to one short clause.

SCORING: Each dimension 0-100. Apply track weights. Bands: 85-100=Strong, 70-84=Competitive, 55-69=Borderline, 40-54=Weak, below 40=Not yet ready. Lead with band then score.

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

QUALITY CONTROL — before finalising check:
1. Does output reference the selected track? If not, rewrite.
2. Does it mention at least one concrete signal from the CV or profile?
3. Is the killer sentence specific to this candidate, not generic?
4. Are the three gaps meaningfully different from each other?
5. Does the highest-leverage improvement follow from the weakest or most important dimension?
6. Does it sound like a practitioner, not a careers adviser?
7. Does the Academic Signal note name the actual university with a specific, genuine read of its recruiting pipeline standing — not "a good university" or similar filler? Does it name the actual degree with a specific, genuine read of how that subject is perceived for this track? If either is generic, rewrite.
8. Did you check the CV for A-level subjects, extracurriculars and work experience (including non-finance roles)? If any are present, does the Academic Signal note (A-levels) or Experience Relevance note (extracurriculars/work) name at least one specific item with a genuine read and a fix-field hook, per CV SIGNAL EXTRACTION guidance? If such items exist but were ignored, rewrite.
9. Does the diagnostic field (not just namedCvDetails) actually contain a named CV detail — an employer, society, project, module or qualification — by name? "Your finance experience" or "your project" inside the diagnostic FAILS this check. If it fails, rewrite the diagnostic to name the detail directly.
10. Did you check archetype rules 1, 2 and 3 (track-specific CV evidence) before settling on Credible but Generic? If the CV contains ANY track-relevant evidence at all and you assigned Credible but Generic anyway, go back and re-check whether a more specific archetype actually applies.
11. Does the paidHook reference the SAME named CV detail as the diagnostic, explaining the type of fix needed without giving the actual rewritten line? Generic paidHook text like "reframing the experience section around analytical ownership" with no named detail FAILS this check.
12. Would a student reading this think "annoyingly, that is accurate" rather than "this could describe anyone"? If the result feels swappable between candidates, rewrite it with more specific detail.
13. Does specificSignalNoticed, or any sentence in the diagnostic, use a bare generic noun (rates, FX, markets, valuation, stock pitch, trading society, finance society, project, internship) as the subject of a sentence, e.g. "Your rates is relevant"? This is a severe quality failure — if found, either expand it into the fuller named phrase actually present in the CV, or fall back to "Not enough named finance evidence extracted." Never display or use the bare generic term.
14. Did you open the diagnostic with the correct archetype-specific opener sentence per ARCHETYPE-SPECIFIC DIAGNOSTIC OPENERS, rather than the generic "Your CV has relevant raw material..." line? That line should not appear as a default opener.
15. Is specificSignalNoticed sourced from an actual experience/society/project line, NOT from a target/programme/applying-to line? If the only candidate text is something like "Target: Goldman Sachs Investment Banking Summer Internship", that is not evidence — use "Not enough named finance evidence extracted." instead.
16. Does specificSignalNoticed, namedCvDetails, or any sentence in the diagnostic or paidHook contain a negation word (no, none, without, lack, lacking, limited, minimal, absent, missing, not yet, little) attached to what should be positive evidence? If so, that phrase is describing an absence, not evidence — reject it and find a genuine alternative, or use the fallback phrase.
17. If the CV contains a project, pitch or course, is the FULLEST available phrase used (e.g. "Python project modelling energy price sensitivity" not "Python project")? Re-check the CV text for additional descriptive words before settling on a shorter form.
18. Does the paidHook use vocabulary that matches the candidate's actual track? An IBD paidHook using "thesis", "variant view" or "downside risk" is a severe quality failure — that is AM-only language. An AM paidHook should use that language. An S&T paidHook should use rates/FX/macro/risk language.
19. If the programme is Spring Week, is the tone early-stage and honest rather than graduate-level harsh? Spring Week candidates should not default to "Relevant Underdog, Technical Weakness" or "Not Yet Ready" unless they have very poor technical answers or already-strong finance evidence — prefer "Early-Stage Evidence Gap" when finance evidence is thin.
20. Does firstScreenRisk explain HOW the application could fail at first screen, in track-specific language, without panic or absolute claims ("you will be rejected")?
21. Do wastedEvidence and missedOpportunity both reference the SAME named detail as the diagnostic and specificSignalNoticed?
22. Is likelyRejectionReason a short, sober phrase rather than a full paragraph or an absolute claim?
23. Does the overall result avoid every forbidden hype phrase (dream job, unlock your potential, guaranteed, transform your future, beat the competition, limited time, don't miss out, life-changing, supercharge, elite secrets)?
24. For the Academic Signal dimension specifically: does the fix field repeat any sentence or clause from the note field? This is a severe quality failure — the note diagnoses, the fix must give a genuinely different, more specific actionable lever, then point to Full Cycle by name for the actual target division and firm. If the fix and note overlap, rewrite the fix from scratch.

CANDIDATE CV TEXT:
"""
${cvText}
"""

OUTPUT — respond ONLY with valid JSON, no markdown, no backticks, no preamble.

COMMERCIAL RULE: The free result shows diagnosis only. The repair plan is locked in Full Cycle.
- visibleSummary / visibleRisk / visibleReason = short, diagnostic, "what is wrong" only
- lockedDetail / lockedWhyItMatters / lockedFixType / lockedFullCycleTeaser / lockedImprovement = deeper analysis and repair direction — do NOT give these away in visible fields

QUALITY CHECKS before returning: (1) killer sentence names real CV evidence (2) namedCvDetails has 3-6 real items (3) exactly 4 priorityGaps (4) exactly 6 competencies (5) not all competencies "Not yet evidenced" unless CV has almost no content (6) Analytical must be at least Partially evidenced if dissertation/research/modelling/quant/coding/numerical 4+/5 exists (7) Communication must be at least Partially evidenced if essay degree/dissertation/customer-facing/society role exists (8) Resilience must be at least Partially evidenced if part-time work/demanding schedule/sport exists (9) visibleSummary is SHORT — one sentence max (10) lockedDetail contains the full analysis

{
"overallScore":[integer 0-100. Calibrate fairly — strong profiles with positioning issues should be 60-75, not below 50],
"band":"[MUST be exactly: Strong, Competitive, Borderline, Weak, or Not yet ready. 85+=Strong, 70-84=Competitive, 55-69=Borderline, 40-54=Weak, below 40=Not yet ready]",
"archetype":"[3-7 words. Clean, human, memorable. E.g.: Credible IBD Candidate Technical Risk | Strong Raw Material Weak Framing | Early-Stage Evidence Gap | Commercially Curious Not Yet Interview-Ready | Elite but Unfocused]",
"killerSentence":"[One sharp sentence: strongest named CV evidence + hidden risk + route consequence. Must name a real CV item. Must not give the repair.]",
"namedCvDetails":["[3-6 specific named items from this CV — employer names, project titles, society roles, module names. Do not invent.]"],
"recruiterMayMiss":"[2-4 sentences. What is the strongest hidden or underused signal and why may a recruiter miss it? Must name a CV item. Do NOT provide the rewrite. Creates the it-sees-me feeling.]",
"beingMisreadAs":"[1 sentence. How is this profile currently being misread? Specific and slightly uncomfortable. E.g.: You are being read as interested in IBD, not yet ready for IBD.]",
"uncomfortableTruth":"[1-2 sentences. Blunt but constructive. Band-specific. Do not give the fix.]",
"diagnostic":"[2-3 sentences. Diagnosis only — what is wrong, named CV details, route consequence. HARD STOP before any solution language. Do NOT write: the fix is, this needs to be reframed, Full Cycle would, the solution is, to repair this. End the sentence at the problem. Good: The internship and dashboard need to show market reasoning, not just task completion. Bad: The fix is to reframe the internship around central bank positioning and yield curve dynamics. The specific concepts and repair direction belong in lockedDetail — never in the free diagnostic.]",
"fullCycleFirstFix":"[Direction of first repair area — 1-2 sentences naming CV items. Do not give the actual rewrite or fix language.]",
"lockedFixPreview":"[What sits inside Full Cycle — creates curiosity. Must feel specific. Must NOT reveal the fix. E.g.: Locked in Full Cycle: the rewritten evidence hierarchy, the stronger version of the lead CV bullets, and the route-specific application story.]",
"dimensions":[
{"name":"Academic Signal","score":[0-100],
 "visibleSummary":"[One sentence. Diagnostic only. E.g.: Strong academic reasoning, but not yet translated into finance-relevant evidence.]",
 "lockedDetail":"[Full paragraph. Deeper analysis, named CV details, repair direction. This is locked in Full Cycle.]"},
{"name":"Experience Relevance","score":[0-100],
 "visibleSummary":"[One sentence. What the experience shows and what it currently fails to show.]",
 "lockedDetail":"[Full paragraph with repair direction. Locked in Full Cycle.]"},
{"name":"Commercial Awareness","score":[0-100],
 "visibleSummary":"[One sentence referencing quiz score and CV signals.]",
 "lockedDetail":"[Full commercial analysis and what Full Cycle would address. Locked.]"},
{"name":"Technical Readiness","score":[0-100],
 "visibleSummary":"[One sentence referencing numerical quiz score and what it means for HireVue.]",
 "lockedDetail":"[Full technical analysis and prep direction. Locked.]"},
{"name":"Application Positioning","score":[0-100],
 "visibleSummary":"[One sentence. What reads weakly or strongly on first screen.]",
 "lockedDetail":"[Full positioning analysis. Locked.]"},
{"name":"Directional Clarity","score":[0-100],
 "visibleSummary":"[One sentence. Intentional or generic for this route and firm.]",
 "lockedDetail":"[Full directional analysis and narrative repair. Locked.]"}
],
"priorityGaps":[
{"title":"[4-8 words]",
 "visibleRisk":"[One sentence. What the problem is — diagnosis only. No repair.]",
 "lockedWhyItMatters":"[Why this matters specifically for this route and firm. Locked.]",
 "lockedFixType":"[Type of repair needed. Locked.]",
 "lockedFullCycleTeaser":"[What Full Cycle does for this gap. Locked.]"},
{"title":"[gap 2]","visibleRisk":"","lockedWhyItMatters":"","lockedFixType":"","lockedFullCycleTeaser":""},
{"title":"[gap 3 — numerical readiness with actual score]","visibleRisk":"[Include actual score and screening risk]","lockedWhyItMatters":"","lockedFixType":"","lockedFullCycleTeaser":""},
{"title":"[gap 4 — commercial awareness with actual score]","visibleRisk":"[Include actual score and interview risk]","lockedWhyItMatters":"","lockedFixType":"","lockedFullCycleTeaser":""}
],
"competencies":[
{"name":"Leadership",
 "status":"[Strong|Evidenced|Partially evidenced|Not yet evidenced]",
 "visibleReason":"[One sentence. What is or is not evidenced. No repair language.]",
 "lockedImprovement":"[How Full Cycle would strengthen or position this competency. Locked.]"},
{"name":"Analytical","status":"[MUST be at least Partially evidenced if dissertation/research/modelling/quant/numerical 4+/5 exists]",
 "visibleReason":"[One sentence]","lockedImprovement":"[Locked]"},
{"name":"Commercial","status":"[Only Evidenced/Strong if active market reasoning, deal exposure, or investment research exists — not just interest]",
 "visibleReason":"[One sentence]","lockedImprovement":"[Locked]"},
{"name":"Communication","status":"[MUST be at least Partially evidenced if essay degree/dissertation/customer-facing/society/presentations exist]",
 "visibleReason":"[One sentence]","lockedImprovement":"[Locked]"},
{"name":"Resilience","status":"[MUST be at least Partially evidenced if part-time work/demanding schedule/competitive sport exists]",
 "visibleReason":"[One sentence]","lockedImprovement":"[Locked]"},
{"name":"Teamwork","status":"[MUST be at least Partially evidenced if internship/group project/society/hospitality/sport exists]",
 "visibleReason":"[One sentence]","lockedImprovement":"[Locked]"}
],
"fullCycleFit":"[High: score 50-75, credible material, specific fixable weaknesses. Medium: strong needing edge or weak with some material. Low: too weak for FC yet, or already very strong needing only polish]",
"fullCycleReason":"[1-2 sentences with named CV evidence. Locked direction, not free repair.]",
"fullCycleCta":"[Band-specific. Do NOT name specific reframing concepts. Strong/Competitive/Borderline: Use something like — You have real [route] evidence, but it is not yet sharp enough for [firm]. Full Cycle shows what to lead with, what to reduce, and how to rebuild the profile before submission. Weak: — You have some usable material, but not yet enough to submit to [firm]. Full Cycle shows what to build first and what to fix before applying. Not yet ready: — This version is not ready to submit. Full Cycle shows what evidence, readiness and structure need rebuilding before targeting competitive finance roles. Never say: do not submit yet to a Borderline or above candidate. For Borderline+ say: this is not yet sharp enough — not that it is not ready. Personalise with named CV items where possible but do NOT reveal the reframing direction.]", Weak: This version is not ready to submit. Full Cycle shows what evidence, numerical readiness and commercial proof need rebuilding before applying. Borderline: You have usable material, but it is not yet landing as a [firm] application. Full Cycle shows what to lead with, what to cut, and how to rebuild the profile before submission. Competitive: You have real evidence. Full Cycle shows how to turn it into a cleaner first-screen application before [firm] sees it. Strong: You are close. Full Cycle focuses on evidence hierarchy, firm-specific positioning and interview pressure points. Replace [firm] with the actual target firm. Use named CV items where possible. Do NOT say: upgrade now, unlock your potential, stand out from the crowd.]", Do not submit yet — Full Cycle shows what evidence, numerical readiness and commercial proof need rebuilding. Borderline: You have usable material. Full Cycle shows how to rebuild the application around the evidence that matters. Competitive: You have real evidence. Full Cycle shows how to turn it into a cleaner first-screen application. Strong: You are close. Full Cycle focuses on evidence hierarchy, firm-specific positioning and interview pressure points. Personalise with named CV evidence.]",
"candidateName":"[First name from CV if present, else empty string]",
"cvSpecificityWarning":"[Empty string if named details found. If no named detail: No named CV details could be confidently extracted from this document.]"
}`;
}