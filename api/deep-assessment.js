import {evaluateDeep} from '../lib/deep-evaluation.mjs';
import {ownedRecord,sameOrigin,sql,hash,apiFailure} from '../lib/report-store.mjs';
import {fullCycleAccess} from '../lib/full-cycle-access.mjs';
import {currentAccount,latestAssessment,allow} from '../lib/accounts.mjs';
import {initDeep,deepFor,deepQuestions,validateDeepAnswers} from '../lib/deep-assessment.mjs';
export const maxDuration=300;
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');
 if(!['GET','POST'].includes(req.method))return res.status(405).end();
 if(req.method==='POST'&&!sameOrigin(req,res))return;
 let row,leased=false;
 try{
  const id=req.method==='GET'?req.query.id:req.body?.assessmentId;
  if(id)row=await ownedRecord(req,res,id);else{const a=await currentAccount(req);if(a)row=await latestAssessment(a.id);}
  if(!row)return res.status(404).json({error:'Complete your free assessment first.',next:'/assessment.html'});
  if(!await fullCycleAccess(row))return res.status(402).json({error:'The deep assessment is included with membership.',next:'/signin.html'});
  const questions=deepQuestions(row),saved=await deepFor(row);
  if(req.method==='GET')return res.json({id:row.id,profile:row.input.profile,initialScore:row.result.overallScore,questions,saved:saved||{status:'draft',answers:{},testChoice:'carry'}});
  if(!['save','complete'].includes(req.body.action))return res.status(400).json({error:'Unknown action.'});
  let valid;try{valid=validateDeepAnswers(questions,req.body,req.body.action==='complete')}catch(e){return res.status(400).json({error:e.message});}
  const signature=hash(JSON.stringify(valid)),data={...valid,cvHash:hash(row.input.cvText),signature,status:'draft'};
  if(req.body.action==='save'){
   if(saved?.status==='complete')return res.status(409).json({error:'This deep assessment is already complete. Update your CV and recheck to start a new assessment.'});
   const updated=await sql().query("INSERT INTO desk_deep_assessments(assessment_id,data) VALUES($1,$2::jsonb) ON CONFLICT(assessment_id) DO UPDATE SET data=EXCLUDED.data,updated_at=now() WHERE COALESCE(desk_deep_assessments.data->>'status','draft')<>'complete' AND (desk_deep_assessments.lease_until IS NULL OR desk_deep_assessments.lease_until<now()) RETURNING assessment_id",[row.id,JSON.stringify(data)]);
   if(!updated.length)return res.status(409).json({error:'Your deep assessment is being generated. Please wait.'});return res.json({success:true});
  }
  if(saved?.status==='complete')return res.json({success:true,next:'/fullcycle.html?id='+row.id,score:saved.evaluation.score,cached:true});
  if(!await allow('deep-assessment:'+row.id,4))return res.status(429).json({error:'Too many generation attempts. Your answers are saved; please try again later.'});
  await initDeep();const lock=await sql().query("INSERT INTO desk_deep_assessments(assessment_id,data,lease_until) VALUES($1,$2::jsonb,now()+interval '5 minutes') ON CONFLICT(assessment_id) DO UPDATE SET data=EXCLUDED.data,lease_until=EXCLUDED.lease_until WHERE COALESCE(desk_deep_assessments.data->>'status','draft')<>'complete' AND (desk_deep_assessments.lease_until IS NULL OR desk_deep_assessments.lease_until<now()) RETURNING assessment_id",[row.id,JSON.stringify(data)]);
  if(!lock.length)return res.status(409).json({error:'Your deep assessment is already being generated. Please wait.'});leased=true;
  const evaluation=await evaluateDeep(row,data);data.status='complete';data.evaluation=evaluation;data.completedAt=new Date().toISOString();
  await sql().query("WITH reset AS (UPDATE desk_assessments SET report='{}'::jsonb,generation_lease='{}'::jsonb WHERE id=$1 RETURNING id) UPDATE desk_deep_assessments SET data=$2::jsonb,lease_until=NULL,updated_at=now() WHERE assessment_id IN(SELECT id FROM reset)",[row.id,JSON.stringify(data)]);
  return res.json({success:true,next:'/fullcycle.html?id='+row.id,score:evaluation.score});
 }catch(e){if(leased&&row)await sql().query('UPDATE desk_deep_assessments SET lease_until=NULL WHERE assessment_id=$1',[row.id]).catch(()=>{});return apiFailure(res,e);}
}
