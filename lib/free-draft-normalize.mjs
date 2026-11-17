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
 const prefixDetail=(item,textKey,detailKey,max)=>{const name=String(item?.[detailKey]||'').trim(),text=String(item?.[textKey]||'').trim();if(name.length>=4&&cvText.toLowerCase().includes(name.toLowerCase())&&!text.toLowerCase().includes(name.toLowerCase())&&(name+': '+text).split(/\s+/).length<=max)item[textKey]=name+': '+text;};
 prefixDetail(analysis,'deskSummary','summaryDetail',65);for(const p of analysis.priorities||[])prefixDetail(p,'description','detail',24);
 for(const c of analysis.competencies||[]){const detail=String(c.detail||'').trim(),reason=String(c.reason||'').trim();if(detail.length>=4&&cvText.toLowerCase().includes(detail.toLowerCase())&&!reason.toLowerCase().includes(detail.toLowerCase())&&((detail+': '+reason).split(/\s+/).length<=32))c.reason=detail+': '+reason;}
 return analysis;
}
