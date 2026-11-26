import {runFramework,verdictFor} from './cv-fault-framework.mjs';
import {currentAssessmentScore} from './assessment-scoring.mjs';
export const CV_FRAMEWORK_VERSION='cv-fault-v5-desire-specific-reasons';
export function frameworkResult(result,cv,profile={},quiz){
 const scored=currentAssessmentScore(result,quiz,cv),framework=runFramework(cv,{firm:profile.targetFirm||result.targetFirm||'your target firm',route:profile.targetSector||profile.targetDivision||''});
 return {...scored,cvPreview:framework.teaserLine?{original:framework.teaserLine.text,issue:framework.teaserLine.why,source:framework.teaserLine.role||'',structure:''}:undefined,cvFramework:{...framework,version:CV_FRAMEWORK_VERSION},weakLines:framework.allFlaggedLines.map(line=>({original:line.text,issue:line.why,severity:line.severity,faults:line.faults,role:line.role})),priorities:framework.reasons.map(reason=>({id:reason.id,title:reason.text,description:reason.text,kind:reason.kind,points:reason.points})),deskSummary:String(scored.deskSummary||'').split(/(?<=[.!?])\s+(?=[A-Z])/u)[0],frameworkVerdict:scored.readinessComplete===false?null:verdictFor(scored.overallScore).headline};
}
export function frameworkReport(data,part,framework){
 if(!data||!framework)return data;const copy=structuredClone(data);
 if(part==='verdict'){
  const previous=copy.applicationRiskMap||[];
  copy.applicationRiskMap=framework.reasons.map(reason=>({id:reason.id,risk:reason.text,severity:reason.points>=9?'High':'Medium',whyItMatters:reason.text,howToFix:previous.find(p=>p.id===reason.id)?.howToFix||'Use the evidence and fixes for this item in your report.'}));
  if(copy.executiveVerdict)copy.executiveVerdict.mostImportantFix=framework.reasons[0]?.text;
 }
 if(part==='repair'){
  copy.bulletRepair=framework.allFlaggedLines.map(flag=>{const norm=value=>String(value||'').replace(/^\s*[-•*·▪–]\s*/, '').trim();const existing=(copy.bulletRepair||[]).find(b=>norm(b.originalBullet)===flag.text);return existing?{...existing,originalBullet:flag.text,currentIssue:flag.why,faults:flag.faults}:null}).filter(Boolean);
  if(copy.firmDivisionFit)copy.firmDivisionFit.whatTheFirmWillQuestion=framework.reasons.map(r=>r.text).join(' ');
  if(copy.evidenceHierarchy)copy.evidenceHierarchy.reduceOrCut=framework.flaggedLines.map(f=>({evidence:f.text,whyReduce:f.why,whatToDoInstead:'Address the flagged wording using confirmed facts.'}));
 }
 return {...copy,cvFrameworkVersion:framework.version};
}

export function frameworkEvaluation(evaluation,framework){return evaluation?{...evaluation,read:{...(evaluation.read||{}),verdict:verdictFor(evaluation.score).headline,gaps:framework.reasons.map(r=>r.text)}}:evaluation;}
