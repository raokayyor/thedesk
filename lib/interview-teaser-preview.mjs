// Free previews contain only these fields; detailed model output never reaches the browser.
export function teaserFeedbackPreview(full){
 const line=(value,max=130)=>String(value||'').replace(/\s+/g,' ').trim().slice(0,max);
 return {overall:full.overall,verdictTitle:'Your answer — a first look',verdict:line(full.verdict),strengths:full.strengths.slice(0,1).map(s=>({point:line(s.point)})),fixes:full.fixes.slice(0,1).map(f=>({fix:line(f.fix)})),teaser:true,previewLocked:true,followUpPreview:{question:"Which part of that experience was your own contribution, and what did you learn from it?",why:"An example of how an interviewer could probe your evidence."}};
}
