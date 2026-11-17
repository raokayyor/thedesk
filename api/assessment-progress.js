import {owner} from '../lib/report-store.mjs';
import {readAssessmentProgress} from '../lib/assessment-progress.mjs';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).end();try{const progress=await readAssessmentProgress(req.query?.id,owner(req,res));return res.json(progress||{stage:'checking',attempt:1});}catch{return res.json({stage:'checking',attempt:1})}}
