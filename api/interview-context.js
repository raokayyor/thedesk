import {currentAccount,latestAssessment,accountOwnsAssessment} from '../lib/accounts.mjs';
import {owner,initStore,sql,apiFailure} from '../lib/report-store.mjs';
import {latestCv} from '../lib/saved-cv.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');
 if(req.method!=='GET')return res.status(405).end();
 const id=req.query?.id;
 if(id!==undefined&&(typeof id!=='string'||! /^[a-f0-9]{48}$/.test(id)))return res.status(400).json({success:false,error:'Invalid assessment reference.'});
 const ownerHash=owner(req,res);
 try{
  await initStore();
  const account=await currentAccount(req);
  if(!ownerHash&&!account)return res.status(401).json({success:false,error:'Sign in to load your saved CV.'});
  let row;
  if(account){
   if(id){if(await accountOwnsAssessment(account.id,id))row=(await sql().query('SELECT id,input,result,owner_hash FROM desk_assessments WHERE id=$1 LIMIT 1',[id]))[0];}
   else row=await latestAssessment(account.id);
  }
  if(!row&&ownerHash){const rows=id?await sql().query('SELECT id,input,result,owner_hash FROM desk_assessments WHERE owner_hash=$1 AND id=$2 LIMIT 1',[ownerHash,id]):await sql().query('SELECT id,input,result,owner_hash FROM desk_assessments WHERE owner_hash=$1 ORDER BY created_at DESC,id DESC LIMIT 1',[ownerHash]);row=rows[0];}
  if(!row)return res.status(404).json({success:false,error:'No saved assessment was found. Open My Desk to check your saved CV.'});
  const competencies=(Array.isArray(row.result?.competencies)?row.result.competencies:[]).map(c=>({name:c.name,score:c.score}));
  const missed=(Array.isArray(row.input?.quiz?.missed)?row.input.quiz.missed:[]).map(q=>({topic:q.topic,section:q.section}));
  return res.json({success:true,id:row.id,profile:row.input?.profile||{},cv:await latestCv(row.owner_hash||ownerHash),result:{competencies},quiz:{missed}});
 }catch(e){return apiFailure(res,e);}
}
