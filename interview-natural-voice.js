(() => {
 let lastError='',enabled=false,current=null,controller=null,pending=null;const cache=new Map();
 let checking=null;
 function ensureReady(){if(enabled)return Promise.resolve(true);if(!checking)checking=fetch('/api/interview-voice',{credentials:'same-origin',signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.json():null).then(d=>enabled=d?.enabled===true).catch(()=>false).finally(()=>checking=null);return checking}
 const ready=ensureReady();
 function voiceEvent(state,audio){dispatchEvent(new CustomEvent('desk-interviewer-voice',{detail:{state,audio}}))}
 function cancel(){voiceEvent('waiting');controller?.abort();controller=null;if(current){current.pause();current=null}if(pending){pending(false);pending=null}}
 async function speak(text,assessmentId){
  cancel();lastError='';if(!await ensureReady()){lastError='The interviewer voice is not configured on this Preview.';return false;}
  const request=new AbortController();controller=request;let url=cache.get(text);
  try{
   if(!url){const response=await fetch('/api/interview-voice',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,assessmentId}),signal:request.signal});if(!response.ok){const data=await response.json().catch(()=>({}));lastError=data.error||'Question audio is temporarily unavailable.';return false;}const blob=await response.blob();if(!blob.type.startsWith('audio/'))return false;url=URL.createObjectURL(blob);if(request.signal.aborted){URL.revokeObjectURL(url);return false}cache.set(text,url);if(cache.size>16){const key=cache.keys().next().value;URL.revokeObjectURL(cache.get(key));cache.delete(key)}}
   if(request.signal.aborted)return false;
   return await new Promise(resolve=>{pending=resolve;const audio=new Audio(url);current=audio;const finish=ok=>{voiceEvent('waiting');if(current===audio){current=null;pending=null}resolve(ok)};audio.onplay=()=>voiceEvent('speaking',audio);audio.onended=()=>finish(true);audio.onerror=()=>finish(false);audio.play().catch(()=>{lastError='Your browser paused playback. Press Play question below.';audio.controls=true;audio.setAttribute('aria-label','Play question');const host=document.getElementById('voiceStatus');host?.insertAdjacentElement('afterend',audio);audio.style.cssText='width:100%;margin-top:8px';finish(false)})});
  }catch{return false}
 }
 addEventListener('pagehide',()=>{cancel();for(const url of cache.values())URL.revokeObjectURL(url);cache.clear()});
 globalThis.DeskNaturalVoice={ready,ensureReady,get error(){return lastError},get enabled(){return enabled},speak,cancel};
})();
