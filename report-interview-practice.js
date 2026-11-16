// CV-led questions in the report: listen first, then practise the answer.
(() => {
 let active=null,version=0;
 function stop(){version++;window.DeskNaturalVoice?.cancel();if(active){clearInterval(active.interval);active.button.textContent='Start';active.clock.textContent='1:30';active=null;}}
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-start]');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(active?.button===button){stop();return;}
  stop();const token=version,card=button.closest('.iq'),clock=card.querySelector('[data-timer]');
  active={button,clock};button.textContent='Stop';clock.textContent='Listening…';
  let status=card.querySelector('.report-voice-status');if(!status){status=document.createElement('p');status.className='report-voice-status';status.setAttribute('role','status');card.append(status);}
  status.textContent='Listen to the question. Your answer time starts afterwards.';
  const heard=await window.DeskNaturalVoice?.speak(card.querySelector('.qq').textContent,new URLSearchParams(location.search).get('id'));
  if(token!==version)return;
  if(!heard){stop();status.textContent='Question audio could not play. Press Start to try again.';return;}
  let seconds=90;clock.textContent='1:30';status.textContent='Your turn. Answer aloud; this report timer does not record you.';
  active.interval=setInterval(()=>{seconds--;clock.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(seconds<=0){stop();clock.textContent='Time';status.textContent='Compare your answer with the example, then practise in your own words.';}},1000);
 },true);
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-spoken-draft]');if(!button)return;
  const card=button.closest('.iq'),output=card.querySelector('.strong'),label=output.querySelector('.label');
  button.disabled=true;button.textContent='Writing your spoken answer…';
  try{const response=await fetch('/api/interview-draft',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:card.querySelector('.qq').textContent,kind:'cv'})});const data=await response.json();if(!response.ok||!data.draft?.script)throw Error(data.error||'Please try again.');output.replaceChildren(label);const script=document.createElement('p');script.style.whiteSpace='pre-wrap';script.textContent=data.draft.script;output.append(script);button.textContent='Rewrite spoken example';}
  catch(error){button.textContent='Try spoken example again';let status=card.querySelector('.draft-error');if(!status){status=document.createElement('p');status.className='draft-error';button.after(status);}status.textContent=error.message;}
  finally{button.disabled=false;}
 });
 addEventListener('hashchange',stop);addEventListener('pagehide',stop);
})();
