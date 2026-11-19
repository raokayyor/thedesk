(()=>{
const bank=window.DeskInterviewBank,$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);
const firmKeys=Object.keys(bank.firmPacks);
let firm=bank.resolveFirm(params.get('firm')||'')||firmKeys[0];
if(!bank.firmPacks[firm])firm=firmKeys[0];
let role=params.get('role');
const kinds={cv:'Your experience',technical:'Technical',motivation:'Motivation',commercial:'Commercial',case:'Case',competency:'Competency'};
const techLink=q=>{const t=window.DeskTechnicalExamples?.find?.(q);return t?` <a class="dc-link" href="/library.html?topic=${esc(t.id)}#technicals">How to answer: ${esc(t.title)} →</a>`:'';};
function chips(host,items,current,onPick){
 host.replaceChildren(...items.map(([key,label])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(key===current));b.onclick=()=>onPick(key);return b;}));
}
function sync(){const u=new URL(location.href);u.searchParams.set('firm',firm);u.searchParams.set('role',role);history.replaceState(null,'',u);}
function pickFirm(key){firm=key;const roles=bank.firms[firm].roles;if(!roles.includes(role))role=roles[0];draw();}
function pickRole(key){role=key;draw();}
function draw(){
 const f=bank.firms[firm],pack=bank.firmPacks[firm],review=bank.reviewPacks?.[firm],roles=f.roles;
 if(!roles.includes(role))role=roles[0];
 const r=bank.roles[role]||{label:role};
 chips($('firmChips'),firmKeys.map(k=>[k,bank.firms[k].label]),firm,pickFirm);
 chips($('roleChips'),roles.map(k=>[k,bank.roles[k]?.label||k]),role,pickRole);
 sync();document.title=f.label+' firm pack | The Desk';
 const firmQs=(pack.qs||[]).filter(q=>!q.roles||q.roles.includes(role));
 const roleQs=[['Technical',r.technical],['Case',r.case],['Stretch',r.stretch]].filter(([,q])=>q);
 const qItem=(kind,q,body)=>`<details><summary><span><span class="fp-kind">${esc(kind)}</span>${esc(q)}</span></summary>${body}</details>`;
 const practise=`/interview-start.html?firm=${encodeURIComponent(firm)}&libraryRole=${encodeURIComponent(role)}`;
 $('firmGuide').innerHTML=`<div class="fp-layout"><div>
 <section class="fp-card"><div class="fp-head"><div><div class="dc-k">Firm pack</div><h2>${esc(f.label)}</h2><span class="fp-role">${esc(r.label)}</span></div><a class="dc-btn" href="${practise}">Practise ${esc(f.label)} on camera →</a></div>
 <p class="fp-focus">${esc(f.focus)}</p>
 <div class="fp-cols"><div><h3>What they look for</h3><ul class="fp-ticks">${(pack.tests||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>
 <div><h3>Know before you go</h3><ul class="fp-ticks">${(pack.know||[]).map(t=>`<li>${esc(t)}</li>`).join('')||'<li>Check the firm’s current business lines, clients and recent results.</li>'}</ul></div></div>
 <div class="fp-why"><div class="dc-k">Be ready for</div><p><b>${esc(review?.why||pack.why)}</b></p><p>If your answer would still work with another firm’s name in it, it isn’t specific enough.</p></div>
 </section>
 <section class="dc-section" style="padding-top:32px"><div class="fp-qhead"><div><div class="dc-k">Practise aloud</div><h2>${esc(f.label)} questions</h2></div><span class="dc-fine">${firmQs.length+roleQs.length} questions · tap for the shape of a good answer</span></div>
 <div class="dc-list fp-list">
 ${firmQs.map(q=>qItem(kinds[q.kind]||'Firm question',q.q,`<p class="fp-shape">${esc(q.guide?.shape||'')}</p><ol>${(q.guide?.points||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ol>${q.kind==='technical'?`<p>${techLink(q.q)}</p>`:''}`)).join('')}
 ${roleQs.map(([kind,q])=>qItem(r.label+' · '+kind,q,kind==='Technical'?`<p class="fp-shape">Define it → walk through the mechanics → give a quick example.</p><p>${techLink(q)||'<a class="dc-link" href="/library.html#technicals">See the technicals in the library →</a>'}</p>`:`<p class="fp-shape">Clarify the objective → what you’d need to know → options → a reasoned recommendation.</p>`)).join('')}
 </div></section>
 ${pack.cases?.[role]?`<section class="fp-case"><div class="dc-k">Apply your judgement · ${esc(r.label)}</div><h3>${esc(pack.cases[role])}</h3><p>Clarify the objective, identify missing information, compare options and give a reasoned recommendation.</p></section>`:''}
 </div>
 <aside class="fp-side">
 <section class="fp-card fp-cta"><div class="dc-k">Practise this pack</div><h3>${esc(f.label)} · ${esc(r.label)}</h3><p>Answer these on camera. The interview coach uses this pack and your CV, then pushes back like a real interviewer.</p><a class="dc-btn" href="${practise}">Start a ${esc(f.label)} interview →</a><small>Not a member yet? <a href="/interview.html?ready=1&amp;taster=interview&amp;trial=1">Try one free question →</a></small></section>
 <section class="fp-card"><div class="dc-k">Before the interview</div><h3>A 20-minute prep</h3><ol><li>Read the firm’s latest results headline and one recent deal or news story.</li><li>Write one sentence for “why ${esc(f.label)}” that only works for this firm.</li><li>Say two of these questions out loud, timed.</li></ol><a class="dc-btn ghost" href="/library.html">Open the library</a></section>
 </aside></div>`;
}
draw();
})();
