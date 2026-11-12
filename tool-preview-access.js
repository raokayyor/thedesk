// A tour is public; live tool actions still enforce membership on the server.
(()=>{const destinations={
 '/interview.html':'/interview-preview.html','/interview-start.html':'/interview-preview.html',
 '/application-help.html':'/application-preview.html','/assessment-centre.html':'/assessment-centre-preview.html',
 '/group-exercise.html':'/assessment-centre-preview.html','/ac-crib.html':'/assessment-centre-preview.html','/case-study.html':'/assessment-centre-preview.html','/inbox-exercise.html':'/assessment-centre-preview.html',
 '/tests.html':'/tests-preview.html','/events.html':'/events-preview.html'};
const tour=destinations[location.pathname];if(!tour)return;
if(location.pathname==='/application-help.html'&&new URLSearchParams(location.search).get('trial')==='1')return;
const style=document.createElement('style');style.textContent='html.checking-tool-access body{visibility:hidden}';document.head.append(style);document.documentElement.classList.add('checking-tool-access');
fetch('/api/desk-home',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(d.member){document.documentElement.classList.remove('checking-tool-access');if(d.report&&d.deep?.status!=='complete'){const note=document.createElement('aside');note.style.cssText='max-width:1100px;margin:12px auto;padding:12px 16px;border:1px solid #edcdb7;background:#fff7ed;border-radius:10px;font:14px/1.5 Arial;color:#11191e';note.append('Your tools are open. Complete your deep assessment to add more detailed CV evidence to your preparation. ');const link=document.createElement('a');link.href='/deep-assessment.html?id='+encodeURIComponent(d.report.assessmentId);link.textContent='Answer your follow-up questions →';note.append(link);const nav=document.querySelector('.desk-nav');if(nav)nav.after(note);else document.body.prepend(note);}}else location.replace(tour);}).catch(()=>location.replace(tour));
})();
