const root=document.getElementById('freeTry'),status=document.getElementById('tryStatus'),tool=new URLSearchParams(location.search).get('tool')||'interview';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ctx,win,answers=[],index=0,phase='most',firm,recorder,stream,chunks=[],started,audioUrl;
const here=location.pathname+location.search,upgrade='/membership-start.html?return='+encodeURIComponent(here);
async function api(body){const r=await fetch('/api/free-try'+(body?'':'?tool='+encodeURIComponent(tool)),{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify({tool,...body})}:{})});const d=await r.json();if(!r.ok)throw Error(d.error||'Please try again.');return d;}
function head(title){return '<div class="kicker">'+esc(ctx.title)+' · Your free try</div><h1>'+esc(title)+'</h1>';}
const gapText=text=>String(text||'').replace(/\[([^\]]+)\]/g,'<span class="gap">[$1]</span>');
function sourceLine(){return ctx.sample?'<p class="muted">Using a sample CV. <a href="/assessment-start.html">Add yours →</a></p>':'';}
function beats(){return '<div class="script card">'+(ctx.guide?.beats||[]).map(b=>'<small>'+esc(b.label)+'</small><p>'+(b.gap?'<span class="gap">'+esc(b.text)+'</span>':gapText(esc(b.text)))+'</p>').join('')+'</div>';}
function inputScreen(){
 document.body.dataset.stage='input';status.textContent='';
 if(ctx.saved)return showWin(ctx.saved,true);
 if(tool==='interview'){
  root.innerHTML=head('Build your answer.')+'<p class="quiz-question">'+esc(ctx.question)+'</p>'+sourceLine()+beats()+'<button class="primary" id="startAnswer">Use this guide · answer →</button><p class="muted">Amber prompts are yours to fill. Nothing is made up.</p>';
  document.getElementById('startAnswer').onclick=answerScreen;
 }else if(tool==='application'){
  root.innerHTML=head('Why this firm?')+'<p>Pick your firm. Add one honest reason if you have it.</p><div class="chips" id="firms">'+ctx.firms.map(f=>'<button data-firm="'+esc(f.key)+'" aria-pressed="'+(f.label===ctx.firm)+'">'+esc(f.label)+'</button>').join('')+'</div><label for="ownReason">Why does this work interest you? <span class="muted">Optional</span></label><textarea id="ownReason" maxlength="700" placeholder="One reason that is true for you…"></textarea><button class="primary" id="make">Build my opening →</button>';
  firm=ctx.firms.find(f=>f.label===ctx.firm)?.key;
  root.querySelectorAll('[data-firm]').forEach(b=>b.onclick=()=>{firm=b.dataset.firm;root.querySelectorAll('[data-firm]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  document.getElementById('make').onclick=()=>{if(!firm){status.textContent='Pick one firm first.';return;}submit({firm,text:document.getElementById('ownReason').value});};
 }else if(tool==='cv'){
  root.innerHTML=head('Fix one CV line.')+sourceLine()+'<label for="cvLine">Paste a line, or use this one</label><textarea id="cvLine" maxlength="1600">'+esc(ctx.cvLine)+'</textarea><details><summary>Add what you did or what changed ＋</summary><textarea id="cvDetail" maxlength="1000" placeholder="Only what really happened. A specific action or result helps."></textarea></details><button class="primary" id="make">Fix my line →</button>';
  document.getElementById('make').onclick=()=>submit({text:document.getElementById('cvLine').value,detail:document.getElementById('cvDetail').value});
 }else if(['sjt','verbal'].includes(tool))quizScreen();
 else if(tool==='group'){
  const c=ctx.content;root.innerHTML=head('Make your first contribution.')+'<p class="muted">Fictional group exercise · Harbour & Co</p><p>'+esc(c.brief.replace('in 20 minutes',''))+'</p><details><summary>The three options ↓</summary>'+c.options.map(o=>'<p><b>'+esc(o.name)+'</b><br>'+esc(o.facts)+'</p>').join('')+'</details><label for="contribution">What would you say first?</label><textarea id="contribution" placeholder="Your first contribution to the group…" maxlength="1400"></textarea><button class="primary" id="make">Show me a structured opening →</button>';document.getElementById('make').onclick=()=>submit({text:document.getElementById('contribution').value});
 }else{
  root.innerHTML=head(tool==='crib'?'Your CV, ready for the day.':'Your firm, in focus.')+sourceLine()+(tool==='firm'?'<div class="card"><h2>'+esc(ctx.content.title)+'</h2>'+ctx.content.lines.map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>':'<p>A pocket introduction and prompts built from your CV, with gaps where only you know the answer.</p>')+'<button class="primary" id="make">'+(tool==='crib'?'Build my pocket crib sheet':'Keep my firm preparation')+' →</button>';document.getElementById('make').onclick=()=>submit({});
 }
}
function answerScreen(){
 root.innerHTML=head('Your turn.')+'<p class="quiz-question">'+esc(ctx.question)+'</p><details><summary>Show my built answer ▾</summary>'+beats()+'</details><video id="camera" muted playsinline hidden></video><button class="secondary primary" id="record">Record my answer</button><div id="playback"></div><label for="answer">Type your answer, or record above</label><textarea id="answer" maxlength="6000" placeholder="Use your own words. Your actions, result and what you learned."></textarea><button class="primary" id="assess">Fix my answer →</button>';
 document.getElementById('record').onclick=record;document.getElementById('assess').onclick=()=>submit({text:document.getElementById('answer').value,inputMode:audioUrl?'spoken':'typed',seconds:started?Math.min(120,Math.round((Date.now()-started)/1000)):0});
}
async function record(){
 const button=document.getElementById('record');
 if(recorder?.state==='recording'){button.disabled=true;recorder.stop();return;}
 try{
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Recording is unavailable here. You can type your answer below.');
  stream=await navigator.mediaDevices.getUserMedia({audio:true,video:{facingMode:'user'}});
  const video=document.getElementById('camera');video.hidden=false;video.srcObject=stream;await video.play();
  // Transcribe an audio-only track: Safari video blobs are too large and can lose audio.
  const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(new MediaStream(stream.getAudioTracks()),mime?{mimeType:mime}:undefined);chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=async()=>{
   stream.getTracks().forEach(t=>t.stop());video.hidden=true;button.classList.remove('recording');button.textContent='Record again';button.disabled=false;
   const blob=new Blob(chunks,{type:recorder.mimeType||mime||'audio/mp4'});if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(blob);
   document.getElementById('playback').innerHTML='<audio controls src="'+audioUrl+'"></audio>';
   if(blob.size>2800000){status.textContent='Your recording is saved to play. It is too large to transcribe; type its wording below or record a shorter answer.';return;}
   status.textContent='Transcribing your recording…';button.disabled=true;
   try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});const r=await fetch('/api/interview-transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:data,mimeType:blob.type})});const d=await r.json();if(!r.ok||!d.text)throw Error(d.error||'No words were detected. Play your recording to check it, or type below.');document.getElementById('answer').value=d.text;status.textContent='Transcript ready. Check it, then fix your answer.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}
  };started=Date.now();recorder.start(1000);button.textContent='Done · stop recording';button.classList.add('recording');setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},120000);
 }catch(e){stream?.getTracks().forEach(t=>t.stop());status.textContent=e.message;}
}
function quizScreen(){
 const q=ctx.quiz[index],sjt=tool==='sjt',a=answers[index]||{most:null,least:null};
 root.innerHTML=head(sjt?'What would you do?':'Read, then decide.')+'<p class="quiz-progress">'+(index+1)+' of 5'+(sjt?' · Choose the '+(phase==='most'?'most':'least')+' effective action':'')+'</p>'+(q.passage?'<div class="passage">'+esc(q.passage)+'</div>':'')+'<p class="quiz-question">'+esc(q.scenario||q.statement||q.text)+'</p><div class="options">'+(sjt?q.options:['True','False','Cannot say']).map((o,i)=>{const value=sjt?i:['T','F','C'][i],selected=sjt?a[phase]===value:answers[index]===value;return '<button data-choice="'+value+'" aria-pressed="'+selected+'">'+esc(o)+'</button>';}).join('')+'</div><button class="primary" id="next">'+(sjt&&phase==='most'?'Next · least effective →':index===4?'See my result →':'Next question →')+'</button>';
 root.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const v=sjt?Number(b.dataset.choice):b.dataset.choice;if(sjt){if(a[phase==='most'?'least':'most']===v){status.textContent='Choose a different action for most and least.';return;}a[phase]=v;answers[index]=a;}else answers[index]=v;status.textContent='';root.querySelectorAll('[data-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
 document.getElementById('next').onclick=()=>{if(sjt?a[phase]===null:!answers[index]){status.textContent='Choose one answer first.';return;}status.textContent='';if(sjt&&phase==='most'){phase='least';quizScreen();return;}phase='most';if(index<4){index++;quizScreen();}else submit({answers});};
}
async function submit(body){
 const previous=root.innerHTML;root.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='Saving your result…';
 try{const d=await api(body);showWin(d.win,!!d.saved);}catch(e){status.textContent=e.message;root.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
function showWin(value,used=false){
 win=value;status.textContent='';document.body.dataset.stage='win';window.scrollTo(0,0);
 const parts=win.parts?.map(p=>'<p>'+(p.label?'<span class="beat-label">'+esc(p.label)+'</span>':'')+(p.gap?'<span class="gap">'+esc(p.text)+'</span>':gapText(esc(p.text)))+'</p>').join('');
 let after=parts||'<p>'+esc(win.after)+'</p>';if(win.hook)after=after.replace(esc(win.hook),'<mark>'+esc(win.hook)+'</mark>');
 const before=String(win.before||'');root.innerHTML=head(win.title)+(used?'<p class="used-note">✓ Used · your saved result</p>':'')+'<div class="score-row">'+(Number.isFinite(win.score)?'<span class="score">'+win.score+(win.total?'/'+win.total:'<small>/100</small>')+'</span>':'')+'<span class="tag">'+esc(typeof win.tag==='string'?win.tag:'Your answer score')+'</span></div><article class="card win"><div class="before '+(before.length>160?'long':'')+'"><span class="row-label">Yours</span><p>'+esc(before)+'</p></div><div class="after '+(tool==='interview'?'compact':'')+'"><span class="row-label">'+(tool==='firm'?'Your preparation':'Fixed')+'</span>'+after+'</div>'+(tool==='interview'&&before.length>160?'<details><summary>Your full original answer ↓</summary><p>'+esc(before)+'</p></details>':'')+'</article><p class="note">'+esc(win.note||'')+'</p>'+(win.source?'<a class="source" href="'+esc(win.source)+'" target="_blank" rel="noopener">Firm source →</a>':'')+(['group','firm','crib'].includes(tool)?'<button class="secondary primary" id="download">Save to my phone ↓</button>':'');
 let upsell=document.getElementById('tryUpgrade');if(!upsell){upsell=document.createElement('aside');upsell.id='tryUpgrade';upsell.className='upgrade';document.body.append(upsell);}upsell.innerHTML='<div><p>'+(used?'Members get this unlimited.':'That’s 1 of your free goes. Members fix every answer, every firm, unlimited.')+'</p><nav><a class="btn" href="'+upgrade+'">Unlock · £89</a><a class="btn secondary" href="/my.html">Back to My Desk</a></nav></div>';
 if(ctx.member){const destinations={interview:'/interview-start.html',application:'/applications.html',cv:'/cv-editor.html',sjt:'/practice-tests.html?type=sjt',verbal:'/practice-tests.html?type=verbal',group:'/group-exercise.html',firm:'/firm-interview-guides.html',crib:'/ac-crib.html'};upsell.innerHTML='<div><p>Membership unlocked. Your free result is kept here.</p><a class="btn" href="'+destinations[tool]+'">Continue in the full tool →</a></div>';}document.getElementById('download')?.addEventListener('click',saveImage);
}
function saveImage(){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1600;const c=canvas.getContext('2d');c.fillStyle='#f4f1ec';c.fillRect(0,0,1080,1600);c.fillStyle='#1f2a2e';c.font='bold 62px Georgia';c.fillText('The Desk',70,100);c.font='bold 43px Georgia';let y=200;
 const write=(text,font,max=940)=>{c.font=font;let line='';for(const word of text.split(/\s+/)){if(c.measureText(line+word).width>max){c.fillText(line,70,y);y+=44;line='';}line+=word+' ';}c.fillText(line,70,y);y+=62;};
 write(win.title,'bold 43px Georgia');write(win.after,'33px Arial');write(win.note||'','25px Arial');
 canvas.toBlob(blob=>{const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='the-desk-'+tool+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);});
}
window.addEventListener('pagehide',()=>stream?.getTracks().forEach(t=>t.stop()));
api().then(d=>{ctx=d;document.title=ctx.title+' · The Desk';inputScreen();document.documentElement.dataset.usable='true';document.documentElement.dataset.usableMs=Math.round(performance.now());}).catch(e=>{root.innerHTML='<h1>Your free try</h1><p>'+esc(e.message)+'</p><a class="btn" href="/signin.html?next='+encodeURIComponent(here)+'">Log in →</a><p><a href="/my.html">Back to My Desk</a></p>';status.textContent='';});
