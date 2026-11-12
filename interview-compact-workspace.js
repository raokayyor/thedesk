// Keep the original recording and transcript nodes and their event handlers.
const row=document.querySelector('.interview-recording-row');
const controls=row?.querySelector('.interview-recording-controls');
const transcript=row?.querySelector('.transcript');
const cv=document.querySelector('.dc-cv'),pr=document.querySelector('.dc-pr');
if(row&&controls&&transcript){
 controls.append(transcript);
 const help=document.createElement('aside');help.className='interview-cv-help';help.setAttribute('aria-label','Answer from your CV');
 if(pr)help.append(pr);if(cv)help.append(cv);row.append(help);
 const timedStage=document.getElementById('hvStage'),camera=controls.querySelector('.camera');if(timedStage&&camera){camera.append(timedStage);timedStage.setAttribute('aria-label','HireVue countdown');}
 const style=document.createElement('style');style.textContent=`.camera{position:relative}.camera #hvStage{position:absolute;z-index:6;top:12px;right:12px;bottom:auto;left:auto;width:175px;max-width:calc(100% - 24px);margin:0;padding:12px;border:1px solid #ffffff40;border-radius:10px;background:#10191ef2;color:white;box-shadow:0 4px 18px #0003;text-align:center}.camera #hvStage[hidden]{display:none!important}.camera #hvPhase{font:700 11px/1.4 Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#dae8e9}.camera #hvClock{font:700 36px/1.2 Arial,sans-serif;margin:5px 0;color:white}.camera #hvClock.low{color:#ffad83}.camera #hvQ{display:none}.camera #hvStage .hv-row{margin:8px 0 0;gap:4px;justify-content:center}.camera #hvStage button{font-size:10px;line-height:1.4;min-height:30px;padding:6px 9px;border:1px solid #ffffff60;background:#ffffff12;color:white}.camera:has(#hvStage:not([hidden])) #timer{visibility:hidden}.interview-recording-row{align-items:start;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.interview-cv-help{min-width:0;padding:16px;background:#fffdfa}.interview-cv-help .dc-cv{margin:0 0 14px;padding:16px}.interview-cv-help .dc-pts{grid-template-columns:1fr!important}.interview-cv-help .dc-pr{margin:0 0 14px;padding:16px}.interview-recording-controls>.transcript{border-top:1px solid #d6dfeb;padding:16px}.interview-recording-controls #transcript{min-height:160px;max-height:260px}.dc-evidence-fold:not([open])>:not(summary){display:none!important}.dc-evidence-fold>summary{cursor:pointer;font-weight:700;font-size:14px;padding:4px 0}.dc-evidence-fold[open]>summary{margin-bottom:14px}.dc-answer-example{margin-top:16px;border-top:1px solid #ddd7cf;padding-top:12px}.dc-answer-example summary{cursor:pointer;font-weight:700}.dc-answer-example p{font-size:14px;line-height:1.65}body[data-desk-mode=test] .interview-cv-help{display:none}body[data-desk-mode=test] .interview-recording-row{grid-template-columns:1fr}@media(max-width:700px){.interview-recording-row{grid-template-columns:1fr}.interview-cv-help{border-top:1px solid #ddd7cf}}`;
 document.head.append(style);
}

// Keep firm preparation available beside the camera without a long open panel.
(()=>{
 const help=document.querySelector('.interview-cv-help');if(!help)return;
 const fold=document.createElement('details');fold.className='dc-cv';
 const summary=document.createElement('summary');summary.style.cssText='font-weight:700;cursor:pointer';fold.append(summary);
 const body=document.createElement('div');fold.append(body);help.append(fold);
 function draw(){
  const bank=globalThis.DeskInterviewBank,key=document.getElementById('firmSelect')?.value,firm=bank?.firms?.[key],pack=bank?.firmPacks?.[key];
  fold.hidden=!key||key==='general';if(fold.hidden)return;
  summary.textContent=(firm?.label||'Your firm')+' · preparation & practitioner tips';body.replaceChildren();
  const add=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;body.append(el);return el};
  add('h4','Understand the firm');add('p',firm?.focus||'Choose your target firm in interview setup to see relevant preparation.');
  add('h4','Preparation priorities');const ul=add('ul','');for(const text of pack?.tests||['Know the work and clients of your chosen team.','Connect your motivation to a genuine CV example.']){const li=document.createElement('li');li.textContent=text;ul.append(li)}
  add('h4','Practitioner guidance');add('p','Lead with your own contribution. Explain a decision and its outcome, then connect it to the role. Research one specific reason for this firm rather than relying on reputation.');
  add('p','The Desk preparation guidance; these are practice themes, not confirmed employer questions.').style.cssText='font-size:11px;color:#64748b';
 }
 draw();document.addEventListener('desk:questionchange',draw);document.getElementById('firmSelect')?.addEventListener('change',draw);setTimeout(draw,1500);
 const style=document.createElement('style');style.textContent='.interview-recording-controls .voice-controls{padding:12px}.interview-cv-help .dc-cv[hidden]{display:none!important}.interview-cv-help details h4{margin:16px 0 6px}.interview-cv-help details p,.interview-cv-help details li{font-size:13px;line-height:1.6}.session-context{padding:14px 18px!important;min-height:0!important}.session-context h2{margin:6px 0!important}.session-context>div:empty{display:none}';document.head.append(style);
})();
