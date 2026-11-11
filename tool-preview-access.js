// A tour is public; live tool actions still enforce membership on the server.
(()=>{const destinations={
 '/interview.html':'/interview-preview.html','/interview-start.html':'/interview-preview.html',
 '/application-help.html':'/application-preview.html','/assessment-centre.html':'/assessment-centre-preview.html',
 '/group-exercise.html':'/assessment-centre-preview.html','/ac-crib.html':'/assessment-centre-preview.html','/case-study.html':'/assessment-centre-preview.html','/inbox-exercise.html':'/assessment-centre-preview.html',
 '/tests.html':'/tests-preview.html','/trading.html':'/trading-preview.html','/events.html':'/events-preview.html'};
const tour=destinations[location.pathname];if(!tour)return;
if(location.pathname==='/application-help.html'&&new URLSearchParams(location.search).get('trial')==='1')return;
const style=document.createElement('style');style.textContent='html.checking-tool-access body{visibility:hidden}';document.head.append(style);document.documentElement.classList.add('checking-tool-access');
fetch('/api/desk-home',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(d.member)document.documentElement.classList.remove('checking-tool-access');else location.replace(tour);}).catch(()=>location.replace(tour));
})();
