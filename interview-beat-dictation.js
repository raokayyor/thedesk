// Short, explicit microphone capture. Dictation is an editable suggestion, never an automatic save.
export function dictateBeat({button,field,status,assessmentId,maxSeconds=20,onFinish=()=>{}}){
 let recorder,stream,timer,cancelled=false,finished=false;const chunks=[],original=field.value;
 const cleanup=()=>{clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());button.textContent='Say it instead';};
 const finish=()=>{if(finished)return;finished=true;cleanup();onFinish();};
 const cancel=()=>{cancelled=true;if(recorder?.state==='recording')recorder.stop();finish();};
 button.textContent='Stop dictation';status.textContent='Opening your microphone…';
 (async()=>{try{
 stream=await navigator.mediaDevices.getUserMedia({audio:true});if(cancelled){cleanup();return;}
 const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
 recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 recorder.onerror=()=>{status.textContent='Recording unavailable. You can type your wording instead.';cancel();};
 recorder.onstop=async()=>{cleanup();if(cancelled)return;try{
 const blob=new Blob(chunks,{type:recorder.mimeType});if(!blob.size)throw Error('No audio was captured. Try again or type your wording.');
 status.textContent='Transcribing your wording…';
 const audio=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
 const response=await fetch('/api/interview-transcribe',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessmentId,audio,mimeType:blob.type.split(';')[0]}),signal:AbortSignal.timeout(50000)}),data=await response.json();
 if(cancelled)return;if(!response.ok||!data.text?.trim())throw Error(data.error||'No speech was heard. Try again or type your wording.');
 if(!field.isConnected)return;
 if(field.value!==original){status.textContent='Your typed edit was kept. Dictation: '+data.text;return;}
 field.value=data.text.trim().slice(0,800);field.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='Check your wording, edit if needed, then save.';
 }catch(error){if(!cancelled)status.textContent=error.message;}finally{finish();}};
 recorder.start();status.textContent=`Listening · up to ${maxSeconds} seconds. Tap Stop dictation when done.`;
 timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},Math.min(20,maxSeconds)*1000);
 }catch(error){status.textContent='Microphone unavailable. You can type this section instead.';finish();}})();
 // A second press stops and transcribes; leaving the editor cancels instead.
 cancel.stop=()=>{if(recorder?.state==='recording')recorder.stop();};
 return cancel;
}
