import {loadProgrammes} from '../lib/programmes.mjs';
import {closingSoonCount} from '../lib/home-deadlines.mjs';
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).end();res.setHeader('Cache-Control','public, max-age=300');try{const data=await loadProgrammes();return res.json({closingSoon:closingSoonCount(data.programmes)});}catch{return res.status(503).json({error:'Deadlines unavailable'});}}
