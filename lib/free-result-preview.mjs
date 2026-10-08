export const FREE_RESULT_LIMITS={summary:65,priorityTitle:10,priority:24,cvIssue:32,cvStructure:28,reason:24,sample:24};
function short(text,max){const words=String(text||'').trim().split(/\s+/).filter(Boolean);if(words.length<=max)return words.join(' ');return words.slice(0,max).join(' ').replace(/[,:;—-]+$/,'')+'…';}
function sentence(text,max){const parts=String(text||'').match(/[^.!?]+[.!?]*/g)||[];return short((parts[0]||''),max);}
export function freeResultPreview(result){
 const r=structuredClone(result);
 const summary=String(r.deskSummary||'');const summaryParts=summary.match(/[^.!?]+[.!?]*/g)||[];const summaryGap=summaryParts.find(s=>/main gaps|weakness|needs evidence|does not|doesn.t|but |however/i.test(s));r.deskSummary=summary.split(/\s+/).length>65&&summaryGap?short(summaryParts[0],24)+' '+short(summaryGap,40):short(summary,65);
 if(r.candidateName){const first=r.candidateName.split(' ')[0];r.deskSummary=r.deskSummary.replaceAll(r.candidateName+' is ','You are ').replaceAll(r.candidateName,'You').replaceAll(first+' is ','You are ').replaceAll('She has ','You have ').replaceAll('Her ','Your ').replaceAll(' her ',' your ');}
 r.priorities=(r.priorities||[]).slice(0,3).map(p=>({title:short(p.title,10),description:sentence(p.description,24)}));
 if(r.cvPreview)r.cvPreview={original:r.cvPreview.original,issue:sentence(r.cvPreview.issue,32),structure:'[Your action] + [analysis or task] + [supported output or conclusion].'};
 r.competencies=(r.competencies||[]).map(c=>{const {nextStep,quotes,...rest}=c;const sentences=String(c.reason||'').match(/[^.!?]+[.!?]*/g)||[];const gap=sentences.find(s=>/however|but |though |no specific|no .*described/i.test(s));return {...rest,reason:short(gap||sentences[0]||'',24),...(c.name==='Analytical ability'?{nextStep:sentence(nextStep,24)}:{})};});
 if(r.atsReadiness){const {suggestedActions,missingKeywords,matchedKeywords,components,...ats}=r.atsReadiness;r.atsReadiness=ats;}
 delete r.applicationCriteria;
 return r;
}
