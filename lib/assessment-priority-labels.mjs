import {containsCvDetail,usableCvDetail} from './cv-detail.mjs';
// Add an already-selected, CV-verified source label without changing advice or scores.
export function anchorPriorityLabels(analysis,cv,allowedDetails){
 for(const priority of analysis.priorities||[]){const detail=priority.detail,description=priority.description;if(typeof detail!=='string'||typeof description!=='string'||!allowedDetails.includes(detail))continue;if(!usableCvDetail(detail)||!containsCvDetail(cv,detail)||containsCvDetail(description,detail)||/^(your |the |a |an |projects?$|education$|experience$|skills$|activities$)/i.test(detail))continue;const labelled=detail+': '+description;if(labelled.trim().split(/\s+/).length<=40)priority.description=labelled}
 return analysis;
}
