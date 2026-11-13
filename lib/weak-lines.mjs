// Exact source validation shared by free diagnosis and paid repair coverage.
export const WEAK_LINES_SCHEMA={type:'array',maxItems:8,items:{type:'object',additionalProperties:false,required:['original','issue','severity'],properties:{original:{type:'string'},issue:{type:'string',pattern:'^(?:\\S+\\s+){0,11}\\S+$'},severity:{type:'integer',minimum:1,maximum:3}}}};
export function validateWeakLines(items,cvText,catalog=[]){
 if(!Array.isArray(items)||items.length>8)throw Error('Return up to eight weak CV lines.');
 const sources=new Map(catalog.map(x=>[x.id,x.quote])),seen=new Set();
 return items.map(item=>{
 const original=sources.get(item.original)||item.original;
 if(typeof original!=='string'||original.trim().split(/\s+/).length<4||!cvText.includes(original)||original.includes('\n')||seen.has(original)||typeof item.issue!=='string'||!item.issue.trim()||item.issue.trim().split(/\s+/).length>12||![1,2,3].includes(item.severity))throw Error('Weak lines must be unique exact CV bullets, with a short issue and severity 1–3.');
 seen.add(original);return {original,issue:item.issue.trim(),severity:item.severity};
 });
}
export function missingWeakRepairs(weakLines,repairs=[]){return (weakLines||[]).filter(w=>!repairs.some(r=>r.originalBullet===w.original));}
