// The free check uses the same server-side ElevenLabs endpoints as the full interview.
window.DeskTeaserMedia = {
  mount(root, question, submit) {
    root.innerHTML = `<p class="mute">The same opening question for everyone. Hear it, then record up to 30 seconds. Review your transcript before marking. One free check a week.</p>
      <video id="teaserPreview" autoplay muted playsinline hidden style="width:100%;max-height:240px;background:#111;border-radius:12px"></video>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0"><button class="btn ghost" id="teaserHear">Hear question</button><button class="btn ghost" id="teaserCamera">Enable camera + mic</button><button class="btn hot" id="teaserStart">Start recording · microphone</button><button class="btn" id="teaserStop" disabled>Stop & review</button></div>
      <div class="clock" id="teaserClock">0:30</div><p class="mute" id="teaserStatus" role="status">Ready. Your camera is optional. Your words appear as you speak.</p>
      <audio id="teaserPlayback" controls hidden style="width:100%"></audio><label for="teaserText">Your answer — review or type here</label><textarea id="teaserText" placeholder="Your words will appear here as you speak."></textarea><button class="btn hot" id="teaserMark" style="margin-top:12px">Mark my answer</button>`;
    const $ = id => root.querySelector('#'+id);
    let live, stream, recorder, timer, started=0, seconds=0, audio, audioUrl, playbackUrl, busy=false, chunks=[];
    const status = message => $('teaserStatus').textContent=message;
    const release = () => { stream?.getTracks().forEach(t=>t.stop()); stream=null; $('teaserPreview').srcObject=null; };
    const controls = () => {
      const recording=recorder?.state==='recording';
      $('teaserHear').disabled=busy||recording;
      $('teaserCamera').disabled=busy||recording;
      $('teaserStart').disabled=busy||recording;
      $('teaserStop').disabled=!recording;
      $('teaserMark').disabled=busy||recording;
      $('teaserText').readOnly=busy||recording;
    };
    async function jsonRequest(url, body) {
      const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
      const d=await r.json().catch(()=>({})); if(!r.ok)throw Error(d.error||'Please try again.');return d;
    }
    $('teaserHear').onclick=async()=>{
      busy=true;controls();status('Preparing question…');
      try {
        if(!audioUrl){const r=await fetch('/api/interview-voice',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:question}),signal:AbortSignal.timeout(60000)});if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.error||'The question audio is unavailable.');}audioUrl=URL.createObjectURL(await r.blob());}
        audio=new Audio(audioUrl);audio.onended=()=>{busy=false;controls();status('Question finished. Click Start recording when ready.');};audio.onerror=()=>{busy=false;controls();status('Audio could not play. Click Hear question to retry.');};await audio.play();status('Reading your question…');
      }catch(e){busy=false;controls();status(e.message);}
    };
    $('teaserCamera').onclick=async()=>{
      busy=true;controls();
      try{release();stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true});$('teaserPreview').srcObject=stream;$('teaserPreview').hidden=false;status('Camera + microphone ready. Click Start recording.');}
      catch{release();status('Camera access failed. You can record with just the microphone or type your answer.');}
      finally{busy=false;controls();}
    };
    const stop=()=>{if(recorder?.state!=='recording')return;clearInterval(timer);seconds=Math.min(30,Math.round((performance.now()-started)/1000));busy=true;recorder.stop();controls();status('Transcribing…');};
    $('teaserStop').onclick=stop;
    $('teaserStart').onclick=async()=>{
      busy=true;controls();status('Requesting microphone…');
      try{
        if(!window.MediaRecorder||!navigator.mediaDevices?.getUserMedia)throw Error('Recording is unavailable in this browser. Type your answer below.');
        if(!stream?.getAudioTracks().some(t=>t.readyState==='live'))stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const audioOnly=new MediaStream(stream.getAudioTracks());
        const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
        recorder=new MediaRecorder(audioOnly,mime?{mimeType:mime}:undefined);chunks=[];
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        recorder.onstop=async()=>{
          release();
          try{
            const liveText=await live?.finish();
            const blob=new Blob(chunks,{type:recorder.mimeType});if(playbackUrl)URL.revokeObjectURL(playbackUrl);playbackUrl=URL.createObjectURL(blob);$('teaserPlayback').src=playbackUrl;$('teaserPlayback').hidden=false;
            if(liveText?.trim()){$('teaserText').value=liveText;status('Transcript ready. Review it, then mark your answer.');return;}
            const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
            const d=await jsonRequest('/api/interview-transcribe',{audio:base64,mimeType:recorder.mimeType.split(';')[0]});
            $('teaserText').value=d.text||'';status(d.text?'Transcript ready. Review it, then mark your answer.':'No speech detected. Play the recording, retry or type your answer.');
          }catch(e){status(e.message+' Your recording is available to play; you can type or correct the transcript.');}
          finally{busy=false;controls();}
        };
        recorder.onerror=()=>{clearInterval(timer);release();busy=false;controls();status('Recording failed. Retry or type your answer.');};
        live?.cancel();$('teaserText').value='';live=window.DeskTeaserTranscript?.start(stream,text=>{$('teaserText').value=text;},status);recorder.start();started=performance.now();seconds=0;busy=false;controls();status('Recording your answer. You have 30 seconds.');
        timer=setInterval(()=>{const left=Math.max(0,30-(performance.now()-started)/1000);$('teaserClock').textContent='0:'+String(Math.ceil(left)).padStart(2,'0');if(!left)stop();},100);
      }catch(e){release();busy=false;controls();status(e.message||'Microphone access failed. Allow access or type your answer.');}
    };
    $('teaserMark').onclick=()=>{
      const text=$('teaserText').value.trim();if(text.split(/\s+/).filter(Boolean).length<20){status('Add at least 20 words before marking your answer.');return;}
      live?.cancel();release();clearInterval(timer);audio?.pause();if(audioUrl)URL.revokeObjectURL(audioUrl);if(playbackUrl)URL.revokeObjectURL(playbackUrl);submit(text,seconds);
    };
    window.addEventListener('pagehide',()=>{live?.cancel();clearInterval(timer);audio?.pause();release();if(audioUrl)URL.revokeObjectURL(audioUrl);if(playbackUrl)URL.revokeObjectURL(playbackUrl);},{once:true});
  }
};
