(() => {
 let enabled=false,current=null,controller=null,pending=null;const cache=new Map();
 const ready=fetch('/api/interview-voice',{credentials:'same-origin',signal:AbortSignal.timeout(3500)}).then(r=>r.ok?r.json():null).then(d=>{enabled=d?.enabled===true}).catch(()=>{});
 function cancel(){controller?.abort();controller=null;if(current){current.pause();current=null}if(pending){pending(false);pending=null}}
 async function speak(text,assessmentId){
  cancel();if(!enabled||!assessmentId)return false;
  const request=new AbortController();controller=request;let url=cache.get(text);
  try{
   if(!url){const response=await fetch('/api/interview-voice',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,assessmentId}),signal:request.signal});if(!response.ok)return false;const blob=await response.blob();if(!blob.type.startsWith('audio/'))return false;url=URL.createObjectURL(blob);if(request.signal.aborted){URL.revokeObjectURL(url);return false}cache.set(text,url);if(cache.size>16){const key=cache.keys().next().value;URL.revokeObjectURL(cache.get(key));cache.delete(key)}}
   if(request.signal.aborted)return false;
   return await new Promise(resolve=>{pending=resolve;const audio=new Audio(url);current=audio;const finish=ok=>{if(current===audio){current=null;pending=null}resolve(ok)};audio.onended=()=>finish(true);audio.onerror=()=>finish(false);audio.play().catch(()=>finish(false))});
  }catch{return false}
 }
 addEventListener('pagehide',()=>{cancel();for(const url of cache.values())URL.revokeObjectURL(url);cache.clear()});
 globalThis.DeskNaturalVoice={ready,get enabled(){return enabled},speak,cancel};
})();
