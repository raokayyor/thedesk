// Realtime microphone transcription with a short-lived server-issued token.
window.DeskTeaserTranscript={start(stream,onText,onStatus){
 const s={queue:[],committed:'',text:'',ready:false,stopping:false};let resolveFlush;
 function cleanup(){clearTimeout(s.timeout);clearTimeout(s.closeTimer);s.node?.disconnect();s.source?.disconnect();s.gain?.disconnect();s.context?.close().catch(()=>{});if(s.socket&&s.socket.readyState<2)s.socket.close();resolveFlush?.();}
 const fail=()=>{if(s.failed||s.stopping)return;s.failed=true;cleanup();onStatus('Live connection unavailable. Your transcript will appear after you stop.');};
 s.timeout=setTimeout(fail,12000);
 (async()=>{
  s.context=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000});await s.context.resume();await s.context.audioWorklet.addModule('/interview-pcm-worklet.js');if(s.stopping||s.failed){cleanup();return;}
  s.source=s.context.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));s.node=new AudioWorkletNode(s.context,'desk-pcm-capture');s.gain=s.context.createGain();s.gain.gain.value=0;s.source.connect(s.node);s.node.connect(s.gain);s.gain.connect(s.context.destination);
  s.node.port.onmessage=e=>{if(s.stopping||s.failed)return;const data=new Uint8Array(e.data.length*2),view=new DataView(data.buffer);for(let i=0;i<e.data.length;i++)view.setInt16(i*2,Math.round(Math.max(-1,Math.min(1,e.data[i]))*32767),true);let binary='';for(const b of data)binary+=String.fromCharCode(b);const message=JSON.stringify({message_type:'input_audio_chunk',audio_base_64:btoa(binary),sample_rate:s.context.sampleRate});if(s.ready&&s.socket.readyState===1)s.socket.send(message);else if(s.queue.length<50)s.queue.push(message);};
  const r=await fetch('/api/interview-live-token',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(12000)});const d=await r.json();if(s.stopping||s.failed){cleanup();return;}if(!r.ok||!d.token)throw Error('token');
  const params=new URLSearchParams({model_id:'scribe_v2_realtime',token:d.token,audio_format:'pcm_'+s.context.sampleRate,language_code:'en',commit_strategy:'vad',vad_silence_threshold_secs:'0.7'});s.socket=new WebSocket('wss://api.elevenlabs.io/v1/speech-to-text/realtime?'+params);
  s.socket.onmessage=e=>{if(s.failed)return;let d;try{d=JSON.parse(e.data);}catch{return;}
   if(d.message_type==='session_started'){clearTimeout(s.timeout);s.ready=true;for(const m of s.queue)s.socket.send(m);s.queue=[];onStatus('Listening — your words will appear as you speak.');}
   else if(d.message_type==='partial_transcript'){s.text=(s.committed+' '+(d.text||'')).trim();onText(s.text);}
   else if(d.message_type==='committed_transcript'){s.committed=(s.committed+' '+(d.text||'')).trim();s.text=s.committed;onText(s.text);if(s.stopping)cleanup();}
   else if(d.error||/error|rate_limited|quota_exceeded/.test(d.message_type||''))fail();
  };s.socket.onerror=fail;s.socket.onclose=()=>{if(!s.stopping)fail();};
 })().catch(fail);
 return {cancel(){s.stopping=true;cleanup();},async finish(){if(s.stopping)return s.text;s.stopping=true;s.node?.disconnect();s.source?.disconnect();if(s.ready&&s.socket?.readyState===1){const pending=new Promise(resolve=>resolveFlush=resolve);s.socket.send(JSON.stringify({message_type:'input_audio_chunk',audio_base_64:btoa('\0'.repeat(3200)),sample_rate:s.context.sampleRate,commit:true}));s.closeTimer=setTimeout(cleanup,1500);await pending;}else cleanup();return s.failed?'':s.text;}};
}};
