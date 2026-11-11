// The Desk · one navigation bar on every student page, so every tool leads back to My Desk.
// Add <script src="/desk-nav.js" defer></script> to a page. It sits under the page's own header.
(function () {
  if (document.querySelector('.desk-nav')) return;
  var path = location.pathname.replace(/\/$/, '/index.html');
  var report = null;
  try { report = localStorage.getItem('desk-report-url'); } catch (e) {}
  if (!/^\/(fullcycle|result-final-design)\.html\?id=[a-f0-9]{48}$/.test(report || '')) report = null;
  var interview = null;
  try { interview = localStorage.getItem('desk-interview-url'); } catch (e) {}
  if (!/^\/interview-start\.html\?id=[a-f0-9]{48}$/.test(interview || '')) interview = null;
  var previews={Report:'/report-preview.html',Interview:'/interview-preview.html','Application Help':'/application-preview.html','Assessment centres':'/assessment-centre-preview.html',Tests:'/tests-preview.html',Trading:'/trading-preview.html',Library:'/library-preview.html',Events:'/events-preview.html'};
  var touring=new URLSearchParams(location.search).get('preview')==='empty'||new URLSearchParams(location.search).has('tour');
  var links = [
    ['My Desk', '/my.html', /\/my\.html$/],
    ['Report', '/report.html', /\/(fullcycle|result-final-design)\.html$/],
    ['Interview', interview || '/interview-start.html', /\/interview(-start|-teaser)?\.html$/],
    ['Application Help','/application-help.html',/\/application-help\.html$/],
    ['Assessment centres','/assessment-centre.html',/\/(assessment-centre|ac-crib|group-exercise|case-study|inbox-exercise)(-preview)?\.html$/],
    ['Tests', '/tests.html', /\/tests\.html$/],
    ['Trading', '/trading.html', /\/(trading|challenge)\.html$/],
    ['Tracker', '/tracker.html', /\/tracker\.html$/],
    ['Library', '/library.html', /\/library\.html$/],
    ['News', '/news.html', /\/news\.html$/],
    ['Community','/community.html',/\/community(-question)?\.html$/],
    ['Events','/events.html',/\/events\.html$/]
  ];
  var css = '.desk-nav{background:#11191e;font:600 14px "DM Sans",Arial,sans-serif;position:relative;z-index:30}' +
    '.desk-nav-in{max-width:1200px;margin:0 auto;padding:0 16px;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none}' +
    '.desk-nav-in::-webkit-scrollbar{display:none}' +
    '.desk-nav a{flex:none;color:#cfd6db;text-decoration:none;padding:11px 12px;border-bottom:3px solid transparent}' +
    '.desk-nav a:hover{color:#fff}.desk-nav a[aria-current=page]{color:#fff;border-bottom-color:#ff5a14}' +
    '.desk-nav a:focus-visible{outline:2px solid #ff8a52;outline-offset:-2px}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  var nav = document.createElement('nav'); nav.className = 'desk-nav'; nav.setAttribute('aria-label', 'Your Desk');
  var inner = document.createElement('div'); inner.className = 'desk-nav-in';
  links.forEach(function (l) {
    var a = document.createElement('a'); a.href = previews[l[0]]?(previews[l[0]]+(touring?'?tour=1':'')):l[0]==='Community'?'/community.html?demo=1':l[1];a.dataset.memberHref=l[1];a.dataset.navLabel=l[0]; a.textContent = l[0];
    if (l[2].test(path)||previews[l[0]]===path||l[0]==='Report'&&path==='/report-sample.html') a.setAttribute('aria-current', 'page');
    inner.appendChild(a);
  });
  nav.appendChild(inner);
  if(!touring)fetch('/api/desk-home',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.json():null).then(d=>{if(!d?.member)return;inner.querySelectorAll('a').forEach(a=>{a.href=a.dataset.navLabel==='Interview'&&/^\/interview-start\.html(?:\?id=[a-f0-9]{48})?$/.test(d.interviewUrl||'')?d.interviewUrl:a.dataset.memberHref;});}).catch(()=>{});
  function place() {
    var header = document.querySelector('body > header, header.top');
    if (header && header.parentNode) header.parentNode.insertBefore(nav, header.nextSibling);
    else document.body.insertBefore(nav, document.body.firstChild);
  }
  if (document.body) place(); else document.addEventListener('DOMContentLoaded', place);
})();
