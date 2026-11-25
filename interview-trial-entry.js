(()=>{
 const choice=document.getElementById('interviewCvChoice');if(!choice)return;
 const root=document.documentElement,back=new URL(location.href);back.searchParams.set('trial','1');back.searchParams.set('cv','own');
 document.getElementById('interviewUseCv').href='/assessment-start.html?return='+encodeURIComponent(back.pathname+back.search);
 function proceed(){root.classList.remove('interview-cv-choice');choice.hidden=true;}
 document.getElementById('interviewSampleCv').onclick=()=>{const url=new URL(location.href);url.searchParams.set('cv','sample');history.replaceState(null,'',url.pathname+url.search);proceed();};
 window.DeskInterviewSetupReady?.then(()=>{const data=window.DeskInterviewSetup?.context();if(data&&!data.sample)proceed();});
})();
