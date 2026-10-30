import {owner,initStore,sql,apiFailure} from '../lib/report-store.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');
 if(req.method!=='GET')return res.status(405).end();
 const id=req.query?.id;
 if(id!==undefined&&(typeof id!=='string'||! /^[a-f0-9]{48}$/.test(id)))return res.status(400).json({success:false,error:'Invalid assessment reference.'});
 const ownerHash=owner(req,res);
 if(!ownerHash)return res.status(401).json({success:false,error:'No saved assessment is available in this browser.'});
 try{
  await initStore();
  const rows=id?await sql().query('SELECT id,input,result FROM desk_assessments WHERE owner_hash=$1 AND id=$2 LIMIT 1',[ownerHash,id]):await sql().query('SELECT id,input,result FROM desk_assessments WHERE owner_hash=$1 ORDER BY created_at DESC,id DESC LIMIT 1',[ownerHash]);
  const row=rows[0];if(!row)return res.status(404).json({success:false,error:'No saved assessment is available in this browser.'});
  const competencies=(Array.isArray(row.result?.competencies)?row.result.competencies:[]).map(c=>({name:c.name,score:c.score}));
  const missed=(Array.isArray(row.input?.quiz?.missed)?row.input.quiz.missed:[]).map(q=>({topic:q.topic,section:q.section}));
  return res.json({success:true,id:row.id,profile:row.input?.profile||{},cv:{text:typeof row.input?.cvText==='string'?row.input.cvText:''},result:{competencies},quiz:{missed}});
 }catch(e){return apiFailure(res,e);}
}
