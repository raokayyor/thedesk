import {startTaster,tasterRun,completeTaster,tasterError} from '../lib/free-tasters.mjs';
import {publicPractice,markPractice} from '../lib/aptitude-practice.mjs';
import {principal,isPaidOwner,saveItem,useQuota} from '../lib/value-accounts.mjs';
import {sameOrigin,apiFailure} from '../lib/report-store.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');
 if(req.query?.view==='blocked')return res.status(404).end();
 try{const p=await principal(req,res),member=await isPaidOwner(p);
  if(req.method==='GET')return res.json(publicPractice(member));
  if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
  if(!await useQuota('aptitude-practice:'+p,50))return res.status(429).json({error:'Please try again tomorrow.'});
  const b=req.body||{};const taster=!member&&(b.taster===true||p.startsWith('account:'))&&['sjt','verbal'].includes(b.type)?await startTaster(req,res,b.type):null;let result;try{result=taster?await tasterRun(taster,'mark',1,async()=>markPractice(b.type,b.answers,false)):markPractice(b.type,b.answers,member);}catch(e){return res.status(e.status||400).json({error:e.message,upgrade:e.status===402});}
  const elapsed=Math.max(0,Math.min(3600,Number(b.elapsed)||0));
  const id=await saveItem(p,'aptitude-test',{type:b.type,score:result.score,total:result.total,percent:result.percent,elapsed,member,completedAt:new Date().toISOString()});
  if(taster)await completeTaster(taster);return res.json({...result,saved:!!id});
 }catch(e){if(req.body?.taster)return tasterError(res,e);return apiFailure(res,e);}
}
