import {completeSentence} from './result-conversion.mjs';
// Free previews contain only these fields; detailed model output never reaches the browser.
export function teaserFeedbackPreview(full){
 const line=(value,max=130)=>completeSentence(String(value||'').replace(/\s+/g,' ').trim(),40);
 return {lockedFixCount:full.lockedFixCount??Math.max(0,(full.fixes?.length||0)-1),overall:full.overall,verdictTitle:line(full.verdictTitle)||'Your answer — a first look',tasterScores:full.tasterScores||{structure:full.scores?.structure,evidence:full.scores?.evidence,relevance:full.scores?.relevance,delivery:full.scores?.delivery},verdict:line(full.verdict),strengths:full.strengths.slice(0,1).map(s=>({point:line(s.point),quote:s.quote||''})),fixes:full.fixes.slice(0,1).map(f=>({fix:line(f.fix),quote:f.quote||''})),teaser:true,previewLocked:true,followUpPreview:{question:"Which part of that experience was your own contribution, and what did you learn from it?",why:"An example of how an interviewer could probe your evidence."}};
}
