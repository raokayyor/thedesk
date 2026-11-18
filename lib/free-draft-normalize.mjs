import {cvVerdictValid,practitionerVerdict} from './result-conversion.mjs';
// Resolve formatting differences without changing evidence or rubric marks.
export function normalizeFreeDraft(analysis,catalog,cvText){
 const sources=new Map(catalog.map(x=>[x.id,x.quote]));
 if(analysis.cvPreview&&typeof analysis.cvPreview.original==='string'){
  const key=analysis.cvPreview.original.trim();analysis.cvPreview.original=sources.get(key)||(cvText.includes(analysis.cvPreview.original)?analysis.cvPreview.original:undefined);
 }
 if(Array.isArray(analysis.weakLines)){
  const seen=new Set();analysis.weakLines=analysis.weakLines.filter(w=>{
   const original=typeof w.original==='string'?(sources.get(w.original.trim())||w.original):w.original;
   // Only deduplicate grounded lines. Invalid evidence must still fail validation.
   if(typeof original==='string'&&cvText.includes(original)){if(seen.has(original))return false;seen.add(original)}
   w.original=original;if(typeof w.issue==='string')w.issue=w.issue.trim().split(/\s+/).slice(0,12).join(' ');return true;
  });
 }
 // Summary presentation errors must not trigger another complete scoring request.
 // Remove forbidden quote formatting; retain valid CV-only prose verbatim.
 if(typeof analysis.deskSummary==='string'){
  const clean=analysis.deskSummary.replace(/[“”"]/g,'').trim();
  if(cvVerdictValid(clean))analysis.deskSummary=clean;
  else{
   const sentences=clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
   const cvOnly=sentences.filter(sentence=>cvVerdictValid(sentence)).map(sentence=>sentence.trim()).join(' ');
   if(cvVerdictValid(cvOnly)&&/what stops me shortlisting you is/i.test(cvOnly)&&!/^what stops/i.test(cvOnly))analysis.deskSummary=cvOnly;
   else{
    const detail=String(analysis.summaryDetail||'').trim();
    // Fallback uses only a real CV anchor and already-validated candidate evidence.
    // No scores, quotes or priorities are changed, and all validators still run.
    if(detail.length>=4&&cvText.toLowerCase().includes(detail.toLowerCase())&&cvVerdictValid(detail)){
     const repaired=practitionerVerdict({...analysis,deskSummary:'',cvPreview:{...analysis.cvPreview,source:detail}});
     if(cvVerdictValid(repaired))analysis.deskSummary=repaired;
    }
   }
  }
 }
 const prefixDetail=(item,textKey,detailKey,max)=>{const name=String(item?.[detailKey]||'').trim(),text=String(item?.[textKey]||'').trim();if(name.length>=4&&cvText.toLowerCase().includes(name.toLowerCase())&&!text.toLowerCase().includes(name.toLowerCase())&&(name+': '+text).split(/\s+/).length<=max)item[textKey]=name+': '+text;};
 prefixDetail(analysis,'deskSummary','summaryDetail',65);for(const p of analysis.priorities||[])prefixDetail(p,'description','detail',24);
 for(const c of analysis.competencies||[]){const detail=String(c.detail||'').trim(),reason=String(c.reason||'').trim();if(detail.length>=4&&cvText.toLowerCase().includes(detail.toLowerCase())&&!reason.toLowerCase().includes(detail.toLowerCase())&&((detail+': '+reason).split(/\s+/).length<=32))c.reason=detail+': '+reason;}
 return analysis;
}
