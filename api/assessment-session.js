import {owner,initStore,sameOrigin,apiFailure} from '../lib/report-store.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 try{await initStore();owner(req,res,true);return res.json({success:true});}catch(e){return apiFailure(res,e);}
}
