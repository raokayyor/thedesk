const profileFields=['name','uni','course','year','grade','sector1','programme','targetFirm'];
let cvSource='file',extractedFile=null,extractedCv='',pastedCv='',cvPending=null;
function cvStatus(message,error=false){const el=document.getElementById('uploadStatus');el.textContent=message;el.classList.toggle('err',error);}
function setCvSource(source){if(cvPending)return;const text=document.getElementById('cvText');if(cvSource==='text')pastedCv=text.value;cvSource=source;document.getElementById('cvFilePane').hidden=source!=='file';document.getElementById('cvPastePane').hidden=source!=='text';text.value=source==='text'?pastedCv:extractedCv;document.getElementById('extractedPreview').hidden=source!=='file'||!extractedCv;cvStatus('');}
function chooseCvFile(){extractedFile=null;extractedCv='';document.getElementById('extractedPreview').hidden=true;if(cvSource==='file')document.getElementById('cvText').value='';const file=document.getElementById('cvFile').files[0];cvStatus(file?'Selected: '+file.name+'. Tick the agreement below, then Continue.':'Choose a CV file to continue.');}
async function uploadCv(){
 if(!document.getElementById('processingConsent').checked)throw Error('Tick the agreement before reading your CV.');
 const file=document.getElementById('cvFile').files[0];
 if(!file)throw Error('Choose a CV file, or select Paste CV text.');
 if(!/\.(pdf|docx|txt)$/i.test(file.name))throw Error('Choose a PDF, Word (.docx) or text (.txt) file.');
 if(file.size>2*1024*1024)throw Error('Choose a file smaller than 2 MB.');
 if(file===extractedFile&&extractedCv)return extractedCv;
 const form=new FormData();form.append('cvFile',file);form.append('consent','true');cvStatus('Reading '+file.name+'…');
 const response=await fetch('/api/extract-cv',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw Error(data.error||'We could not read this CV. Try another file or select Paste CV text.');
 if(typeof data.text!=='string'||data.text.trim().length<100)throw Error('This file has too little readable text. Try another file or select Paste CV text.');
 if(data.text.length>40000)throw Error('Use a CV under 40,000 characters.');
 if(document.getElementById('cvFile').files[0]!==file)throw Error('The selected file changed. Click Continue to read your new file.');
 extractedFile=file;extractedCv=data.text.trim();document.getElementById('cvText').value=extractedCv;document.getElementById('extractedText').textContent=extractedCv;document.getElementById('extractedPreview').hidden=false;return extractedCv;
}
async function continueCvStep(){
 if(cvPending)return cvPending;
 const consent=document.getElementById('processingConsent'),button=document.getElementById('cvContinue');
 if(!consent.checked){consent.setAttribute('aria-invalid','true');cvStatus('Tick the agreement beside Continue so we can process your CV and assessment.',true);consent.focus();return;}
 consent.removeAttribute('aria-invalid');
 if(cvSource==='file'&&!document.getElementById('cvFile').files[0]){cvStatus('Choose a CV file, or select Paste CV text.',true);document.getElementById('cvFile').focus();return;}
 if(cvSource==='text'&&(document.getElementById('cvText').value.trim().length<100||document.getElementById('cvText').value.length>40000)){cvStatus('Paste your full CV (100–40,000 characters), or select Upload a file.',true);document.getElementById('cvText').focus();return;}
 button.disabled=true;button.textContent=cvSource==='file'?'Reading your CV…':'Continuing…';const controls=[...document.querySelectorAll('input[name="cvSource"],#cvFile')];controls.forEach(el=>el.disabled=true);
 cvPending=(async()=>{await Promise.resolve();try{if(cvSource==='file')await uploadCv();else pastedCv=document.getElementById('cvText').value.trim();if(!consent.checked){cvStatus('Tick the agreement before continuing.',true);return;}if(!window.routeQuizReady&&!await prepareRouteQuiz())return;if(!consent.checked||document.getElementById('s2').classList.contains('hidden'))return;cvStatus(cvSource==='file'?'CV read successfully.':'CV added.');showStep(3);}catch(error){cvStatus(error.message||'We could not read this CV. Please retry.',true);}finally{button.disabled=false;button.textContent='Continue →';controls.forEach(el=>el.disabled=false);cvPending=null;}})();return cvPending;
}
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
 window.assessmentLoading.show(profile.targetSector);
 try{const r=await fetch('/api/analyse-mot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,answers,questionBankId:selectedBankId,consent:true,cv:{text:value('cvText')},recheckOf:new URLSearchParams(location.search).get('recheck')||undefined})});const j=await r.json();if(!r.ok||!j.success)throw new Error(j.error||'Assessment unavailable. Please retry.');window.assessmentLoading.complete();location.href='/result-final-design.html?id='+encodeURIComponent(j.id);}catch(e){window.assessmentLoading.hide();status.textContent=e.message;btn.disabled=false;btn.textContent='Generate my assessment →';}
}



function openCvCreator(event){event.preventDefault();const frame=document.getElementById('cvCreatorFrame');if(!frame.getAttribute('src'))frame.src='/cv-creator.html?embedded=1';document.getElementById('cvCreatorDialog').showModal();}
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==document.getElementById('cvCreatorFrame')?.contentWindow||event.data?.type!=='desk-cv-created'||typeof event.data.text!=='string')return;const text=event.data.text.trim();if(cvPending||text.length<100||text.length>40000)return;setCvSource('text');document.querySelector('input[name="cvSource"][value="text"]').checked=true;document.getElementById('cvText').value=text;pastedCv=text;document.getElementById('cvCreatorDialog').close();cvStatus('Your new CV is ready. Review the text, tick the agreement and Continue.');document.getElementById('cvText').focus();});
