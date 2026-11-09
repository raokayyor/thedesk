(() => {
 const button=document.getElementById('assessBtn'),transcript=document.getElementById('transcript');
 const style=document.createElement('style');style.textContent=`.review-progress{margin:16px 0;padding:18px;border-radius:10px;background:#edf3fa;color:#1d4e89;font-size:14px}.review-progress[hidden]{display:none}.review-lines{padding:24px;border-top:1px solid #ddd7cf}.review-lines h3{font-size:24px}.review-lines article{padding:16px;margin:12px 0;background:#fff;border:1px solid #dce2e8;border-radius:10px}.review-lines blockquote{margin:0 0 10px;padding-left:13px;border-left:3px solid #1d4e89;font-size:14px;overflow-wrap:anywhere}.review-lines p,.review-lines li{font-size:14px;line-height:1.6}.review-lines .sentence{color:#1d4e89}.question-next{font-size:13px;padding:12px 18px;margin-left:8px}.review-notice{font-size:12px;color:#657482}.feedback.star-feedback .overall,.feedback.star-feedback .scoregrid,.feedback.star-feedback .feedbackBody{display:none}.feedback.star-feedback .feedbackTop{grid-template-columns:1fr}`;document.head.append(style);
 const progress=document.createElement('div');progress.className='review-progress';progress.hidden=true;progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');transcript.after(progress);
 const details=document.createElement('section');details.className='review-lines';details.hidden=true;document.querySelector('#feedback .nextRow').before(details);
 const topNext=document.createElement('button');topNext.type='button';topNext.className='secondary question-next';topNext.textContent='Next question →';topNext.hidden=true;button.after(topNext);
 topNext.onclick=()=>document.getElementById('nextBtn').click();
 let generation=0,busy=false;
 const baseRender=render;
 render=function(){generation++;baseRender();details.hidden=true;progress.hidden=true;topNext.hidden=true;document.getElementById('feedback').classList.remove('star-feedback')};
 const baseAssess=assess;
 assess=async function(){
  if(busy)return;
  if(recorder?.state==='recording'){notice('Stop your recording first, then review the transcript.');return}
  const text=transcript.value.trim(),q=questions[current];
  if(q.challenge||text.split(/\s+/).length<20){baseAssess();topNext.hidden=!document.getElementById('feedback').classList.contains('active');return}
  const token=++generation;busy=true;details.hidden=true;topNext.hidden=true;document.getElementById('feedback').classList.remove('active');progress.hidden=false;
  const controls=[...document.querySelectorAll('button,select,input,textarea')];const disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  try{
   progress.textContent='Reviewing your transcript…';await pause(1800);if(token!==generation)return;
   const review=DeskInterviewReview.reviewTranscript(text,q,profile.targetSector||'the role');
   progress.textContent=review.star?'Checking Situation, Task, Action and Result…':'Checking your personal contribution, evidence and answer structure…';await pause(1800);if(token!==generation)return;
   progress.textContent='Preparing specific feedback and sentence starters…';await pause(1600);if(token!==generation)return;
   baseAssess();document.getElementById('feedback').classList.toggle('star-feedback',!!review.star);if(review.star){const missing=review.star.filter(x=>!x.evidence).map(x=>x.label);document.getElementById('verdictTitle').textContent=missing.length?'Make your '+missing.join(', ')+' clearer.':'Your answer has evidence for all four STAR parts.';document.getElementById('verdictText').textContent=missing.length?'Use the breakdown below to add the missing context, responsibility, personal action or supported outcome.':'Now check that the example directly answers the question, explains why you chose your approach, and gives an outcome you can support.'}details.replaceChildren();if(review.star){const star=document.createElement('section');star.className='star-review';const title=document.createElement('h3');title.textContent='Your STAR breakdown';const explainer=document.createElement('p');explainer.textContent='A structure check of your transcript. Review the quoted evidence and strengthen any missing parts.';star.append(title,explainer);for(const part of review.star){const card=document.createElement('article'),h=document.createElement('h4'),status=document.createElement('p'),quote=document.createElement('blockquote'),prompt=document.createElement('p'),starter=document.createElement('p');h.textContent=part.label;status.className='star-state';status.textContent=part.status;quote.textContent=part.evidence||'No clear evidence picked up in this transcript.';prompt.textContent=part.prompt;starter.className='sentence';starter.textContent='Sentence starter: “'+part.starter+'”';card.append(h,status,quote,prompt,starter);star.append(card)}details.append(star)}const heading=document.createElement('h3');heading.textContent='Work on these lines';details.append(heading);
   for(const point of review.points){const article=document.createElement('article'),quote=document.createElement('blockquote'),comment=document.createElement('p'),suggestion=document.createElement('p');quote.textContent=point.quote;comment.textContent=point.comment;suggestion.className='sentence';suggestion.textContent='Try this structure: '+point.suggestion;article.append(quote,comment,suggestion);details.append(article)}
   const title=document.createElement('h3');title.textContent='Sentences you can adapt';const list=document.createElement('ul');for(const text of review.starters){const li=document.createElement('li');li.textContent=text;list.append(li)}const note=document.createElement('p');note.className='review-notice';note.textContent=review.note;details.append(title,list,note);details.hidden=false;topNext.hidden=false;
   document.getElementById('overallScore').closest('.overall').querySelector('.kicker').textContent='Practice indicator';document.querySelector('#feedback .verdict .kicker').textContent='Transcript feedback';
   document.getElementById('nextBtn').style.fontSize='14px';
  }finally{busy=false;controls.forEach((el,i)=>el.disabled=disabled[i]);progress.hidden=true;button.textContent='Review this answer again'}
 };
 button.onclick=assess;
})();
