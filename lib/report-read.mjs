export function plainReportText(value){
 return String(value||'').replace(/\([^)]*\bE\d+\b[^)]*\)/g,'').replace(/\(your (?:cited )?CV(?: evidence)?(?:[–—/ -]+your (?:cited )?CV(?: evidence)?)?\)/gi,'').replace(/\bE\d+(?:\s*[-–—/,]\s*E?\d+)*\b/g,'').replace(/\byour cited CV evidence\b/gi,'').replace(/\*\*|__/g,'').replace(/\s+([,.;:])/g,'$1').replace(/\s+/g,' ').trim();
}
function safeSentence(text){return /authenticity of|entire application|cannot be independently verified|motivation.+undermined|claim cannot be credited as established fact/i.test(text)?'Clarify any differences between your profile, CV and follow-up answers before submitting.':text}
function sentences(value){return plainReportText(value).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean).map(safeSentence)}
function short(value,max=42){const s=plainReportText(value),words=s.split(/\s+/);return words.length<=max?s:words.slice(0,max).join(' ')+'…'}
export function reportRead(evaluation={},fallback={}){
 const raw=String(evaluation.summary||fallback.summary||'');
 const headings=/\*?\*?(Supported strengths|What the follow-up answers added|Remaining uncertainty)\s*:\*?\*?/gi;
 const chunks=raw.split(headings),sections={};for(let i=1;i<chunks.length;i+=2)sections[chunks[i].toLowerCase()]=chunks[i+1];
 const structured=evaluation.read||{};
 const intro=structured.verdict||sentences(chunks[0])[0]||'Your report below separates the evidence you have from the gaps to work on.';
 const strengths=Array.isArray(structured.strengths)?structured.strengths:sentences(sections['supported strengths']||'').slice(0,2);
 const gaps=Array.isArray(structured.gaps)?structured.gaps:sentences(sections['remaining uncertainty']||sections['what the follow-up answers added']||'').slice(0,2);
 const competency=evaluation.competencies||fallback.competencies||[];
 if(!strengths.length){const best=[...competency].filter(c=>c.score>0).sort((a,b)=>b.score-a.score)[0];if(best)strengths.push(best.reason)}
 if(!gaps.length){const lowest=[...competency].sort((a,b)=>a.score-b.score)[0];if(lowest?.reason)gaps.push(lowest.reason);else if(fallback.mostImportantFix)gaps.push(fallback.mostImportantFix)}
 return {verdict:short(safeSentence(intro),45),strengths:strengths.filter(Boolean).slice(0,2).map(x=>short(safeSentence(plainReportText(x)))),gaps:[...new Set(gaps.filter(Boolean).map(x=>short(safeSentence(plainReportText(x)))))].slice(0,2),nextStep:short(structured.nextStep||fallback.mostImportantFix||'Review the first CV repair, confirm the facts and save the wording you can defend.',32)};
}
