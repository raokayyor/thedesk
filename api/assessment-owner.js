import {owner,sameOrigin} from '../lib/report-store.mjs';
export default function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).end();
 if(!sameOrigin(req,res))return;
 owner(req,res,true);
 return res.json({success:true});
}
