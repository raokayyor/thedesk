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
  var links = [
    ['My Desk', '/my.html', /\/my\.html$/],
    ['Report', report || '/my.html#report', /\/(fullcycle|result-final-design)\.html$/],
    ['Interview', interview || '/interview-start.html', /\/interview(-start|-teaser)?\.html$/],
    ['Tests', '/tests.html', /\/tests\.html$/],
    ['Challenge', '/challenge.html', /\/challenge\.html$/],
    ['Tracker', '/tracker.html', /\/tracker\.html$/],
    ['Library', '/library.html', /\/library\.html$/],
    ['News', '/my.html#news', /$^/]
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
    var a = document.createElement('a'); a.href = l[1]; a.textContent = l[0];
    if (l[2].test(path)) a.setAttribute('aria-current', 'page');
    inner.appendChild(a);
  });
  nav.appendChild(inner);
  function place() {
    var header = document.querySelector('body > header, header.top');
    if (header && header.parentNode) header.parentNode.insertBefore(nav, header.nextSibling);
    else document.body.insertBefore(nav, document.body.firstChild);
  }
  if (document.body) place(); else document.addEventListener('DOMContentLoaded', place);
})();
