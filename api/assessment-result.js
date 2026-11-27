import {stableScoreCache} from '../lib/stable-assessment-score.mjs';
import {questionsForRoute} from '../lib/question-banks.mjs';
import {frameworkResult,frameworkReport,frameworkEvaluation} from '../lib/cv-framework-result.mjs';
import {funnelEvent} from '../lib/assessment-funnel.mjs';
import {assessmentEntry} from '../lib/assessment-entry.mjs';
import {conversionFacts,freeConversionResult} from '../lib/result-conversion.mjs';
import {resultDeadline,summaryDeadline} from '../lib/result-deadline.mjs';
import {deepFor,evidenceText} from '../lib/deep-assessment.mjs';
import {currentAccount,entitlement,resultUnlocked,emailConfigured} from '../lib/accounts.mjs';
import {FULL_CYCLE_REVIEW_MODE,fullCycleAccess} from '../lib/full-cycle-access.mjs';
import {ownedRecord,hasAccess,apiFailure,sql} from '../lib/report-store.mjs';
import {parsePart} from '../lib/full-cycle-contract.mjs';
import {publicAssessment} from '../lib/assessment-scoring.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).end();
 try{const row=await ownedRecord(req,res,req.query.id);if(!row)return res.status(404).json({success:false,error:'Result unavailable in this browser. Start your assessment again.'});
 const beforeStable=row.result;row.result=await stableScoreCache.freeze(row.result,row.input.cvText,questionsForRoute(row.input.profile?.targetSector||'General Finance').id,row.input.answers,row.input.quiz);if(row.result!==beforeStable)await sql().query('UPDATE desk_assessments SET result=$1::jsonb WHERE id=$2 AND owner_hash=$3',[JSON.stringify(row.result),row.id,row.owner_hash]);
 row.result=frameworkResult(row.result,row.input.cvText,row.input.profile,row.input.quiz);
 const paid=await hasAccess(row),unlocked=await fullCycleAccess(row);const root=row.root_id?(await sql().query('SELECT id,paid_at,rechecks_used FROM desk_assessments WHERE id=$1 AND owner_hash=$2',[row.root_id,row.owner_hash]))[0]:row;
 const account=await currentAccount(req);const access=account?await entitlement(account.id):null;const expiresAt=access?.active?access.until:root?.paid_at?new Date(new Date(root.paid_at).getTime()+365*86400000).toISOString():null;
 const recheck=paid?{rootId:root.id,remaining:Date.now()<new Date(expiresAt).getTime()?Math.max(0,12-root.rechecks_used):0,expiresAt}:null;
 const deep=unlocked?await deepFor(row):null;const deepReady=deep?.status==='complete';
 if(deepReady && row.report?.repair){try{row.report.repair=parsePart(JSON.stringify(row.report.repair),'repair',evidenceText(row,deep));}catch{row.report={...row.report,repair:undefined};}}
 await funnelEvent(row.owner_hash,'assessment_completed',row.id).catch(()=>{});
 const claimed=unlocked||await resultUnlocked(row);
 if(!claimed)return res.json({success:true,id:row.id,emailReady:emailConfigured(),entry:{...assessmentEntry(row,false),deadline:await summaryDeadline(row).catch(()=>null)}});
 const publicData=publicAssessment(row.result,row.input.quiz,row.input.cvText);const conversion=conversionFacts(row.result,row.input.quiz,row.input.cvText,row.report);if(!unlocked){publicData.result=freeConversionResult(publicData.result);delete publicData.result.cvFramework;if(publicData.result.cvPreview)delete publicData.result.cvPreview.structure;publicData.result.weakLines=row.result.weakLines.slice(0,3);}
 const deadline=await resultDeadline(row,account).catch(()=>null);
 return res.json({success:true,id:row.id,entry:assessmentEntry(row,true,paid),profile:row.input.profile,...publicData,conversion,deadline,email:account?.email||row.input.resultEmail||null,freeLineFix:row.input.freeLineFix?{line:row.input.freeLineFix.line}:null,paid,fullCycleReview:FULL_CYCLE_REVIEW_MODE,recheck,deep:unlocked?{status:deepReady?'complete':'draft',evaluation:frameworkEvaluation(deep?.evaluation,row.result.cvFramework),testChoice:deep?.testChoice,testsDate:row.created_at}:undefined,report:deepReady?{...row.report,verdict:frameworkReport(row.report?.verdict,'verdict',row.result.cvFramework),repair:frameworkReport(row.report?.repair,'repair',row.result.cvFramework)}:undefined});}catch(e){return apiFailure(res,e);}
}

