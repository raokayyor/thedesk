import {timingSafeEqual} from 'node:crypto';
import {programmeRows,saveProgrammes,markChecked} from '../lib/programme-store.mjs';
import {validateProgramme,csvParse,csvExport} from '../lib/programme-validation.mjs';
import {FIRM_DOMAINS} from '../data/firm-domains.mjs';
import {sql} from '../lib/report-store.mjs';
export function staffAllowed(req){const a=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer /,'')),b=Buffer.from(process.env.PRACTITIONER_SUPPORT_KEY||'');return b.length>0&&a.length===b.length&&timingSafeEqual(a,b);}
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(!staffAllowed(req))return res.status(401).json({error:'Staff access required.'});if(!['GET','POST'].includes(req.method))return res.status(405).end();const actor=String(req.headers['x-staff-email']||'').trim().toLowerCase();if(req.method==='POST'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actor))return res.status(400).json({error:'Add your staff email for the audit trail.'});
 try{if(req.method==='GET'){const rows=await programmeRows();if(req.query?.view==='csv'){res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="programmes.csv"');return res.send('\ufeff'+csvExport(rows));}if(req.query?.view==='changes')return res.json({changes:await sql().query('SELECT * FROM programme_changes ORDER BY changed_at DESC LIMIT 200')});return res.json({rows,domains:FIRM_DOMAINS});}
 const b=req.body||{};if(b.action==='preview-import'){const raw=csvParse(String(b.csv||''));const rows=[],errors=[];raw.forEach((r,i)=>{try{rows.push(validateProgramme(r))}catch(e){errors.push({row:i+2,error:e.message})}});return res.json({rows,errors});}
 if(b.action==='checked')return res.json({saved:await markChecked(b.id,actor)});
 if(b.action==='save'||b.action==='import'){if(!Array.isArray(b.rows))throw Error('Add programme rows.');return res.json({saved:await saveProgrammes(b.rows,actor)});}return res.status(400).json({error:'Unknown action.'});
 }catch(e){console.error('programmes admin failed',{type:e.name});return res.status(400).json({error:/HTTPS|date|cycle|firm|programme|CSV|column|rows|Duplicate|too long|Invalid|Save between|Unclosed|Import at most|Unknown/.test(e.message)?e.message:'Could not save programmes. Please retry.'});}}
