import {randomBytes} from 'node:crypto';
import {ownedRecord,sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {fullCycleAccess} from '../lib/full-cycle-access.mjs';
import {allow} from '../lib/accounts.mjs';
let ready;
const init=()=>ready??=(sql().query('CREATE TABLE IF NOT EXISTS desk_cv_versions(id text PRIMARY KEY,assessment_id text NOT NULL,text text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())').catch(e=>{ready=null;throw e}));
export default async function handler(req,res){res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');if(!['GET','POST'].includes(req.method))return res.status(405).end();if(req.method==='POST'&&!sameOrigin(req,res))return;
 try{const id=req.method==='GET'?req.query?.id:req.body?.assessmentId,row=await ownedRecord(req,res,id);if(!row)return res.status(404).json({error:'This CV is not available in your account.'});if(!await fullCycleAccess(row))return res.status(402).json({error:'CV rebuilding is included with membership.'});await init();
 if(req.method==='GET'){const versions=await sql().query('SELECT id,text,created_at FROM desk_cv_versions WHERE assessment_id=$1 ORDER BY created_at DESC,id DESC LIMIT 50',[row.id]);return res.json({id:row.id,name:row.input.profile?.name||'',original:row.input.cvText,repairs:(row.report?.repair?.bulletRepair||[]).map(x=>({original:x.originalBullet,suggested:x.exampleBullet,why:x.whyThisWorks||'',questions:x.questionsToConfirm||[]})),versions});}
 const text=req.body?.text;if(typeof text!=='string'||text.trim().length<100||text.length>80000)return res.status(400).json({error:'Keep your CV between 100 and 80,000 characters.'});if(!await allow('cv-version:'+row.id,20))return res.status(429).json({error:'Too many saves. Keep editing and try saving again later.'});
 const version=randomBytes(16).toString('hex');const rows=await sql().query('INSERT INTO desk_cv_versions(id,assessment_id,text) SELECT $1,$2,$3 WHERE (SELECT count(*) FROM desk_cv_versions WHERE assessment_id=$2)<50 RETURNING id,created_at',[version,row.id,text.trim()]);if(!rows.length)return res.status(409).json({error:'You already have 50 saved versions for this assessment. Download your draft to keep a copy.'});return res.json({success:true,version:rows[0]});
 }catch(e){return apiFailure(res,e)}}
