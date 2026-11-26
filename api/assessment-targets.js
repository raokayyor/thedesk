import {sameOrigin,apiFailure} from '../lib/report-store.mjs';
import {loadTargets,storeTargets} from '../lib/assessment-target-store.mjs';
export default async function handler(req,res){res.setHeader('Cache-Control','private, no-store');if(!['GET','POST'].includes(req.method))return res.status(405).end();if(req.method==='POST'&&!sameOrigin(req,res))return;try{if(req.method==='GET')return res.json(await loadTargets(req,res));return res.json(await storeTargets(req,res,req.body||{}));}catch(e){return apiFailure(res,e);}}
