const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function testSummary(tests){
 if(!tests)return 'Your saved test results are not available here.';
 if(tests.skipped)return 'You skipped the short tests. This score assesses your CV evidence only; numerical and commercial ability have not been assessed.';
 return `You scored ${tests.numerical}/${tests.numericalTotal} on numerical reasoning and ${tests.commercial}/${tests.commercialTotal} on the commercial questions.`;
}
export function assessmentEntryMarkup(e,returning=false){
 const score=`<section class="entry-score"><div><div class="kicker">Your free assessment</div><strong>${esc(e.score)}<small>/${esc(e.max)}</small></strong></div><span>${esc(e.band)}</span></section>`;
 const summary=`<section class="entry-summary"><h1>${e.unlocked?'Your detailed free assessment':'Your assessment summary'}</h1><p>${esc(e.summary||'Your saved assessment is ready to read.')}</p><p class="entry-test-summary">${esc(testSummary(e.tests))}</p></section>`;
 if(e.unlocked){
  const detail=e.detail||{};
  return score+summary+`<section class="entry-detail"><h2>Your CV evidence</h2>${(detail.competencies||[]).map(c=>`<article><h3>${esc(c.name)} <span>${esc(c.score)}/100</span></h3><p>${esc(c.reason)}</p></article>`).join('')}${detail.atsBand?`<p>ATS readiness: ${esc(detail.atsBand)}</p>`:''}</section><section class="entry-detail"><h2>What to work on</h2>${(e.fixes||[]).map(p=>`<article><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></article>`).join('')}</section><section class="entry-saved"><h2>Your assessment is saved</h2><p>Use the link in your email to return to it.</p><a class="ink" href="/my.html">Open My Desk →</a></section>`;
 }
 return (returning?'<p class="return-note">Welcome back. Your assessment is still here.</p>':'')+score+summary+`<section class="entry-email"><h2>Read your detailed free assessment</h2><p>See how your CV evidence and test results contribute to your score, where you are strongest and what to work on next.</p><form id="saveAssessmentResult"><label for="keepEmail">Email address</label><input id="keepEmail" type="email" autocomplete="email" required maxlength="254"><button class="ink">Read my full free assessment →</button><small>Free · no card. We’ll email your assessment link, then the weekly question. Unsubscribe anytime.</small><p role="status" id="saveResultStatus"></p></form></section>`;
}
export function renderAssessmentEntry(data,id){
 const e=data.entry,root=document.getElementById('resultContent');let returning=false;
 try{const old=JSON.parse(localStorage.getItem('desk-pending-result')||'null');returning=old?.id===id&&old.viewed===true&&Date.now()-old.savedAt<7*86400000;localStorage.setItem('desk-pending-result',JSON.stringify({id,savedAt:old?.id===id?old.savedAt:Date.now(),viewed:true,entry:{score:e.score,max:e.max,band:e.band,summary:e.summary,tests:e.tests}}));}catch{}
 root.classList.add('assessment-entry');root.innerHTML=assessmentEntryMarkup(e,returning);root.hidden=false;document.getElementById('resultStatus').hidden=true;document.getElementById('mobileUnlock').hidden=true;
 fetch('/api/result-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessmentId:id,event:'result_viewed'}),keepalive:true}).catch(()=>{});
 if(e.unlocked)return;
 document.getElementById('saveAssessmentResult').onsubmit=async ev=>{
  ev.preventDefault();const button=ev.target.querySelector('button'),status=document.getElementById('saveResultStatus');button.disabled=true;status.textContent='Saving your assessment…';
  try{
   const r=await fetch('/api/assessment-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessmentId:id,email:document.getElementById('keepEmail').value,returnTo:new URLSearchParams(location.search).get('return')||'/my.html'})}),j=await r.json();if(!r.ok)throw Error(j.error||'Please try again.');
   const response=await fetch('/api/assessment-result?id='+encodeURIComponent(id),{cache:'no-store'}),saved=await response.json();if(!response.ok||!saved.entry?.unlocked)throw Error('Your assessment was saved. Please refresh to open the detailed report.');
   try{localStorage.removeItem('desk-pending-result')}catch{}
   root.innerHTML=assessmentEntryMarkup(saved.entry);const heading=root.querySelector('h1');heading.tabIndex=-1;heading.focus();
   if(j.next?.startsWith('/')&&!j.next.startsWith('//'))root.querySelector('.entry-saved a').href=j.next;
  }catch(error){status.textContent=error.message;button.disabled=false;}
 };
}
