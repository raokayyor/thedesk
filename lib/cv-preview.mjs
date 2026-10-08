export function anchoredCvPreview(preview,cvText){
 const lines=String(cvText||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const bullets=lines.filter(x=>/^[-•]\s*\S/.test(x)&&x.replace(/^[-•]\s*/,'').split(/\s+/).length>=4);
 const original=String(preview?.original||'').trim();
 const selected=bullets.includes(original)?original:bullets.find(x=>!/[0-9]/.test(x))||bullets[0];
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
 const fallback=detail||(/[0-9]/.test(task)?'The task has a clear scale, but its finding and use are unclear; the reader cannot judge what your contribution achieved.':'The task is named, but its scope, findings and use are unclear; the reader cannot judge the depth or impact of your contribution.');
 return {original:selected,source,issue:original===selected&&anchored&&specific&&!generic?issue:task+'. '+fallback,structure:preview?.structure};
}
