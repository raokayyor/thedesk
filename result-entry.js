import {practitionerComment} from './lib/practitioner-comments.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const gapMarkup=text=>esc(text).replace(/\[([^\]]+)\]/g,'<mark class="entry-gap">[$1]</mark>');
export function testSummary(tests){
 if(!tests)return 'Your saved test results are not available here.';
 if(tests.skipped)return 'We don’t have your test marks, so this is an incomplete readiness score. This number covers CV evidence only, out of 80. Numerical and commercial ability have not been assessed. Complete the tests for your full score out of 100.';
 return `You scored ${tests.numerical}/${tests.numericalTotal} on numerical reasoning and ${tests.commercial}/${tests.commercialTotal} on the commercial questions.`;
}
function emailForm(){return `<div class="entry-email" id="readFullAssessment"><h3>Read your full free assessment</h3><p>Your score breakdown, flagged lines and fact-grounded fixes. Missing facts stay marked for you to confirm.</p><form id="saveAssessmentResult"><label for="keepEmail">Email address</label><input id="keepEmail" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="you@example.com"><button class="ink">Show me the fix →</button><small>Free · no card. We’ll email your assessment link, then the weekly question. Unsubscribe anytime.</small><p role="status" id="saveResultStatus"></p></form></div>`;}
export function lineFixesMarkup(lines){return lines.map(line=>`<article class="entry-line-fix"><h3>Your CV line</h3><blockquote>${esc(line.original)}</blockquote><p>${esc(line.why)}</p><h3>Stronger version</h3><p class="entry-after">${gapMarkup(line.line)}</p></article>`).join('');}
export function assessmentEntryMarkup(e,returning=false,assessmentId=''){
 const score=`<section class="entry-score"><div><div class="kicker">${e.max!==100?'CV evidence only':'Your free assessment'}</div><strong>${esc(e.score)}<small>/${esc(e.max)}</small></strong></div><span>${esc(e.band)}</span></section>`;
 const university=e.university?`<p class="entry-university">${esc(e.university)}</p>`:'';
 const universityContext=e.universityContext?`<details class="entry-university-context"><summary>Your university in context</summary><p>${esc(e.universityContext.text)}</p><a href="${esc(e.universityContext.url)}" target="_blank" rel="noopener">${esc(e.universityContext.label)}</a><p>University reputation does not add or remove marks in this assessment. Your own evidence and test answers determine your score.</p></details>`:'';
 const summary=`<section class="entry-summary"><h1>${e.unlocked?'Your full free assessment':'Your assessment summary'}</h1>${university}<p>${esc(e.summary||'Your saved assessment is ready to read.')}</p>${e.advice?`<p class="entry-advice">${esc(e.advice)}</p>`:''}<p class="entry-test-summary">${esc(testSummary(e.tests))}</p>${universityContext}</section>`;
 const note=practitionerComment(e,assessmentId);
 const practitioner=`<section class="entry-practitioner" aria-label="Practitioner perspective"><div><img src="/assets/kayyor-rao.jpg" alt="Kayyor Rao" width="44" height="44"><p><strong>Practitioner perspective</strong><span>Kayyor Rao · Banking &amp; Markets</span></p></div><p>${esc(e.practitioner||note.comment)}</p><div class="entry-shortlist-teaser"><h3>What stops me shortlisting you is…</h3><p class="entry-locked-placeholder" aria-hidden="true">Your full explanation connects the evidence, the gaps and the changes that would strengthen your application.</p><small>Full reasoning in your member report.</small></div><details><summary>What this band means</summary><p>${esc(note.meaning)}</p><p>${esc(note.reason)}</p></details><small>20+ years in finance · Generated guidance using our practitioner-developed framework</small></section>`;
 const teaser=e.teaser;
 const lineCard=e.unlocked?`<section class="entry-line-card"><h2>Your flagged CV lines</h2><div id="entryLineFixes" aria-live="polite"><p>Preparing your fact-grounded fixes…</p></div></section>`:teaser?`<section class="entry-line-card"><h2>The lines costing you the most</h2><blockquote><mark>${esc(teaser.original)}</mark></blockquote><p>${esc(teaser.why)}</p><h3>Stronger version</h3><div class="entry-blur-wrap"><p class="entry-locked-placeholder" aria-hidden="true">${esc(teaser.placeholder)}</p><span>Reveal your fix below</span></div><p class="entry-more">${teaser.remainingCount>0?'+ '+esc(teaser.remainingCount)+' more '+(teaser.remainingCount===1?'line':'lines')+' flagged on your CV':'This is the only line flagged on your CV.'}</p>${practitioner}${emailForm()}</section>`:`<section class="entry-line-card"><h2>No weak lines flagged</h2><p>Your full assessment covers the evidence behind your score and your next preparation steps.</p>${practitioner}${emailForm()}</section>`;

 const top=(!e.unlocked?'<div class="entry-jump"><strong>Your summary report is here</strong><a href="#readFullAssessment">Read your full free assessment ↓</a></div>':'')+score+summary+lineCard+(e.unlocked?practitioner:'');
 if(!e.unlocked)return top;
 const detail=e.detail||{};
 return top+`<section class="entry-detail"><h2>Your CV evidence</h2>${(detail.competencies||[]).map(c=>`<article><h3>${esc(c.name)} <span>${esc(c.score)}/100</span></h3><p>${esc(c.reason)}</p></article>`).join('')}${detail.atsBand?`<p>ATS readiness: ${esc(detail.atsBand)}</p>`:''}</section><section class="entry-detail"><h2>What to work on</h2>${(e.fixes||[]).map(p=>`<article><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></article>`).join('')}</section><section class="entry-saved"><h2>Your assessment is saved</h2><p>Use the link in your email to return to it.</p><a class="ink" href="/my.html">Open My Desk →</a></section>`;
}
const pendingFixes=new Map();
function prepareLineFixes(id){if(!pendingFixes.has(id))pendingFixes.set(id,fetch('/api/assessment-line-fixes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessmentId:id,prepare:true})}).catch(()=>null));}
export async function loadLineFixes(id){
 const target=document.getElementById('entryLineFixes');if(!target)return;
 try{await pendingFixes.get(id);pendingFixes.delete(id);const response=await fetch('/api/assessment-line-fixes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessmentId:id})}),data=await response.json();if(!response.ok)throw Error(data.error||'Your fixes could not load.');target.innerHTML=data.lines.length?lineFixesMarkup(data.lines):'<p>No weak lines were flagged. Read your full assessment below.</p>';}
 catch(error){target.innerHTML=`<p role="status">${esc(error.message)}</p><button class="entry-retry" type="button">Retry the fixes</button><p>Your score and full assessment remain available below.</p>`;target.querySelector('button').onclick=()=>{target.innerHTML='<p>Preparing your fact-grounded fixes…</p>';loadLineFixes(id);};}
}
export function renderAssessmentEntry(data,id){
 const e=data.entry,root=document.getElementById('resultContent');let returning=false;
 try{const old=JSON.parse(localStorage.getItem('desk-pending-result')||'null');returning=old?.id===id&&old.viewed===true&&Date.now()-old.savedAt<7*86400000;localStorage.setItem('desk-pending-result',JSON.stringify({id,savedAt:old?.id===id?old.savedAt:Date.now(),viewed:true,entry:{score:e.score,max:e.max,band:e.band,summary:e.summary,tests:e.tests}}));}catch{}
 root.classList.add('assessment-entry');root.innerHTML=assessmentEntryMarkup(e,returning,id);root.hidden=false;document.getElementById('resultStatus').hidden=true;document.getElementById('mobileUnlock').hidden=true;
 fetch('/api/result-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessmentId:id,event:'result_viewed'}),keepalive:true}).catch(()=>{});
 if(e.unlocked){loadLineFixes(id);return;}
 prepareLineFixes(id);
 if(data.emailReady===false){const form=document.getElementById('saveAssessmentResult');form.querySelector('button').disabled=true;document.getElementById('keepEmail').disabled=true;document.getElementById('saveResultStatus').textContent='Email saving is currently unavailable. Your score and summary remain available in this browser.';form.onsubmit=event=>event.preventDefault();return;}
 document.getElementById('saveAssessmentResult').onsubmit=async ev=>{
  ev.preventDefault();const button=ev.target.querySelector('button'),status=document.getElementById('saveResultStatus');button.disabled=true;status.textContent='Saving your assessment…';
  try{
   const r=await fetch('/api/assessment-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessmentId:id,email:document.getElementById('keepEmail').value,returnTo:'/result-final-design.html?id='+encodeURIComponent(id)})}),j=await r.json();if(!r.ok)throw Error(j.error||'Please try again.');
   const response=await fetch('/api/assessment-result?id='+encodeURIComponent(id),{cache:'no-store'}),saved=await response.json();if(!response.ok||!saved.entry?.unlocked)throw Error('Your assessment was saved. Please refresh to open the full report.');
   try{localStorage.removeItem('desk-pending-result')}catch{}
   root.innerHTML=assessmentEntryMarkup(saved.entry,false,id);const heading=root.querySelector('h1');heading.tabIndex=-1;heading.focus();loadLineFixes(id);
  }catch(error){status.textContent=error.message;button.disabled=false;}
 };
}
