const profileFields=['name','uni','course','year','grade','sector1','programme','targetFirm'];
async function uploadCv(){
 const status=document.getElementById('uploadStatus'),file=document.getElementById('cvFile').files[0];if(!file)return;
 if(!document.getElementById('processingConsent').checked){status.textContent='Confirm processing consent before uploading.';return;}
 const form=new FormData();form.append('cvFile',file);form.append('consent','true');status.textContent='Reading your CV…';
 try{const r=await fetch('/api/extract-cv',{method:'POST',body:form});const j=await r.json();if(!r.ok)throw new Error(j.error);document.getElementById('cvText').value=j.text;status.textContent='CV extracted. Check the text below before continuing.';}catch(e){status.textContent=e.message;}
}
async function submitAssessment(){
 const status=document.getElementById('status'),btn=document.getElementById('submitBtn');
 if(!document.getElementById('processingConsent').checked){status.textContent='Confirm processing consent on the CV step.';return;}
 const value=id=>document.getElementById(id)?.value.trim()||'';
 const profile={name:value('name'),university:value('uni'),course:value('course'),year:value('year'),grade:value('grade'),targetSector:value('sector1'),targetDivision:value('sector1'),programme:value('programme'),targetFirm:value('targetFirm')};
 const answers={commercial:Array.from({length:5},(_,i)=>Number(document.querySelector(`input[name="c${i}"]:checked`)?.value??-1)),numerical:Array.from({length:5},(_,i)=>Number(document.querySelector(`input[name="n${i}"]:checked`)?.value??-1))};
 btn.disabled=true;btn.textContent='Assessing your application…';status.textContent='Checking your evidence, ATS readiness and test answers. This may take a minute.';
 try{const r=await fetch('/api/analyse-mot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,answers,consent:true,cv:{text:value('cvText')},recheckOf:new URLSearchParams(location.search).get('recheck')||undefined})});const j=await r.json();if(!r.ok||!j.success)throw new Error(j.error||'Assessment unavailable. Please retry.');location.href='/result-final-design.html?id='+encodeURIComponent(j.id);}catch(e){status.textContent=e.message;btn.disabled=false;btn.textContent='Generate my assessment →';}
}
