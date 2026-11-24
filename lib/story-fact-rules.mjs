const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function factKind(prompt){return /firm|bank|barclays|rothschild|goldman|employer/i.test(prompt)?'firm':/result|changed|happened|outcome/i.test(prompt)?'outcome':/learn|reflect|differently/i.test(prompt)?'reflection':/choice|chose|decision|approach/i.test(prompt)?'decision':'detail';}
export function matchingFact(facts,{prompt,evidenceIds=[],firm=''}){
 const exact=facts.find(f=>norm(f.prompt)===norm(prompt)&&(!f.firm||norm(f.firm)===norm(firm))&&(!f.evidence_ids?.length||evidenceIds.some(id=>f.evidence_ids.includes(id))));if(exact)return exact;
 const kind=factKind(prompt);if(kind==='detail')return null;
 return facts.find(f=>f.kind===kind&&(kind==='firm'?!!firm&&norm(f.firm)===norm(firm):evidenceIds.length&&f.evidence_ids?.some(id=>evidenceIds.includes(id))))||null;
}
export function groundedStorySources(facts){return facts.map(f=>({id:'story:'+f.id,text:f.answer,source:f.prompt,kind:'answer',storyFactId:f.id,evidenceIds:f.evidence_ids}));}
export function refreshStoryParts(rewrite,facts){if(!rewrite?.parts)return rewrite;const byId=new Map(facts.map(f=>[String(f.id),f]));const parts=rewrite.parts.map(p=>{if(!p.storyFactId)return p;const f=byId.get(String(p.storyFactId));return f?{...p,text:f.answer,gap:false,confirmed:true}:{...p,text:p.prompt||'Add your own detail',gap:true,confirmed:false};});return {...rewrite,parts,text:parts.map(p=>p.gap?'['+p.text+']':p.text).join(' '),gaps:parts.filter(p=>p.gap).length};}
