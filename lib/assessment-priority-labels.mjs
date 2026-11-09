// Add an already-selected, CV-verified source label without changing advice or scores.
export function anchorPriorityLabels(analysis,cv,allowedDetails){
 const source=String(cv||'').normalize('NFKC').toLowerCase();
 for(const priority of analysis.priorities||[]){const detail=priority.detail,description=priority.description;if(typeof detail!=='string'||typeof description!=='string'||!allowedDetails.includes(detail))continue;const name=detail.normalize('NFKC').toLowerCase();if(name.length<4||!source.includes(name)||description.normalize('NFKC').toLowerCase().includes(name)||/^(your |the |a |an |projects?$|education$|experience$|skills$|activities$)/i.test(detail))continue;const labelled=detail+': '+description;if(labelled.trim().split(/\s+/).length<=24)priority.description=labelled}
 return analysis;
}
