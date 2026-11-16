import {interviewPhase} from './interview-focus-state.js';
// A focused interview surface. Move existing controls rather than replacing their handlers.
function initialise(){
 const row=document.querySelector('.interview-recording-row'),video=row?.querySelector('.interview-recording-controls'),question=document.querySelector('.qbox'),help=document.querySelector('.interview-cv-help');
 if(!row||!video||!question||!help)return;
 document.body.classList.add('interview-focus');
 const link=document.createElement('link');link.rel='stylesheet';link.href='/interview-focus.css';document.head.append(link);
 const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n};
 const pane=make('div','focus-question-pane');row.prepend(pane);pane.append(question);
 const coaching=make('details','focus-coaching'),summary=make('summary','','Help with this question');coaching.append(summary,help);pane.append(coaching);
 const transcript=document.querySelector('.transcript'),review=make('details','focus-review'),reviewTitle=make('summary','','Your transcript');review.append(reviewTitle,transcript);row.after(review);
 const dock=make('div','focus-actions'),status=make('p','focus-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');dock.append(status);
 const buttons=make('div','focus-action-buttons');dock.append(buttons);review.after(dock);
 for(const id of ['recordBtn','stopBtn','assessBtn','playBtn','transcriptNextBtn']){const n=document.getElementById(id);if(n)buttons.append(n)}
 const options=make('details','focus-settings'),optionsTitle=make('summary','','Camera, microphone & sound');options.append(optionsTitle);
 for(const n of [document.querySelector('.controls'),document.querySelector('.question-voice'),document.querySelector('.desk-video-tools')])if(n)options.append(n);
 video.append(options);
 const skipQuestion=document.getElementById('skipQuestionBtn');if(skipQuestion){skipQuestion.textContent='Skip this question';options.append(skipQuestion)}
 const placeholder=make('div','focus-camera-placeholder');placeholder.innerHTML='<span aria-hidden="true">◉</span><strong>Your camera preview</strong><p>Check your camera and microphone before you start.</p>';video.querySelector('.camera').append(placeholder);
 const step=make('div','focus-step','Check your setup');pane.prepend(step);
 const type=make('button','focus-type','Prefer to type your answer?');type.type='button';dock.append(type);type.onclick=()=>{review.open=true;transcript.querySelector('textarea')?.focus();};
 const exit=make('a','focus-exit','Exit interview');exit.href='/my.html';document.querySelector('.top')?.append(exit);
 let previous='',lastQuestion='';
 const set=(node,value)=>{if(node.textContent!==value)node.textContent=value};
 function sync(){
  const active=typeof recorder!=='undefined'&&recorder?.state==='recording',connected=typeof stream!=='undefined'&&stream?.getAudioTracks().some(t=>t.readyState==='live'),recorded=typeof recordingUrl!=='undefined'&&!!recordingUrl;
  const stage=document.getElementById('hvStage'),phase=stage&&!stage.hidden?document.getElementById('hvPhase')?.textContent:'',thinking=/thinking/i.test(phase),starting=!!window.DeskInterviewStarting;
  const feedback=document.getElementById('feedback')?.classList.contains('active'),typed=!!document.getElementById('transcript')?.value.trim();
  const state=interviewPhase({recording:active,starting,thinking,feedback,recorded:recorded||typed});
  document.body.dataset.interviewPhase=state;placeholder.hidden=!!(connected&&stream.getVideoTracks().some(t=>t.readyState==='live'))||!!document.getElementById('preview').getAttribute('src');set(placeholder.querySelector('strong'),connected?'Microphone only':'Your camera preview');set(placeholder.querySelector('p'),connected?'Your voice will be recorded. You can add your camera in settings.':'Check your camera and microphone before you start.');step.textContent=state==='ready'?'01 / Get ready':state==='listen'?'02 / Listen to the question':state==='prepare'?'02 / Prepare your answer':state==='record'?'03 / Your answer':state==='feedback'?'04 / Your feedback':'04 / Review your answer';
  const messages={ready:connected?'Camera and microphone ready. Start when you’re ready.':'Enable your camera and microphone, or choose microphone only.',listen:'Listen first. Your preparation time follows.',prepare:'Gather your thoughts. Recording starts when preparation time ends.',record:'Recording. Finish your answer whenever you’re ready.',review:'Check your transcript'+(recorded?' and play your recording':'')+', then get feedback.',feedback:'Review your feedback, then move to the next question.'};
  const voiceError=document.getElementById('voiceStatus')?.textContent||'';set(status,state==='ready'&&/could not|unable|failed|unavailable/i.test(voiceError)?voiceError:messages[state]);
  for(const [id,visible]of [['recordBtn',state==='ready'],['stopBtn',state==='record'],['assessBtn',!active&&!starting&&!thinking&&!feedback&&(recorded||typed)],['playBtn',recorded&&!active&&!starting&&!thinking],['transcriptNextBtn',feedback]]){const n=document.getElementById(id);if(n)n.hidden=!visible}
  const start=document.getElementById('recordBtn');if(state==='ready')set(start,connected?'Start answer':'Enable camera & start');
  if(!document.getElementById('assessBtn').disabled)set(document.getElementById('assessBtn'),'Get my feedback');set(document.getElementById('playBtn'),'Play my recording');
  if(state==='ready')set(document.getElementById('timer'),'Ready');
  set(reviewTitle,active?'Live transcript':'Your transcript');
  if(state!==previous){if(state==='record'){coaching.open=false;review.open=false}if(state==='review')review.open=true;previous=state}
  const q=document.getElementById('question')?.textContent;if(q!==lastQuestion){lastQuestion=q;review.open=false;coaching.open=false}
  type.hidden=active||starting||thinking||recorded||feedback;
  const skip=document.getElementById('hvSkip');if(skip&&!skip.hidden&&thinking&&skip.parentElement!==buttons)buttons.prepend(skip);
  if(skip)skip.hidden=!thinking;
  if(skipQuestion&&skipQuestion.parentElement!==options)options.append(skipQuestion);
  const retake=document.getElementById('hvRetake');if(retake){if(retake.parentElement!==buttons)buttons.append(retake);retake.hidden=!['review','feedback'].includes(state)}
 }
 sync();const timer=setInterval(sync,250);addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
// Earlier modules finish composing the workspace before this enhancement runs.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialise,{once:true});else initialise();
