import {readFile} from 'node:fs/promises';
import {currentAccount,entitlement} from '../lib/accounts.mjs';
import {apiFailure} from '../lib/report-store.mjs';

const assets={library:['library.html','text/html'],videos:['video-library.html','text/html'],videoData:['video-library.json','application/json'],brain:['interview-brain-teasers.js','text/javascript']};
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='GET')return res.status(405).end();
 const asset=assets[req.query?.asset];
 if(!asset)return res.status(404).end();
 try{
  const account=await currentAccount(req);
  const member=account&&(await entitlement(account.id)).active;
  if(!member){
   if(asset[1]==='text/html'){res.setHeader('Location','/library-preview.html');return res.status(302).end();}
   if(asset[1]==='text/javascript'){res.setHeader('Content-Type','text/javascript; charset=utf-8');return res.status(200).send('globalThis.DeskBrainTeasers=[];');}
   return res.status(403).json({error:'The library and brain teasers are included with membership.'});
  }
  res.setHeader('Content-Type',asset[1]+'; charset=utf-8');
  return res.status(200).send(await readFile(new URL('../'+asset[0],import.meta.url),'utf8'));
 }catch(e){return apiFailure(res,e);}
}
