// Shared conversion facts. Estimates are indicative recheck ranges, never hiring odds.
const words=s=>String(s||'').trim().split(/\s+/).filter(Boolean);
export function completeSentence(text,max=48){
 const clean=String(text||'').replace(/…|\.{3}/g,'').trim();
 const sentences=clean.match(/.*?[.!?](?=\s+[A-Z]|$)/gs)||[];
 if(words(clean).length<=max)return clean?clean.replace(/[,:;—-]+$/,'').replace(/([^.!?])$/,'$1.'):'';
 let selected='';for(const sentence of sentences){if(selected&&words(selected+' '+sentence).length>max)break;selected+=(selected?' ':'')+sentence.trim();if(words(selected).length>=max)break;}
 return selected||clean.replace(/[,:;—-]+$/,'').replace(/([^.!?])$/,'$1.');
}
export function reconcileCompetencies(result){
 const list=(result.competencies||[]).map(c=>({name:c.name,score:Math.max(0,Math.min(100,Math.round(+c.score||0)))}));
 const max=+(result.weights?.competency||25),total=+result.breakdown?.competency;
 if(!list.length||!Number.isFinite(total))return {items:list,normalised:false};
 if(Math.round(list.reduce((n,c)=>n+c.score,0)/list.length/100*max)===total)return {items:list,normalised:false};
 const target=Math.round(Math.max(0,Math.min(max,total))/max*list.length*100),sum=list.reduce((n,c)=>n+c.score,0);
 let lo=-100,hi=100;for(let k=0;k<40;k++){const m=(lo+hi)/2;if(list.reduce((n,c)=>n+Math.max(0,Math.min(100,c.score+m)),0)<target)lo=m;else hi=m;}
 const scaled=list.map(c=>({...c,raw:Math.max(0,Math.min(100,c.score+hi))}));let left=target-scaled.reduce((n,c)=>n+Math.floor(c.raw),0);
 const order=scaled.map((c,i)=>({i,f:c.raw%1})).sort((a,b)=>b.f-a.f);
 const items=scaled.map(c=>({name:c.name,score:Math.floor(c.raw)}));for(const {i}of order){if(left<=0)break;if(items[i].score<100){items[i].score++;left--;}}
 return {items,normalised:true};
}
export function routeEstimate(result){
 const score=Math.max(0,Math.min(100,+result.overallScore||0));
 const existing=result.routeEstimate||result.estimate;
 if(existing&&Number.isFinite(existing.low)&&Number.isFinite(existing.high)&&existing.low>=score&&existing.high<=100)return {low:existing.low,high:existing.high};
 // Reuse the C route ranges: developing +8–14; stronger profiles +4–9, capped at 100.
 return {low:Math.min(100,score+(score<65?8:4)),high:Math.min(100,score+(score<65?14:9))};
}
export function conversionFacts(result,quiz={},cvText='',report={}){
 const weak=Array.isArray(result.weakLines)?result.weakLines:null;
 const primary=String(weak?(weak[0]?.original||''):(result.cvPreview?.original||''));
 const repairs=report?.repair?.bulletRepair;
 const candidates=weak?weak.map(w=>w.original):Array.isArray(repairs)?repairs.map(b=>b.originalBullet):[primary];
 const lines=[...new Set(candidates.filter(s=>typeof s==='string'&&words(s).length>0))];
 const other=(weak?weak.slice(1).map(w=>w.original):lines.filter(s=>s!==primary&&(!primary||!primary.includes(s)&&!s.includes(primary)))).map((s,i)=>({id:'line-'+(i+2),start:words(s.replace(/^\s*[-•]\s*/,'' )).slice(0,6).join(' '),tail:words(s.replace(/^\s*[-•]\s*/,'' )).slice(6).join(' ')}));
 const competency=reconcileCompetencies(result),competencyGaps=competency.items.filter(c=>c.score<70).length;
 const missed=[...new Set((quiz.missed||[]).map(m=>m.topic).filter(Boolean))];
 const priorityCount=(result.priorities||[]).length,atsGap=+(result.breakdown?.ats||0)<8?1:0;
 const gapCount=Math.max(1,priorityCount+(primary?1:0)+other.length+missed.length+competencyGaps+atsGap);
 const competencyPoints=(result.weights?.competency||25)-(result.breakdown?.competency||0),testPoints=(result.weights?.numerical||15)+(result.weights?.technical||20)-(result.breakdown?.numerical||0)-(result.breakdown?.technical||0);
 const findings=(result.competencies||[]).map(c=>({name:c.name,reason:completeSentence(c.reason,65)}));
 const skimLines=lines.filter(s=>!cvText||cvText.includes(s)).slice(0,3);
 const skimNote=words(result.skimNote).length<=20?String(result.skimNote||''):'';
 return {skimLines,skimHeadings:skimLines.map(line=>{const heading=repairs?.find(b=>b.originalBullet===line)?.cvItem||((line===primary&&result.cvPreview?.source)||'');return !cvText||cvText.includes(heading)?heading:'';}),skimNote,competencyFindings:findings,atsTerms:{matched:result.atsReadiness?.matchedKeywords||[],missing:result.atsReadiness?.missingKeywords||[]},largestRemainingGap:competencyPoints>=testPoints?'competencies':'tests',primaryLine:primary,weakLineCount:weak?.length,verdict:completeSentence(result.deskSummary,65),critique:completeSentence(result.cvPreview?.issue,48),priorityReasons:(result.priorities||[]).map(p=>completeSentence(p.description,18)),estimate:routeEstimate(result),gapCount,remainingFixes:gapCount-(primary?1:0),cvLineCount:weak?weak.length:Array.isArray(repairs)?lines.length:(primary?1:0),otherLines:other.map((line,i)=>({...line,issue:weak?.[i+1]?.issue||repairs?.find(b=>b.originalBullet===lines.filter(s=>s!==primary&&(!primary||!primary.includes(s)&&!s.includes(primary)))[i])?.currentIssue||''})),competencies:competency.items,competenciesNormalised:competency.normalised,competencyGapCount:competencyGaps,missedTopics:missed,atsGap,
 question:/DCF|compar|valuation|research|analys/i.test(primary)?'What did this work show, and what happened next?':'What were you personally trusted to do, and what happened as a result?'};
}
export function freeConversionResult(result){
 const copy=structuredClone(result);
 copy.priorities=(copy.priorities||[]).map((p,i)=>i===0?{title:p.title,description:p.description}:{title:p.title});
 copy.competencies=(copy.competencies||[]).map(c=>({name:c.name,score:c.score}));
 if(copy.atsReadiness)copy.atsReadiness={band:copy.atsReadiness.band};
 if(copy.cvPreview)copy.cvPreview={original:copy.cvPreview.original,source:copy.cvPreview.source,issue:copy.cvPreview.issue};
 if(copy.weakLines){if(copy.weakLines[0]&&copy.cvPreview)copy.cvPreview.original=copy.weakLines[0].original;delete copy.weakLines;}
 delete copy.applicationCriteria;return copy;
}
export function validateRewrite(draft,original,answer){
 const evidence=original+'\n'+answer;if(!draft||typeof draft.line!=='string'||words(draft.line).length>100||!Array.isArray(draft.factsUsed)||!draft.factsUsed.length||draft.factsUsed.some(q=>typeof q!=='string'||!evidence.includes(q)))throw new Error('Rewrite could not be grounded in your facts.');
 for(const n of draft.line.match(/\d+(?:[.,]\d+)?/g)||[])if(!evidence.includes(n))throw new Error('Rewrite introduced an unsupported number.');
 return {line:draft.line.trim(),factsUsed:draft.factsUsed};
}
