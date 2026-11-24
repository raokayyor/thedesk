import {funnelEvent} from '../lib/assessment-funnel.mjs';
import {owner,sameOrigin} from '../lib/report-store.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).end();
 if(!sameOrigin(req,res))return;
 const h=owner(req,res,true);await funnelEvent(h,'assessment_started').catch(()=>{});
 return res.json({success:true});
}
