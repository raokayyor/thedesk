import {sameOrigin,owner,ownedRecord,sql} from '../lib/report-store.mjs';
import {voiceConfigured,voiceText,generateInterviewSpeech} from '../lib/interview-voice.mjs';
export const config={api:{bodyParser:{sizeLimit:'8kb'}}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method==='GET')return res.json({enabled:voiceConfigured()});
 if(req.method!=='POST')return res.status(405).end();
 if(!sameOrigin(req,res))return;
 if(!voiceConfigured())return res.status(503).json({error:'Natural voice is not configured yet.'});
 const text=voiceText(req.body?.text),id=req.body?.assessmentId;
 if(text.length<3||text.length>1600||(id!=null&&(typeof id!=='string'||!/^[a-f0-9]{48}$/.test(id))))return res.status(400).json({error:'Invalid interview question.'});
 const who=owner(req,res,id==null);if(!who)return res.status(401).json({error:'Open your saved assessment to use natural voice.'});
 try{
  if(id!=null&&!await ownedRecord(req,res,id))return res.status(404).json({error:'Assessment unavailable.'});
  await sql().query('CREATE TABLE IF NOT EXISTS desk_voice_limits (owner_hash text NOT NULL, day date NOT NULL, calls integer NOT NULL DEFAULT 0, PRIMARY KEY(owner_hash,day))');
  const allowed=await sql().query('INSERT INTO desk_voice_limits(owner_hash,day,calls) VALUES($1,CURRENT_DATE,1) ON CONFLICT(owner_hash,day) DO UPDATE SET calls=desk_voice_limits.calls+1 WHERE desk_voice_limits.calls<80 RETURNING calls',[who]);
  if(!allowed.length)return res.status(429).json({error:'Daily voice allowance reached. You can still read the questions.'});
  const audio=await generateInterviewSpeech(text);res.setHeader('Content-Type','audio/mpeg');return res.status(200).send(audio);
 }catch{return res.status(503).json({error:'Natural voice is temporarily unavailable. Try again or use device voice.'})}
}
