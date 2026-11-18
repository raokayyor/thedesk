import {loadProgrammes} from '../lib/programmes.mjs';
import {upcomingDeadlines} from '../lib/home-deadlines.mjs';
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).end();res.setHeader('Cache-Control','public, max-age=300');try{const data=await loadProgrammes();const soon=upcomingDeadlines(data.programmes);return res.json({closingSoon:soon.length,nextDeadline:soon[0]?{firm:soon[0].firm,programme:soon[0].name,date:soon[0].closes}:null});}catch{return res.status(503).json({error:'Deadlines unavailable'});}}
