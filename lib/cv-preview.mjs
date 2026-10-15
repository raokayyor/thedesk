export function anchoredCvPreview(preview,cvText){
 const lines=String(cvText||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const bullets=lines.filter(x=>(/^[-•]\s*\S/.test(x)||/^(Supported|Assisted|Helped|Researched|Recorded|Flagged|Presented|Worked|Trained|Built|Compared|Tested|Identified|Attended|Analysed|Analyzed|Prepared|Reviewed|Led|Organised|Organized|Created|Developed|Managed|Delivered|Reconciled|Calculated)\b/i.test(x))&&x.replace(/^[-•]\s*/,'').split(/\s+/).length>=4);
 const original=String(preview?.original||'').trim();
 let selected=bullets.includes(original)?original:bullets.find(x=>!/[0-9]/.test(x))||bullets[0];
 const structure=String(preview?.structure||'');
 const dropsNumber=(original.match(/(?:£|\$|€)?\d[\d,.]*(?:%|x)?/g)||[]).some(token=>!structure.includes(token.replace(/[.,]+$/,'')));
 const fallbackLine=dropsNumber&&bullets.find(x=>!/[0-9]/.test(x)&&x.replace(/^[-•]\s*/,'').split(/\s+/).length<=22);
 if(fallbackLine)selected=fallbackLine;
 if(!selected)return preview;
 const index=lines.indexOf(selected);let source='';
 for(let i=index-1;i>=0;i--){if(!/^[-•]/.test(lines[i])&&!/^(EXPERIENCE|PROJECTS|EDUCATION|ACTIVITIES|SKILLS)$/i.test(lines[i])){source=lines[i];break;}}
 const task=selected.replace(/^[-•]\s*/,'').replace(/[.!?]$/,'');
 const issue=String(preview?.issue||'');
 const terms=task.toLowerCase().match(/[a-z]{5,}/g)||[];
 const anchored=terms.some(t=>issue.toLowerCase().includes(t));
 const specific=/scope|scale|how many|which|findings?|outcome|result|impact|audience|frequency|used|conclusion|decision|what|range|measure|quantif/i.test(issue);
 const generic=/this line names|nothing to assess|names activities/i.test(issue);
 const detail=/variance/i.test(task)?'Which revenue streams or period did you compare, what drove the variance, and how were your findings used? Those omissions obscure your analytical contribution.':/report|dashboard/i.test(task)?'The measures tracked, intended audience and use of the reporting are missing, so the reader cannot judge its value.':/present|communicat/i.test(task)?'The audience, main conclusion and response are missing, so the reader cannot judge how effectively you communicated your findings.':/analys|research|valuat/i.test(task)?'The scope, method and main conclusion are missing, so the reader cannot judge the depth of your analysis.':null;
 const suppliedFinding=/\b(found|identified|isolated|concluded|revealed|determined)\b/i.test(task);
 const fallback=suppliedFinding?'Your bullet already states a finding. Clarify how you used it, where relevant, while retaining the method, scale and outcome you have supplied.':detail||(/[0-9]/.test(task)?'The task has a clear scale, but its finding and use are unclear; the reader cannot judge what your contribution achieved.':'The task is named, but its scope, findings and use are unclear; the reader cannot judge the depth or impact of your contribution.');
 if(fallbackLine)return {original:selected,source,issue:'The CV names '+task.charAt(0).toLowerCase()+task.slice(1)+'. Clarify your personal contribution and output.',structure:task+'. [Confirm: your personal contribution, method and output.]'};
 return {original:selected,source,issue:original===selected&&anchored&&specific&&!generic?issue:task+'. '+fallback,structure:preview?.structure};
}
