import {loadProgrammes} from '../lib/programmes.mjs';
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).end();res.setHeader('Cache-Control','public, max-age=60');try{return res.json(await loadProgrammes());}catch{return res.status(503).json({error:'Programme dates could not load. Please try again.'});}}
