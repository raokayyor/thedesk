import {sameOrigin,owner,ownedRecord} from '../lib/report-store.mjs';
import {useQuota} from '../lib/value-accounts.mjs';
export const config={api:{bodyParser:{sizeLimit:'4mb'}}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method==='GET')return res.json({enabled:!!process.env.ELEVENLABS_API_KEY});
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 const {assessmentId,audio,mimeType}=req.body||{};
 if(typeof assessmentId!=='string'||!/^[a-f0-9]{48}$/.test(assessmentId)||typeof audio!=='string'||audio.length<100||audio.length>3900000||!['audio/webm','audio/mp4','audio/ogg'].includes(mimeType)||!/^[A-Za-z0-9+/]+={0,2}$/.test(audio))return res.status(400).json({error:'Record an audio answer of up to three minutes and try again.'});
 if(!process.env.ELEVENLABS_API_KEY)return res.status(503).json({error:'Recorded-audio transcription is unavailable. Your recording is still available to play; you can type its transcript.'});
 try{const who=owner(req,res);if(!who||!await ownedRecord(req,res,assessmentId))return res.status(404).json({error:'Open your saved assessment to transcribe an answer.'});if(!await useQuota('interview-transcribe:'+who,80))return res.status(429).json({error:'Daily transcription allowance reached. You can still play your recording and type an answer.'});
 const bytes=Buffer.from(audio,'base64'),form=new FormData();form.set('file',new Blob([bytes],{type:mimeType}),'answer.'+({ 'audio/webm':'webm','audio/mp4':'m4a','audio/ogg':'ogg'}[mimeType]));form.set('model_id','scribe_v2');form.set('language_code','eng');form.set('tag_audio_events','false');form.set('diarize','false');
 const response=await fetch('https://api.elevenlabs.io/v1/speech-to-text',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},body:form,signal:AbortSignal.timeout(45000)});if(!response.ok)return res.status(503).json({error:'Audio transcription is temporarily unavailable. Your recording is safe to play back; retry recording or type the transcript.'});const data=await response.json();const text=typeof data.text==='string'?data.text.trim().slice(0,20000):'';return res.json({success:true,text});
 }catch{return res.status(503).json({error:'Audio transcription could not finish. Play your recording to check the microphone, then retry or type your answer.'})}
}
