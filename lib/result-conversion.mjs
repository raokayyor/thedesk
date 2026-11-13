// Shared conversion facts. Estimates are indicative recheck ranges, never hiring odds.
const words=s=>String(s||'').trim().split(/\s+/).filter(Boolean);
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
 const primary=String(result.cvPreview?.original||'');
 const candidates=[primary,...(report?.repair?.bulletRepair||[]).map(b=>b.originalBullet),...(result.applicationCriteria||[]).filter(c=>c.points<4).flatMap(c=>c.quotes||[])];
 const lines=[...new Set(candidates.filter(s=>typeof s==='string'&&words(s).length>=7&&(!cvText||cvText.includes(s))))];
 const other=lines.filter(s=>s!==primary&&(!primary||!primary.includes(s)&&!s.includes(primary))).map((s,i)=>({id:'line-'+(i+2),start:words(s.replace(/^\s*[-•]\s*/,'' )).slice(0,6).join(' ')}));
 const competency=reconcileCompetencies(result),competencyGaps=competency.items.filter(c=>c.score<70).length;
 const missed=[...new Set((quiz.missed||[]).map(m=>m.topic).filter(Boolean))];
 const priorityCount=(result.priorities||[]).length,atsGap=+(result.breakdown?.ats||0)<8?1:0;
 const gapCount=Math.max(1,priorityCount+(primary?1:0)+other.length+missed.length+competencyGaps+atsGap);
 return {estimate:routeEstimate(result),gapCount,remainingFixes:gapCount-1,cvLineCount:primary?1+other.length:other.length,otherLines:other,competencies:competency.items,competenciesNormalised:competency.normalised,competencyGapCount:competencyGaps,missedTopics:missed,atsGap,
 question:/DCF|compar|valuation|research|analys/i.test(primary)?'What did this work show, and what happened next?':'What were you personally trusted to do, and what happened as a result?'};
}
export function freeConversionResult(result){
 const copy=structuredClone(result);
 copy.priorities=(copy.priorities||[]).map((p,i)=>i===0?{title:p.title,description:p.description}:{title:p.title});
 copy.competencies=(copy.competencies||[]).map(c=>({name:c.name,score:c.score}));
 if(copy.atsReadiness)copy.atsReadiness={band:copy.atsReadiness.band};
 if(copy.cvPreview)copy.cvPreview={original:copy.cvPreview.original,source:copy.cvPreview.source,issue:copy.cvPreview.issue};
 delete copy.applicationCriteria;return copy;
}
export function validateRewrite(draft,original,answer){
 const evidence=original+'\n'+answer;if(!draft||typeof draft.line!=='string'||words(draft.line).length>100||!Array.isArray(draft.factsUsed)||!draft.factsUsed.length||draft.factsUsed.some(q=>typeof q!=='string'||!evidence.includes(q)))throw new Error('Rewrite could not be grounded in your facts.');
 for(const n of draft.line.match(/\d+(?:[.,]\d+)?/g)||[])if(!evidence.includes(n))throw new Error('Rewrite introduced an unsupported number.');
 return {line:draft.line.trim(),factsUsed:draft.factsUsed};
}
