import {deepFor,evidenceText} from '../lib/deep-assessment.mjs';
import {fullCycleAccess} from '../lib/full-cycle-access.mjs';
import {buildRepairedCv} from '../lib/repaired-cv.mjs';
import {assessAtsReadiness} from '../lib/ats-readiness.mjs';
import {ownedRecord,hasAccess,sameOrigin,apiFailure} from '../lib/report-store.mjs';
export default async function handler(req,res) {
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Use POST'});
  if(!sameOrigin(req,res))return;
  try {
    const row=await ownedRecord(req,res,req.body?.assessmentId);
    if(!row||!await fullCycleAccess(row))return res.status(402).json({error:'Full Cycle purchase required.'});
    const deep=await deepFor(row);if(deep?.status!=='complete')return res.status(428).json({error:'Complete your CV follow-up questions first.',next:'/deep-assessment.html?id='+row.id});
    if(!row.report.repair)return res.status(409).json({error:'Prepare your repair report first.'});
    const cv=buildRepairedCv({...row.input,evidenceSource:evidenceText(row,deep),paid:row.report.repair});
    const atsReadiness=assessAtsReadiness({cvText:cv.sourceText,profile:row.input.profile});
    return res.status(200).json({success:true,cv,atsReadiness});
  } catch(e) {return apiFailure(res,e);}
}
