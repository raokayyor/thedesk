import {buildRepairedCv} from '../lib/repaired-cv.mjs';
import {assessAtsReadiness} from '../lib/ats-readiness.mjs';
export default function handler(req,res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Use POST'});
  try {
    const cv=buildRepairedCv(req.body);
    const atsReadiness=assessAtsReadiness({cvText:cv.sourceText,profile:req.body.profile,targetKeywords:req.body.targetKeywords});
    return res.status(200).json({success:true,cv,atsReadiness});
  } catch(e) {return res.status(400).json({success:false,error:e.message});}
}