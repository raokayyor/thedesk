import {loadProgrammes} from '../lib/programmes.mjs';
import {homepageDeadlines} from '../lib/home-deadlines.mjs';
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).end();res.setHeader('Cache-Control','public, max-age=60');try{const data=await loadProgrammes();const deadlines=homepageDeadlines(data.programmes,String(req.query?.route||''));return res.json({deadlines});}catch{return res.status(503).json({error:'Deadlines unavailable'});}}
