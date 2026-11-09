const profileFields=['name','uni','course','year','grade','sector1','programme','targetFirm'];
let cvMethod='upload',cvReadGeneration=0,cvReadController=null,pendingCv=false,loadedCvFile=null;
function chooseCvMethod(method){cvMethod=method;document.getElementById('cvUploadPanel').hidden=method!=='upload';document.getElementById('cvPastePanel').hidden=method!=='paste';for(const [id,key] of [['chooseCvUpload','upload'],['chooseCvPaste','paste']]){const button=document.getElementById(id);button.setAttribute('aria-pressed',String(key===method));button.classList.toggle('selected',key===method)}document.getElementById('cvMethodHint').textContent=method==='upload'?'A successful upload is enough. No pasting required.':'Pasting your CV is enough. No file upload required.';if(method==='paste'){cvReadGeneration++;cvReadController?.abort();window.deskCvUploadBusy=false;document.getElementById('cvContinue').disabled=false;pendingCv=false;document.getElementById('cvText').focus()}}
async function uploadCv(){
 const status=document.getElementById('uploadStatus'),file=document.getElementById('cvFile').files[0];if(!file)return;
 const generation=++cvReadGeneration;status.classList.remove('cv-upload-ready');cvReadController?.abort();window.deskCvUploadBusy=false;document.getElementById('cvContinue').disabled=false;
 if(file!==loadedCvFile)document.getElementById('cvText').value='';
 if(!document.getElementById('processingConsent').checked){pendingCv=true;status.textContent='File selected: '+file.name+'. Tick the consent box above and we will read it automatically.';return}
 pendingCv=false;if(file.size>2*1024*1024){status.textContent='Choose a CV smaller than 2 MB.';return}if(!/\.(pdf|docx|txt)$/i.test(file.name)){status.textContent='Choose PDF, Word (.docx) or text (.txt).';return}
 const controller=new AbortController();cvReadController=controller;const form=new FormData();form.append('cvFile',file);form.append('consent','true');window.deskCvUploadBusy=true;document.getElementById('cvContinue').disabled=true;status.classList.remove('cv-upload-ready');status.textContent='Reading '+file.name+'…';
 const timeout=setTimeout(()=>controller.abort(),45000);
 try{const r=await fetch('/api/extract-cv',{method:'POST',body:form,signal:controller.signal});const j=await r.json();if(generation!==cvReadGeneration)return;if(!r.ok||!j.success||typeof j.text!=='string'||j.text.trim().length<100)throw Error(j.error||'This file has too little readable CV text. Try another file or choose Paste CV text.');document.getElementById('cvText').value=j.text.trim();loadedCvFile=file;status.classList.add('cv-upload-ready');status.textContent='✓ CV loaded: '+file.name+'. You can continue — no need to paste it.';document.getElementById('cvPastePanel').hidden=true;}
 catch(e){if(generation===cvReadGeneration){status.textContent=e.name==='AbortError'?'Reading the file took too long. Try again or choose Paste CV text.':e.message;loadedCvFile=null}}
 finally{clearTimeout(timeout);if(generation===cvReadGeneration){window.deskCvUploadBusy=false;document.getElementById('cvContinue').disabled=false}}
}
document.getElementById('chooseCvUpload').onclick=()=>chooseCvMethod('upload');document.getElementById('chooseCvPaste').onclick=()=>{chooseCvMethod('paste');document.getElementById('uploadStatus').textContent='Paste your CV below. You do not need to upload a file.';document.getElementById('uploadStatus').classList.remove('cv-upload-ready')};
document.getElementById('processingConsent').addEventListener('change',()=>{document.querySelector('.cv-consent').classList.toggle('confirmed',document.getElementById('processingConsent').checked);if(pendingCv&&cvMethod==='upload'&&document.getElementById('processingConsent').checked)uploadCv()});
document.getElementById('cvText').addEventListener('input',()=>{if(cvMethod==='paste'){const status=document.getElementById('uploadStatus'),ready=document.getElementById('cvText').value.trim().length>=100;status.textContent=ready?'✓ CV text added. You can continue — no upload needed.':'Paste your full CV text below.';status.classList.toggle('cv-upload-ready',ready)}});
async function submitAssessment(){
 const status=document.getElementById('status'),btn=document.getElementById('submitBtn');
 if(!document.getElementById('processingConsent').checked){status.textContent='Confirm processing consent on the CV step.';return;}
 const value=id=>document.getElementById(id)?.value.trim()||'';
 const profile={name:value('name'),university:value('uni'),course:value('course'),year:value('year'),grade:value('grade'),targetSector:value('sector1'),targetDivision:value('sector1'),programme:value('programme'),targetFirm:value('targetFirm')};
 if(!window.routeQuizReady||!selectedBankId){status.textContent="Complete the test for your chosen route first.";return;}
 const answers={commercial:Array.from({length:5},(_,i)=>Number(document.querySelector(`input[name="c${i}"]:checked`)?.value??-1)),numerical:Array.from({length:5},(_,i)=>Number(document.querySelector(`input[name="n${i}"]:checked`)?.value??-1))};
 if(answers.commercial.concat(answers.numerical).some(a=>a<0||a>3)){status.textContent='Answer all ten test questions before continuing.';return;}
 if(!value('cvText')){status.textContent='Add your CV before continuing.';return;}
 btn.disabled=true;btn.textContent='Assessing your application…';status.textContent='Checking your evidence, ATS readiness and test answers. This may take a minute.';
 const controller=new AbortController(),requestTimeout=setTimeout(()=>controller.abort(),260000);
 window.assessmentLoading.show(profile.targetSector);
 try{const r=await fetch('/api/analyse-mot',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,answers,questionBankId:selectedBankId,consent:true,cv:{text:value('cvText')},recheckOf:new URLSearchParams(location.search).get('recheck')||undefined})});const j=await r.json().catch(()=>null);if(!r.ok||!j?.success)throw new Error(j?.error||'The assessment service could not finish. Your CV and answers are still on this page; please try again.');window.assessmentLoading.complete();location.href='/result-final-design.html?id='+encodeURIComponent(j.id);}catch(e){window.assessmentLoading.hide();status.setAttribute('role','alert');status.textContent=e.name==='AbortError'?'The assessment took too long. Your CV and answers are still here. Please try again.':e.message;btn.disabled=false;btn.textContent='Generate my assessment →';}finally{clearTimeout(requestTimeout)}
}

