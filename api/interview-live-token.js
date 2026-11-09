import {sameOrigin,owner,ownedRecord} from '../lib/report-store.mjs';
import {useQuota} from '../lib/value-accounts.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 const id=req.body?.assessmentId;if(typeof id!=='string'||!/^[a-f0-9]{48}$/.test(id))return res.status(400).json({error:'Open your saved interview to use live transcription.'});
 try{const who=owner(req,res);if(!who||!await ownedRecord(req,res,id))return res.status(404).json({error:'Assessment unavailable.'});if(!process.env.ELEVENLABS_API_KEY)return res.status(503).json({error:'Live transcription is unavailable.'});if(!await useQuota('interview-live:'+who,80))return res.status(429).json({error:'Daily live transcription allowance reached.'});const r=await fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const data=await r.json();if(typeof data.token!=='string')throw Error();return res.json({success:true,token:data.token})}catch{return res.status(503).json({error:'Live transcription could not connect. Your recorded answer can still be transcribed after Stop.'})}
}
