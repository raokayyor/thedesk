import {sameOrigin,ownedRecord,apiFailure} from '../lib/report-store.mjs';
import {saveCv} from '../lib/saved-cv.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');
 if(req.method!=='POST')return res.status(405).end();
 if(!sameOrigin(req,res))return;
 const {assessmentId,text}=req.body||{};
 if(typeof assessmentId!=='string'||!/^[a-f0-9]{48}$/.test(assessmentId)||typeof text!=='string'||text.trim().length<20||text.length>60000)return res.status(400).json({success:false,error:'Add CV text between 20 and 60,000 characters.'});
 try{const row=await ownedRecord(req,res,assessmentId);if(!row)return res.status(404).json({success:false,error:'Your saved assessment was not found in this browser.'});const cv=await saveCv(row.owner_hash,row.id,text.trim());return res.json({success:true,cv})}catch(e){return apiFailure(res,e)}
}
