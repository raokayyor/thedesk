import assert from 'node:assert/strict';
import fs from 'node:fs';
import {withFirm,firmInfo,followUp,validateFollowUp,FIRMS,MODES,contextFromReport,buildQuestions,deliveryMetrics,quickCheck,validateQuestions,validateFeedback,analysePauses,confidenceAssessment} from '../interview-practice-core.mjs';
const report=JSON.parse(fs.readFileSync(new URL('../samples/amelia-report-v3-live.json',import.meta.url)));
const cv=JSON.parse(fs.readFileSync(new URL('../samples/amelia-input.json',import.meta.url))).cvText;
const ctx=contextFromReport(report,cv);
assert.equal(ctx.firm,'Barclays');
// Every mode gives 5 distinct, spoken questions with timings
for(const m of Object.keys(MODES)){
  const qs=buildQuestions(ctx,m);
  assert.equal(qs.length,5,m);
  assert.equal(new Set(qs.map(q=>q.text)).size,5,m+' distinct');
  assert(qs.every(q=>!/:$/.test(q.text)),'no multiple-choice stems');
  assert(qs.every(q=>q.answerSec===MODES[m].answerSec));
}
assert.equal(buildQuestions(ctx,'video')[0].prepSec,30);
// Works with an almost empty report too
assert.equal(buildQuestions(contextFromReport({profile:{targetFirm:'HSBC'}},''),'superday').length,5);
// Metrics and quick check
const good='At Redcliffe Partners I screened 12 UK software companies against an acquisition brief. First I built an Excel table of revenue and EBITDA. Then I flagged 4 companies because their recurring revenue matched the brief, and I presented my reasons to an associate. As a result two of them went to the next stage. What I learned is that the analysis only matters when you say what it means for the decision, so I now finish every piece of work with one sentence on the implication.';
const m=deliveryMetrics(good,70);
assert(m.words>70&&m.fillerTotal===0&&m.iCount>3);
const q=buildQuestions(ctx,'first').find(x=>x.type==='cv');
const r=quickCheck(q,good,m,ctx);
assert(r.usedCvDetails.includes('Redcliffe'));
assert(r.overall>=3,'specific structured answer scores at least Getting there');
const thin=quickCheck(q,'I did some research and it went well I think',deliveryMetrics('I did some research and it went well I think',12),ctx);
assert.equal(thin.band,'Needs work');
const umm=deliveryMetrics('um so um I er basically um did, like, the thing um you know',20);
assert(umm.fillerTotal>=6);
// Model question validation: grounded CV questions pass, invented ones fail
const base=[{type:'opening',text:'Walk me through your CV.',why:'x',lookFor:['a','b'],evidence:''},{type:'motivation',text:'Why Barclays?',why:'x',lookFor:['a','b'],evidence:''},{type:'competency',text:'Tell me about a time you led a team.',why:'x',lookFor:['a','b'],evidence:''},{type:'technical',text:'Walk me through a DCF.',why:'x',lookFor:['a','b'],evidence:''}];
assert.equal(validateQuestions({questions:[...base,{type:'cv',text:'Tell me about your acquisition screen.',why:'x',lookFor:['a','b'],evidence:'Researched 12 UK software companies for a prospective acquisition screen'}]},ctx,'first').length,5);
assert.throws(()=>validateQuestions({questions:[...base,{type:'cv',text:'Tell me about your Goldman internship.',why:'x',lookFor:['a','b'],evidence:'Goldman Sachs summer internship trading desk'}]},ctx,'first'),/grounded/);
// Feedback validation: invented numbers remove the stronger answer; accuracy only for technical/commercial
const fb=validateFeedback({scores:{relevance:4,structure:3,evidence:4,accuracy:5,convincing:3},convincingNote:'x',confidenceNote:'y',verdict:'Clear, specific answer.',strengths:['Named Redcliffe'],fixes:['Say what it implied'],strongerAnswer:'At Redcliffe I screened 12 companies and saved the client £2m.',checkTheseClaims:[]},ctx,{type:'cv',text:'Tell me about the screen',modelAnswer:''},good);
assert.equal(fb.strongerAnswer,'');
assert.equal(fb.scores.accuracy,null);
const fb2=validateFeedback({scores:{relevance:4,structure:4,evidence:3,accuracy:4,convincing:4},convincingNote:'x',confidenceNote:'y',verdict:'Good.',strengths:['x'],fixes:['y'],strongerAnswer:'At Redcliffe I screened 12 companies [confirm: what happened next?].',checkTheseClaims:[]},ctx,{type:'technical',text:'Why is debt cheaper?',modelAnswer:''},good);
assert(fb2.strongerAnswer.startsWith('At Redcliffe')&&fb2.scores.accuracy===4&&fb2.band==='Getting there');
assert.throws(()=>validateFeedback({scores:{relevance:7,structure:3,evidence:3,accuracy:null,convincing:3}},ctx,{type:'cv',text:'x'},good));
// v1.1 delivery: "like" as filler vs normal use, hedging, casual language, weak endings
assert.equal(deliveryMetrics('I would like to work in M&A because it looks like a good fit',20).fillers.like,undefined);
assert.equal(deliveryMetrics('It was like, really hard and I was like really stressed',20).fillers.like,2);
const unsure=deliveryMetrics('Yeah so I think I kind of helped and maybe it went well, I am not sure. So yeah.',30);
assert(unsure.hedgeTotal>=3&&unsure.informal.yeah&&unsure.weakEnding&&unsure.apologies===1);
assert.equal(confidenceAssessment(unsure).label,'Sounds unsure');
// Pauses from loudness samples (100ms frames): 2s before speaking, one 4s silence mid-answer
const lv=[...Array(20).fill(0.01),...Array(50).fill(0.2),...Array(40).fill(0.01),...Array(60).fill(0.2)];
const pa=analysePauses(lv,100);
assert.equal(pa.startDelaySec,2); assert.equal(pa.stalls,1); assert.equal(pa.longestPauseSec,4);
assert.equal(analysePauses(Array(50).fill(0.01)),null,'silence only gives no audio verdict');
assert(confidenceAssessment(deliveryMetrics('At Redcliffe I screened 12 companies and presented four targets to the associate.',20,pa)).minus.some(x=>/silence/.test(x)));
// v1.2: every question carries a short guide drawn from the candidate's own CV.
for (const m of Object.keys(MODES)) for (const q of buildQuestions(ctx,m)) { assert(q.guide && q.guide.approach && Array.isArray(q.guide.points), 'guide for '+q.type); assert(q.guide.points.length<=6,'guide stays brief'); }
const cvq=buildQuestions(ctx,'first').find(q=>q.type==='opening');
assert(cvq.guide.points.some(x=>/Bristol/.test(x)) && cvq.guide.points.some(x=>/Redcliffe/.test(x)),'CV walk-through guide uses the CV');
// v1.4: choose the firm; values questions quote the firm's own values; follow-ups push back on the answer.
const gs=withFirm(ctx,'goldman','Markets (Sales & Trading)');
assert.equal(gs.firm,'Goldman Sachs'); assert.equal(gs.division,'Markets (Sales & Trading)'); assert.equal(gs.whyFirmSkeleton,'','report skeleton is for another firm');
assert(buildQuestions(gs,'partner').some(q=>q.type==='values'&&/Partnership, Client Service, Integrity and Excellence/.test(q.text)));
assert(!buildQuestions(withFirm(ctx,'Lazard'),'partner').some(q=>q.type==='values'),'no values question without verified values');
assert.equal(firmInfo('Some Firm Ltd').name,'Some Firm Ltd'); assert(withFirm(ctx,'x'.repeat(500)).firm.length<=60);
for (const k of Object.keys(FIRMS)) assert(Array.isArray(FIRMS[k].values));
const motQ={type:'motivation',text:'Why Goldman Sachs?'};
assert(/rather than/.test(followUp(motQ,'Goldman Sachs is a great firm with a strong culture and I really like the training and the people I have met at events and online and that experience taught me a lot about how analysis supports a real decision for a client and how to explain the reasoning clearly to someone senior under time pressure',gs,()=>0).text));
const compQ={type:'competency',text:'Tell me about pressure.'};
assert(/12 UK software companies/.test(followUp(compQ,'I screened 12 UK software companies for the brief and then I presented the shortlist to the associate which led to two being taken forward and that experience taught me a lot about how analysis supports a real decision for a client and how to explain the reasoning clearly to someone senior under time pressure',gs,()=>0).text));
assert(/what exactly did you do yourself/i.test(followUp(compQ,'We built the model and we checked it and our team presented it and we got good feedback from the client which led to more work for us and that experience taught me a lot about how analysis supports a real decision for a client and how to explain the reasoning clearly to someone senior under time pressure',gs,()=>0).text));
const first=followUp(compQ,'short one',gs,()=>0).text; assert.notEqual(followUp(compQ,'short one',Object.assign({},gs,{usedFollowUps:[first]}),()=>0).text,first,'no repeats');
assert.throws(()=>validateFollowUp({text:'Not a question'})); assert.equal(validateFollowUp({text:'Why that multiple?'}).text,'Why that multiple?');
console.log('Interview practice checks passed: firm choice, values questions, push-back follow-ups, guides, questions for every mode, metrics, quick check, grounded model questions, safe feedback.');
