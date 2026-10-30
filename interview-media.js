(() => {
 const audioButton=document.getElementById('audioOnlyBtn'),cameraButton=document.getElementById('cameraBtn');
 async function connect(video){
  if(recorder?.state==='recording')return;
  audioButton.disabled=true;cameraButton.disabled=true;
  try{
   let next;
   try{next=await navigator.mediaDevices.getUserMedia({video,audio:true})}
   catch(error){if(!video||!['NotFoundError','OverconstrainedError'].includes(error.name))throw error;next=await navigator.mediaDevices.getUserMedia({video:false,audio:true})}
   if(stream)stream.getTracks().forEach(t=>t.stop());stream=next;
   const preview=document.getElementById('preview');preview.srcObject=stream;preview.muted=true;preview.controls=false;preview.play().catch(()=>{});
   const hasVideo=stream.getVideoTracks().length>0;
   document.getElementById('camStatus').textContent=hasVideo?'Camera + microphone ready':'Audio-only practice · microphone ready';
   document.getElementById('recordBtn').disabled=false;
   audioButton.textContent=hasVideo?'Switch to microphone only':'Microphone enabled';
   cameraButton.textContent=hasVideo?'Camera + mic enabled':'Enable camera + mic';
   notice(hasVideo?'Camera and microphone connected.':'Your answer will be recorded as audio. A camera is optional.');
  }catch(error){notice(error.name==='NotAllowedError'?'Microphone permission was not granted. Allow access in your browser, or type your answer below.':'No microphone could be connected. You can still type your answer below.')}
  finally{audioButton.disabled=false;cameraButton.disabled=false}
 }
 cameraButton.onclick=()=>connect(true);audioButton.onclick=()=>connect(false);
 let generation=0;
 const baseDerive=derive;
 derive=function(){const token=++generation,box=document.getElementById('frameworkStatus'),label=document.getElementById('frameworkStatusText');box.classList.remove('done');label.textContent='Applying the selected employer and role framework…';baseDerive();requestAnimationFrame(()=>{if(token!==generation)return;const firm=document.getElementById('firmSelect').selectedOptions[0]?.textContent||'General';label.textContent=firm+' practice framework applied · '+(document.getElementById('cvText').value.trim()?'CV evidence loaded':'No CV loaded')+' · Desk preparation guidance included';box.classList.add('done')})};
 derive();
})();
