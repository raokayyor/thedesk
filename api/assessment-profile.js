import {currentAccount} from '../lib/accounts.mjs';
import {sql,apiFailure} from '../lib/report-store.mjs';
// Assessment prefill must not initialise a guest dashboard or rotate ownership.
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='GET')return res.status(405).end();
 try{
  const account=await currentAccount(req);
  if(!account)return res.json({signedIn:false});
  const data=(await sql().query('SELECT data FROM desk_account_profiles WHERE account_id=$1',[account.id]))[0]?.data||{};
  const profile=Object.fromEntries(['name','university','course','year'].map(key=>[key,typeof data[key]==='string'?data[key].slice(0,200):'']));
  return res.json({signedIn:true,email:account.email,profile});
 }catch(e){return apiFailure(res,e);}
}
