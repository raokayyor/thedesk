import test from 'node:test';import assert from 'node:assert/strict';
import {completeSentence,conversionFacts,reconcileCompetencies,freeConversionResult,validateRewrite,cvSkimEntries,cvOnlySkimNote,practitionerVerdict} from '../lib/result-conversion.mjs';
import {sequenceSchedule} from '../lib/result-emails.mjs';
const result={overallScore:54,breakdown:{ats:6,competency:11},weights:{competency:25},priorities:[{title:'A',description:'Keep first'},{title:'B',description:'Paid detail'},{title:'C',description:'Paid detail'}],competencies:Array.from({length:7},(_,i)=>({name:'C'+i,score:i?75:100,reason:'Paid reason'})),cvPreview:{original:'Researched twelve companies and presented the findings to an associate.',structure:'Paid template'}};
test('legacy competency bars reconcile to the saved total without changing the score',()=>{const data=reconcileCompetencies(result);assert.equal(Math.round(data.items.reduce((n,c)=>n+c.score,0)/700*25),11);assert.equal(result.overallScore,54);assert.equal(data.normalised,true);for(let total=0;total<=25;total++){const c=reconcileCompetencies({...result,breakdown:{competency:total},competencies:result.competencies.map((x,i)=>({...x,score:i?0:100}))});assert.equal(Math.round(c.items.reduce((n,x)=>n+x.score,0)/700*25),total);}});
test('free result withholds paid priority details, competency explanations and templates',()=>{const free=freeConversionResult(result);assert.equal(free.priorities[0].description,'Keep first');assert.equal(free.priorities[1].description,undefined);assert.equal(free.competencies[0].reason,undefined);assert.equal(free.cvPreview.structure,undefined);});
test('counts only identified additional lines, deduplicates missed topics and caps estimate',()=>{const original=result.cvPreview.original,other='Trained three colleagues on ordering procedures during busy services.';const data=conversionFacts(result,{missed:[{topic:'DCF'},{topic:'DCF'}]},original+'\n'+other,{repair:{bulletRepair:[{originalBullet:original},{originalBullet:other},{originalBullet:other}]}});assert.equal(data.otherLines.length,1);assert.equal(data.otherLines[0].start,'Trained three colleagues on ordering procedures');assert.deepEqual(data.missedTopics,['DCF']);assert.equal(data.remainingFixes,data.gapCount-1);assert.deepEqual(conversionFacts({...result,overallScore:98}).estimate,{low:100,high:100});});
test('rewrite rejects ungrounded facts and new numbers',()=>{assert.throws(()=>validateRewrite({line:'Trained 99 colleagues',factsUsed:['Trained 3 colleagues']},'Trained 3 colleagues','I helped them learn the till'));assert.throws(()=>validateRewrite({line:'Trained colleagues',factsUsed:['Invented fact']},'Trained 3 colleagues','I helped them learn the till'));assert.equal(validateRewrite({line:'Trained 3 colleagues on the till.',factsUsed:['Trained 3 colleagues','the till']},'Trained 3 colleagues','I helped them learn the till').line,'Trained 3 colleagues on the till.');});
test('email sequence is day two, day five and only a genuinely future seven-day reminder',()=>{const now=new Date('2026-11-13T10:00:00Z');const jobs=sequenceSchedule(now,{date:'2026-11-25'});assert.equal(jobs.find(j=>j.kind==='recap').at.toISOString(),'2026-11-15T10:00:00.000Z');assert.equal(jobs.find(j=>j.kind==='sample').at.toISOString(),'2026-11-18T10:00:00.000Z');assert.equal(jobs.find(j=>j.kind==='deadline').at.toISOString(),'2026-11-18T09:00:00.000Z');assert.equal(sequenceSchedule(now,{date:'2026-11-16'}).some(j=>j.kind==='deadline'),false);});

test('complete sentences replace ellipsis truncation',()=>{
 assert.equal(completeSentence('A complete finding. A second sentence that runs too long for this limit.',5),'A complete finding.');
 assert.equal(completeSentence('Your own contribution is unclear…',20),'Your own contribution is unclear.');
});
test('CV previews count report repairs, not unrelated criteria quotes',()=>{
 const other='Trained three colleagues on ordering procedures during busy services.';
 const data=conversionFacts({...result,applicationCriteria:[{points:1,quotes:['This extra quote is not a report repair at all.']}]},{},'',{repair:{bulletRepair:[{originalBullet:other},{originalBullet:other}]}});
 assert.equal(data.cvLineCount,1);assert.equal(data.otherLines.length,1);
});
test('v2 findings omit unavailable reasons and never expose paid rewrites',()=>{
 const original='Compared customer orders against the monthly sales ledger';
 const result={overallScore:58,breakdown:{competency:11},weakLines:[{original,issue:'No conclusion stated',severity:2},{original:'Recorded invoices in the shared team spreadsheet',issue:'Individual contribution unclear',severity:2}],competencies:[{name:'Leadership',score:23}],skimNote:'Your ledger comparison needs its conclusion.'};
 const facts=conversionFacts(result,{},original,{repair:{bulletRepair:[{originalBullet:original,exampleBullet:'SECRET PAID REPAIR'}]}});
 assert.equal(facts.skimLines.length,1);
 assert.equal(facts.competencyFindings[0].reason,'');
 assert.equal(facts.otherLines[0].issue,'Individual contribution unclear');
 assert.deepEqual(facts.atsTerms,{matched:[],missing:[]});
 assert.equal(JSON.stringify(facts).includes('SECRET PAID REPAIR'),false);
 assert.equal(conversionFacts({...result,skimNote:undefined}).skimNote,'');
});

test('skim uses ordered exact headings and bullets and rejects test-based notes',()=>{const cv='Experience\nCoffee House — Team Member\n- Opened the shop alone on weekdays.\n- Trained two colleagues.\nLVMH valuation project\n- Built a DCF model.\n- Did not confirm a valuation range.';const entries=cvSkimEntries(cv);assert.equal(entries.length,6);assert.deepEqual(entries.map(x=>x.text),cv.split('\n').slice(1));for(const e of entries)assert.ok(cv.includes(e.text));assert.equal(cvOnlySkimNote('Your quiz result is weak.'),'');assert.equal(cvOnlySkimNote('Your test scores hold you back.'),'');assert.equal(cvOnlySkimNote('Your project needs its conclusion.'),'Your project needs its conclusion.');});
test('praise-only verdict appends the actual top gap and uses supported strength evidence',()=>{const verdict=practitionerVerdict({deskSummary:'A strong profile.',applicationCriteria:[{points:3,quotes:['Trained two colleagues.']}],priorities:[{description:'The valuation project needs its conclusion.'}]});assert.doesNotMatch(verdict,/[“”"]/);assert.match(verdict,/What stops me shortlisting you is/);assert.match(verdict,/valuation project/);});
