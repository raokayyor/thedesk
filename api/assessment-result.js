import {ownedRecord,hasAccess,apiFailure,sql} from '../lib/report-store.mjs';
import {publicAssessment} from '../lib/assessment-scoring.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).end();
 try{const row=await ownedRecord(req,res,req.query.id);if(!row)return res.status(404).json({success:false,error:'Result unavailable in this browser. Start your assessment again.'});
 const paid=await hasAccess(row);const root=row.root_id?(await sql().query('SELECT id,paid_at,rechecks_used FROM desk_assessments WHERE id=$1 AND owner_hash=$2',[row.root_id,row.owner_hash]))[0]:row;
 const expiresAt=root?.paid_at?new Date(new Date(root.paid_at).getTime()+30*86400000).toISOString():null;
 const recheck=paid?{rootId:root.id,remaining:Date.now()<new Date(expiresAt).getTime()?Math.max(0,2-root.rechecks_used):0,expiresAt}:null;
 return res.json({success:true,id:row.id,profile:row.input.profile,...publicAssessment(row.result,row.input.quiz,row.input.cvText),paid,recheck,report:paid?row.report:undefined});}catch(e){return apiFailure(res,e);}
}
