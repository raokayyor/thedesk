
const $=s=>document.querySelector(s);let stream=null,recorder=null,chunks=[],recordingUrl='',speech=null,speechFinal='',tick=null,current=0,assessment=null;
let profile={name:'',targetSector:'Investment Banking / IBD',university:'',course:'',programme:'',targetFirm:''};
let questions=[
{q:'Tell me about yourself and walk me through the parts of your CV most relevant to this role.',hint:'Aim for 60–90 seconds. Keep it selective.'},
{q:'Talk me through the experience on your CV that best demonstrates your suitability for this role.',hint:'Be precise about your personal contribution.'},
{q:'Tell me about a time something did not go to plan. What did you do next?',hint:'Use one specific example and outcome.'},
{q:'Tell me about a recent market or company development you have been following.',hint:'Take a view and explain why it matters commercially.'},
{q:'Why this role, and why should we choose you?',hint:'Link your motivation to evidence from your CV.'}
];
function bits(cv){return (cv||'').split(/\n+/).map(x=>x.trim()).filter(x=>x.length>28&&x.length<220)}
function evidence(cv){const b=bits(cv);return (b.find(x=>/intern|analys|research|valuation|project|client|deal|transaction|society|investment|finance/i.test(x))||b[0]||'your strongest finance-related experience').replace(/^[•\-–]\s*/,'')}
function derive(){const cv=$('#cvText').value.trim(),ev=evidence(cv),firm=profile.targetFirm?' at '+profile.targetFirm:'',route=profile.targetSector||'your target role',weak=(assessment?.result?.competencies||[]).slice().sort((a,b)=>a.score-b.score)[0],missed=assessment?.quiz?.missed?.[0]?.topic;
questions=[
{q:'Tell me about yourself and walk me through the parts of your CV most relevant to '+route+firm+'.',hint:'Present → evidence → why this role.'},
{q:'On your CV you mention “'+ev+'”. What did you personally do, what did you conclude and what changed because of your work?',hint:'Separate your contribution from the team’s.'},
{q:weak?'Your application gives less evidence of '+weak.name.toLowerCase()+'. Give me a specific example that proves you are strong in this area.':'Tell me about a time you took ownership of a difficult decision.',hint:'Use one concrete example and outcome.'},
{q:missed?'You missed a question on “'+missed+'” in your assessment. Explain the concept, then tell me why it matters in '+route+'.':'Explain one technical or commercial concept that matters in '+route+'.',hint:'Definition → mechanism → practical relevance.'},
{q:'Why '+route+firm+', and what in your CV makes that motivation credible?',hint:'Avoid generic prestige answers. Use your own evidence.'}
];current=0;render()}
function render(){const q=questions[current];$('#question').textContent=q.q;$('#questionHint').textContent=q.hint;$('#questionLabel').textContent='Question '+(current+1)+' of '+questions.length;$('#progressTitle').textContent=(current+1)+' of '+questions.length;$('#progressBar').style.width=((current+1)/questions.length*100)+'%';$('#feedback').classList.remove('active');$('#transcript').value='';speechFinal='';$('#speechSupport').textContent='Waiting for recording';clearInterval(tick);$('#timer').textContent='01:30'}
async function enableCamera(){try{stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});$('#preview').srcObject=stream;$('#camStatus').textContent='Camera ready';$('#recordBtn').disabled=false;$('#cameraBtn').disabled=true;$('#cameraBtn').textContent='Camera + mic enabled'}catch(e){notice('Camera or microphone access was blocked. You can still paste a transcript.')}}
function setupSpeech(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$('#speechSupport').textContent='Live browser transcription unavailable — edit transcript manually';return}speech=new SR();speech.continuous=true;speech.interimResults=true;speech.lang='en-GB';speech.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)speechFinal+=t+' ';else interim+=t}$('#transcript').value=(speechFinal+interim).trim();$('#speechSupport').textContent='Transcribing live'};try{speech.start()}catch(e){}}
function start(){if(!stream)return;chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||'video/webm'});if(recordingUrl)URL.revokeObjectURL(recordingUrl);recordingUrl=URL.createObjectURL(blob);$('#playBtn').disabled=false;$('#speechSupport').textContent=$('#transcript').value?'Transcript ready — review before assessment':'Recording ready — add transcript manually if needed'};recorder.start();setupSpeech();let left=90;clearInterval(tick);tick=setInterval(()=>{left--;$('#timer').textContent=String(Math.floor(Math.max(left,0)/60)).padStart(2,'0')+':'+String(Math.max(left,0)%60).padStart(2,'0');if(left<=0)clearInterval(tick)},1000);$('#recordBtn').disabled=true;$('#stopBtn').disabled=false;$('#camStatus').textContent='Recording'}
function stop(){if(recorder&&recorder.state!=='inactive')recorder.stop();if(speech){try{speech.stop()}catch(e){}}clearInterval(tick);$('#recordBtn').disabled=false;$('#stopBtn').disabled=true;$('#camStatus').textContent='Camera ready'}
function play(){if(!recordingUrl)return;const v=$('#preview');v.srcObject=null;v.src=recordingUrl;v.muted=false;v.controls=true;v.play();v.onended=()=>{v.controls=false;v.muted=true;v.src='';v.srcObject=stream}}
function scores(t){const w=t.trim().split(/\s+/).filter(Boolean),l=t.toLowerCase(),conn=(l.match(/\b(first|second|because|therefore|however|result|outcome|finally|as a result)\b/g)||[]).length,num=(t.match(/\b\d+(?:\.\d+)?%?\b/g)||[]).length,act=(l.match(/\b(i led|i built|i analysed|i analyzed|i created|i decided|i presented|i researched|i improved|i delivered|i recommended|i owned)\b/g)||[]).length,role=(l.match(/\b(client|valuation|market|commercial|revenue|risk|investment|bank|deal|transaction|analysis|model|company|sector|team)\b/g)||[]).length,fill=(l.match(/\b(um|uh|like|you know|sort of|kind of|basically|literally)\b/g)||[]).length;const structure=Math.max(45,Math.min(92,52+conn*5+(w.length>90?10:w.length>50?5:0))),specificity=Math.max(40,Math.min(94,48+num*7+act*5)),relevance=Math.max(42,Math.min(94,50+Math.min(role,9)*4)),confidence=Math.max(38,Math.min(92,76-Math.min(fill,8)*5+(w.length>60?5:0)));return{wc:w.length,structure,specificity,relevance,confidence,overall:Math.round((structure+specificity+relevance+confidence)/4)}}
function assess(){const t=$('#transcript').value.trim();if(t.split(/\s+/).length<20){notice('Add a fuller transcript first — ideally at least 20 words.');return}const s=scores(t);$('#mStructure').textContent=s.structure;$('#mSpecificity').textContent=s.specificity;$('#mRelevance').textContent=s.relevance;$('#mConfidence').textContent=s.confidence;$('#overallScore').textContent=s.overall;let title,text;if(s.overall>=80){title='Strong answer. Now make it sharper.';text='The answer is structured and relevant. Make the evidence even more specific and memorable.'}else if(s.overall>=65){title='Credible answer, but still leaving points on the table.';text='A recruiter would understand it, but parts are still generic. Tighten ownership, evidence and the link to the role.'}else{title='This answer would be vulnerable in a real interview.';text='The content is not yet specific or structured enough. Clearer ownership and evidence are needed.'}$('#verdictTitle').textContent=title;$('#verdictText').textContent=text;const fixes=[];if(s.structure<72)fixes.push('Use a clearer beginning → action → result structure.');if(s.specificity<72)fixes.push('Add one concrete fact, number, decision or outcome from your CV.');if(s.relevance<72)fixes.push('Finish by explicitly connecting the example to '+(profile.targetSector||'the role')+'.');if(s.confidence<72)fixes.push('Cut filler language and shorten long sentences.');if(s.wc<60)fixes.push('Develop the example further; the answer is too short.');if(s.wc>220)fixes.push('Tighten the answer. Make the point faster.');if(!fixes.length)fixes.push('Keep the structure, but make the conclusion more distinctive.');$('#fixes').replaceChildren(...fixes.map(x=>{const li=document.createElement('li');li.textContent=x;return li}));$('#stronger').textContent='Start with the answer in one sentence. Then use one example from your CV — for example “'+evidence($('#cvText').value)+'” — and explain what happened, what you personally did, the conclusion or decision you reached, and the outcome. Finish by linking that evidence directly to '+(profile.targetSector||'the role')+'.';$('#feedback').classList.add('active');$('#feedback').scrollIntoView({behavior:'smooth'})}
function notice(x){$('#notice').textContent=x;$('#notice').style.display='block';setTimeout(()=>$('#notice').style.display='none',5000)}
async function loadAssessment(){
 const params=new URLSearchParams(location.search),id=params.get('id')||params.get('assessmentId'),sample=params.get('sample');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 const action=$('#profileAssessmentLink');
 try{
  if(sample&&!['amelia','emily','elliot'].includes(sample))throw new Error('This sample profile is not available.');
  const url=sample?'/samples/'+encodeURIComponent(sample)+'-report.json':'/api/interview-context'+(id?'?id='+encodeURIComponent(id):'');
  const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
  window.interviewContextStatus=response.status;
  if(!response.ok){
   if(response.status===401||response.status===404){
    $('#candidateName').textContent='No saved assessment';
    $('#candidateSummary').textContent=id?'Open this link in the browser where you completed your assessment, or start a new one.':'Start your free assessment to personalise your interview. You can also try the CV option below.';
    action.hidden=false;return;
   }
   throw new Error('Your assessment could not be loaded. Please refresh to try again.');
  }
  const saved=await response.json();if(!sample&&saved.success!==true)throw new Error('Your assessment could not be loaded.');
  assessment=saved;profile=saved.profile||{};
  const name=String(profile.name||'Your profile').trim().replace(/\p{L}[\p{L}\p{M}'’-]*/gu,w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
  $('#candidateName').textContent=(sample?'Sample: ':'')+name;
  $('#candidateSummary').textContent=[profile.targetSector,profile.targetFirm,profile.programme].filter(Boolean).join(' · ')||'Your saved assessment is ready for interview practice.';
  $('#route').textContent=profile.targetSector||'Not specified';
  $('#education').textContent=[String(profile.course||'').replace(/^\p{L}/u,c=>c.toUpperCase()),profile.university].filter(Boolean).join(' · ')||'Not specified';
  $('#stage').textContent=profile.programme||'Not specified';
  const cv=saved.cv?.text||saved.cv?.sourceText||'';
  $('#cvText').value=typeof cv==='string'?cv:'';
  $('#cvText').placeholder=cv?'Your saved CV is loaded.':'Add an experience you want to practise discussing.';
  action.hidden=true;derive();$('#cvText').dispatchEvent(new Event('input',{bubbles:true}));document.dispatchEvent(new Event('desk:cvloaded'));
 }catch(e){
  $('#candidateName').textContent='Profile unavailable';
  $('#candidateSummary').textContent=e.name==='AbortError'?'Loading took too long. Refresh to retry, or use the CV option below.':e.message;
  action.hidden=false;
 }finally{clearTimeout(timeout);}
}
$('#cameraBtn').onclick=enableCamera;$('#recordBtn').onclick=start;$('#stopBtn').onclick=stop;$('#playBtn').onclick=play;$('#assessBtn').onclick=assess;$('#buildQuestions').onclick=derive;$('#nextBtn').onclick=()=>{if(current<questions.length-1){current++;render();window.scrollTo({top:0,behavior:'smooth'})}else notice('Interview complete. Click “Use this CV” to restart.')};window.interviewProfileReady=loadAssessment();render();
