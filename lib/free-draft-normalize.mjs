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
 return analysis;
}
