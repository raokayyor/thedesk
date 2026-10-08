import {anchoredCvPreview} from './cv-preview.mjs';
export const FREE_RESULT_LIMITS={summary:65,priorityTitle:10,priority:24,cvIssue:48,cvStructure:28,reason:32,sample:24};
function short(text,max){const words=String(text||'').trim().split(/\s+/).filter(Boolean);if(words.length<=max)return words.join(' ');return words.slice(0,max).join(' ').replace(/[,:;—-]+$/,'')+'…';}
function sentence(text,max){const parts=String(text||'').replace(/\bvs\./gi,'versus').split(/(?<=[.!?])\s+(?=[A-Z])/);const first=(parts[0]||'').trim();if(first.split(/\s+/).length>max){const clause=first.split(/[,;—]/)[0].trim();if(clause.split(/\s+/).length<=max)return clause.replace(/[.!?]$/,'')+'.';}return short(first,max);}
export function freeResultPreview(result,cvText){
 const r=structuredClone(result);if(cvText)r.cvPreview=anchoredCvPreview(r.cvPreview,cvText);
 const summary=String(r.deskSummary||'');const summaryParts=summary.match(/[^.!?]+[.!?]*/g)||[];const summaryGap=summaryParts.find(s=>/main gaps|weakness|needs evidence|does not|doesn.t|but |however/i.test(s));r.deskSummary=summary.split(/\s+/).length>65&&summaryGap?short(summaryParts[0],24)+' '+short(summaryGap,40):short(summary,65);
 if(r.candidateName){const first=r.candidateName.split(' ')[0];r.deskSummary=r.deskSummary.replaceAll(r.candidateName+' is ','You are ').replaceAll(r.candidateName,'You').replaceAll(first+' is ','You are ').replaceAll('She has ','You have ').replaceAll('Her ','Your ').replaceAll(' her ',' your ');}
 r.priorities=(r.priorities||[]).slice(0,3).map(p=>({title:short(p.title,10),description:sentence(p.description,24)}));
 if(r.cvPreview)r.cvPreview={original:r.cvPreview.original,...(r.cvPreview.source?{source:short(r.cvPreview.source,18)}:{}),issue:short(r.cvPreview.issue,48),structure:short(r.cvPreview.structure,48)};
 r.competencies=(r.competencies||[]).map(c=>{const {nextStep,quotes,detail,...rest}=c;const sentences=String(c.reason||'').match(/[^.!?]+[.!?]*/g)||[];const gap=sentences.find(s=>/however|but |though |no specific|no .*described/i.test(s));const selected=String(gap||sentences[0]||'').trim();const anchors=['Your CV does not yet show evidence for this competency.','Your CV mentions this area, but gives little evidence of your contribution.','Your CV shows relevant activity, but your individual contribution or outcome is unclear.','Your CV shows a specific personal action, but the outcome needs stronger evidence.','Your CV shows a specific personal action and a supported output.'];return {...rest,reason:short(c.reason,32),...(c.name==='Analytical ability'?{nextStep:sentence(nextStep,24)}:{})};});
 if(r.atsReadiness){const {suggestedActions,missingKeywords,matchedKeywords,components,...ats}=r.atsReadiness;r.atsReadiness=ats;}
 delete r.applicationCriteria;delete r.summaryDetail;
 return r;
}

