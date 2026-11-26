const profileFields=['name','uni','course','year','grade','sector1','programme','targetFirm','limitedFinanceKnowledge'];
let cvMethod='upload',cvReadGeneration=0,cvReadController=null,pendingCv=false,loadedCvFile=null;
function chooseCvMethod(method){cvMethod=method;document.getElementById('cvUploadPanel').hidden=method!=='upload';document.getElementById('cvPastePanel').hidden=method!=='paste';for(const [id,key] of [['chooseCvUpload','upload'],['chooseCvPaste','paste']]){const button=document.getElementById(id);button.setAttribute('aria-pressed',String(key===method));button.classList.toggle('selected',key===method)}document.getElementById('cvMethodHint').textContent=method==='upload'?'A successful upload is enough. No pasting required.':'Pasting your CV is enough. No file upload required.';if(method==='paste'){cvReadGeneration++;cvReadController?.abort();window.deskCvUploadBusy=false;document.getElementById('cvContinue').disabled=false;pendingCv=false;document.getElementById('cvText').focus()}}
async function uploadCv(){
 const status=document.getElementById('uploadStatus'),file=document.getElementById('cvFile').files[0];if(!file)return;
 document.getElementById('cvFileReceipt').hidden=true;const generation=++cvReadGeneration;status.classList.remove('cv-upload-ready');cvReadController?.abort();window.deskCvUploadBusy=false;document.getElementById('cvContinue').disabled=false;
 if(file!==loadedCvFile)document.getElementById('cvText').value='';
 if(!document.getElementById('processingConsent').checked){pendingCv=true;status.textContent='Tick the consent box so we can read your CV.';return}
 pendingCv=false;if(file.size>2*1024*1024){status.textContent='Choose a CV smaller than 2 MB.';return}if(!/\.(pdf|docx|txt)$/i.test(file.name)){status.textContent='Choose PDF, Word (.docx) or text (.txt).';return}
 const controller=new AbortController();cvReadController=controller;const form=new FormData();form.append('cvFile',file);form.append('consent','true');window.deskCvUploadBusy=true;document.getElementById('cvContinue').disabled=true;status.classList.remove('cv-upload-ready');status.textContent='Reading your CV…';
 const timeout=setTimeout(()=>controller.abort(),45000);
 try{const r=await fetch('/api/extract-cv',{method:'POST',body:form,signal:controller.signal});const j=await r.json();if(generation!==cvReadGeneration)return;if(!r.ok||!j.success||typeof j.text!=='string'||j.text.trim().length<100)throw Error(j.error||'This file has too little readable CV text. Try another file or choose Paste CV text.');document.getElementById('cvText').value=j.text.trim();loadedCvFile=file;document.getElementById('cvFileName').textContent=file.name;document.getElementById('cvFileReceipt').hidden=false;window.deskAssessmentJourney?.track('cv_uploaded');status.classList.add('cv-upload-ready');status.textContent='✓ CV loaded';document.getElementById('cvFileReceipt').hidden=true;document.getElementById('cvPastePanel').hidden=true;}
 catch(e){window.deskAssessmentJourney?.track('extract_failed');if(generation===cvReadGeneration){status.textContent=e.name==='AbortError'?'Reading the file took too long. Try again or choose Paste CV text.':e.message;loadedCvFile=null}}
 finally{clearTimeout(timeout);if(generation===cvReadGeneration){window.deskCvUploadBusy=false;document.getElementById('cvContinue').disabled=false;document.dispatchEvent(new Event('desk:cv-state'))}}
}
document.getElementById('chooseCvUpload').onclick=()=>chooseCvMethod('upload');document.getElementById('chooseCvPaste').onclick=()=>{chooseCvMethod('paste');document.getElementById('uploadStatus').textContent='Paste your CV below. You do not need to upload a file.';document.getElementById('uploadStatus').classList.remove('cv-upload-ready')};
document.getElementById('processingConsent').addEventListener('change',()=>{document.querySelector('.cv-consent').classList.toggle('confirmed',document.getElementById('processingConsent').checked);if(pendingCv&&cvMethod==='upload'&&document.getElementById('processingConsent').checked)uploadCv()});
document.getElementById('cvText').addEventListener('input',()=>{if(cvMethod==='paste'){const status=document.getElementById('uploadStatus'),ready=document.getElementById('cvText').value.trim().length>=100;status.textContent=ready?'✓ CV loaded':'Paste your full CV text below.';status.classList.toggle('cv-upload-ready',ready)}});
fetch('/api/assessment-save').then(r=>r.json()).then(j=>{if(j.emailReady)document.getElementById('emailDeliveryNote').textContent='No password needed: we email you a link so you can open your result on any device.'}).catch(()=>{});
// Share background preparation with the Build action; never send two identical requests.
let assessmentPreparation=null;
function assessmentInput(){
 const value=id=>document.getElementById(id)?.value.trim()||'';
 if(!document.getElementById('processingConsent').checked)throw Error('Confirm processing consent on the CV step.');
 if(!window.routeQuizReady||!selectedBankId)throw Error('Complete the test for your chosen route first.');
 const profile={name:value('name'),university:value('uni'),course:value('course'),year:value('year'),grade:value('grade'),targetSector:value('sector1'),targetDivision:value('sector1'),programme:value('programme'),targetFirm:value('targetFirm'),targetFirms:(window.deskAssessmentTargets?.firms||[value('targetFirm')]).filter(Boolean).slice(0,3),financeKnowledge:document.getElementById('limitedFinanceKnowledge').checked?'limited_or_none':'not_stated'};
 const skipped=window.deskTestsSkipped===true;
 const answers=skipped?{skipped:true,commercial:null,numerical:null}:{commercial:Array.from({length:5},(_,i)=>Number(document.querySelector('input[name="c'+i+'"]:checked')?.value??-1)),numerical:Array.from({length:5},(_,i)=>Number(document.querySelector('input[name="n'+i+'"]:checked')?.value??-1))};
 if(!skipped&&answers.commercial.concat(answers.numerical).some(a=>a<0||a>3))throw Error('Answer all ten test questions before continuing.');
 if(!value('cvText'))throw Error('Add your CV before continuing.');
 return {profile,source:window.DeskLiveSource,answers,questionBankId:selectedBankId,consent:true,cv:{text:value('cvText')},recheckOf:new URLSearchParams(location.search).get('recheck')||undefined};
}
function cancelAssessmentPreparation(){assessmentPreparation?.controller.abort();assessmentPreparation=null;}
function prepareAssessment(){
 let input;try{input=assessmentInput()}catch{return null}
 const key=JSON.stringify(input);
 if(assessmentPreparation?.key===key&&assessmentPreparation.state!=='failed')return assessmentPreparation;
 cancelAssessmentPreparation();
 const controller=new AbortController(),progressId=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
 const task={key,controller,progressId,input,state:'pending',promise:null};assessmentPreparation=task;
 task.promise=(async()=>{
  const timeout=setTimeout(()=>controller.abort(),120000);
  try{
   await window.deskAssessmentJourney?.ready;
   if(controller.signal.aborted)throw new DOMException('Request cancelled','AbortError');
   const r=await fetch('/api/analyse-mot',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,progressId})});
   const result=await r.json().catch(()=>null);
   if(!r.ok||!result?.success)throw Error(result?.error||'The assessment service could not finish. Your CV and answers are still here; please try again.');
   task.state='ready';return {result};
  }catch(error){task.state='failed';return {error}}finally{clearTimeout(timeout)}
 })();return task;
}
async function submitAssessment(){
 const status=document.getElementById('status'),btn=document.getElementById('submitBtn');if(btn.disabled)return;
 let input;try{input=assessmentInput()}catch(error){status.textContent=error.message;return}
 const task=prepareAssessment(),skipped=input.answers.skipped===true;
 window.deskAssessmentJourney?.track('step_completed',{step:4});if(cvMethod==='paste')window.deskAssessmentJourney?.track('cv_pasted');btn.disabled=true;btn.textContent='Assessing your application…';status.textContent='Checking your evidence, ATS readiness and test answers.';
 window.assessmentLoading.watch?.(task.progressId);window.deskTestScore=skipped?null:score('c',commercial)+score('n',numerical);window.assessmentLoading.show(input.profile.targetSector);
 try{const outcome=await task.promise;if(outcome.error)throw outcome.error;const j=outcome.result;
try{localStorage.setItem('desk-pending-result',JSON.stringify({id:j.id,savedAt:Date.now(),preparationGoal:document.getElementById('preparationGoal')?.value||''}));}catch{}window.deskAssessmentJourney?.clear();window.deskAssessmentJourney?.track('result_opened');await window.assessmentLoading.complete();if(j.next){const next=new URL(j.next,location.origin);if(next.origin===location.origin&&['/deep-assessment.html','/result-final-design.html'].includes(next.pathname)){const returnTo=new URLSearchParams(location.search).get('return');if(returnTo)next.searchParams.set('return',returnTo);location.assign(next.pathname+next.search);return}}let member=false;try{const access=await fetch('/api/membership',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(6000)});if(access.ok)member=(await access.json()).member===true;}catch{}const back=new URLSearchParams(location.search).get('return');location.href=(member?'/deep-assessment.html?id=':'/result-final-design.html?id=')+encodeURIComponent(j.id)+(back?'&return='+encodeURIComponent(back):'');}catch(e){if(window.assessmentLoading.fail)window.assessmentLoading.fail(e.name==='AbortError'?'The service took longer than expected. Please retry using your saved answers.':e.message);else window.assessmentLoading.hide();status.setAttribute('role','alert');status.textContent=e.name==='AbortError'?'The assessment took too long. Your CV and answers are still here. Please try again.':e.message;btn.disabled=false;btn.textContent=skipped?'Build my CV review →':'Build my assessment →';}
}

for(const button of document.querySelectorAll('.preparation-option'))button.addEventListener('click',()=>{const field=document.getElementById('preparationGoal');field.value=field.value===button.dataset.goal?'':button.dataset.goal;field.dispatchEvent(new Event('change',{bubbles:true}));});
document.getElementById('preparationGoal')?.addEventListener('change',()=>{for(const option of document.querySelectorAll('.preparation-option'))option.setAttribute('aria-pressed',String(option.dataset.goal===document.getElementById('preparationGoal').value))});
