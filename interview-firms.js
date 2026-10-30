(() => {
 const bank=globalThis.DeskInterviewBank;
 const firmSelect=document.getElementById('firmSelect'),roleSelect=document.getElementById('roleSelect'),focus=document.getElementById('practiceFocus'),logic=document.getElementById('logicToggle');
 const reveal=document.getElementById('revealChallenge'),solution=document.getElementById('challengeSolution');
 let userChoice=false;
 for(const [key,firm] of Object.entries(bank.firms)){const option=document.createElement('option');option.value=key;option.textContent=firm.label;firmSelect.append(option)}
 function populateRoles(preferred){const firm=bank.firms[firmSelect.value]||bank.firms.general;roleSelect.replaceChildren(...firm.roles.map(key=>{const option=document.createElement('option');option.value=key;option.textContent=bank.roles[key].label;return option}));roleSelect.value=firm.roles.includes(preferred)?preferred:firm.roles[0]}
 function updateContext(){const firm=bank.firms[firmSelect.value]||bank.firms.general;const context=document.getElementById('firmContext');context.replaceChildren(document.createTextNode(firm.focus+' '));const source=document.createElement('a');source.href=firm.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent=firmSelect.value==='general'?'Explore firm guides ↗':'Official firm information ↗';context.append(source)}
 function attempted(){return document.getElementById('transcript').value.trim().length>0||!!recordingUrl}
 function updateReveal(){reveal.disabled=!attempted()}
 function guide(){const q=questions[current];if(!q)return;document.getElementById('questionType').textContent=({cv:'CV & experience',case:'Firm / client scenario',technical:'Technical knowledge',motivation:'Firm motivation',maths:'Unexpected maths',estimation:'Estimation / thinking aloud',logic:'Logic / thinking aloud',news:'Employer news'})[q.kind]||'Interview practice';if(q.guide){document.getElementById('answerGuideShape').textContent=q.guide.shape;document.getElementById('answerGuidePoints').replaceChildren(...q.guide.points.map(text=>{const li=document.createElement('li');li.textContent=text;return li}))}if(q.kind!=='cv'&&q.kind!=='motivation'){document.querySelector('.guide-evidence strong').textContent='Explain your approach';document.getElementById('answerGuideEvidence').textContent=q.challenge?'Clarify the question and show your working. The answer or an illustrative approach stays hidden until you have attempted it.':'Use the facts in the question. State missing information and assumptions. If you add a personal example, keep it truthful.';}else{document.querySelector('.guide-evidence strong').textContent='Use your own evidence'} }
 const previousRender=render;
 render=function(){previousRender();guide();solution.hidden=true;document.getElementById('challengeAnswer').textContent='';document.getElementById('challengeSteps').replaceChildren();reveal.hidden=!questions[current]?.challenge;updateReveal();document.getElementById('feedback').classList.remove('reasoning-only')};
 derive=function(){
  if(!userChoice){firmSelect.value=bank.resolveFirm(profile.targetFirm);populateRoles(bank.resolveRole(profile.targetSector));}
  const firm=bank.firms[firmSelect.value]||bank.firms.general,role=bank.roles[roleSelect.value];
  profile={...profile,targetFirm:firmSelect.value==='general'?'':firm.label,targetSector:role.label};
  const cv=document.getElementById('cvText').value.trim();
  questions=bank.buildSession({firmKey:firmSelect.value,roleKey:roleSelect.value,evidence:cv?evidence(cv):'an experience you choose',stretch:focus.value==='stretch',includeLogic:logic.checked});
  current=0;render();updateContext();
  document.getElementById('route').textContent=role.label;
  if(profile.name)document.getElementById('candidateSummary').textContent=[role.label,profile.targetFirm,profile.programme].filter(Boolean).join(' · ');
 };
 function restart(){userChoice=true;derive()}
 firmSelect.onchange=()=>{populateRoles(roleSelect.value);restart()};roleSelect.onchange=restart;focus.onchange=restart;logic.onchange=restart;document.getElementById('newSessionBtn').onclick=restart;
 function showSolution(){const q=questions[current];if(!q?.challenge||!attempted())return;document.getElementById('challengeTitle').textContent=q.kind==='estimation'?'One possible estimation approach':'Answer & worked approach';document.getElementById('challengeAnswer').textContent=q.answer;document.getElementById('challengeSteps').replaceChildren(...q.steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));solution.hidden=false;const feedback=document.getElementById('feedback');feedback.classList.add('active','reasoning-only');solution.scrollIntoView({behavior:'smooth',block:'start'})}
 reveal.onclick=showSolution;
 document.getElementById('transcript').addEventListener('input',updateReveal);document.getElementById('cvText').addEventListener('input',guide);
 new MutationObserver(updateReveal).observe(document.getElementById('playBtn'),{attributes:true,attributeFilter:['disabled']});
 const previousAssess=assess;
 assess=function(){const q=questions[current];if(q.challenge){if(!attempted()){notice('Attempt the question first: record an answer or type your working below.');return}showSolution();return}previousAssess();if(document.getElementById('feedback').classList.contains('active')&&q.guide&&q.kind!=='cv')document.getElementById('stronger').textContent=q.guide.shape+' '+q.guide.points.join(' ')};
 document.getElementById('assessBtn').onclick=assess;
 populateRoles(bank.resolveRole(profile.targetSector));derive();
})();
