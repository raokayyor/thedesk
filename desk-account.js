/* The Desk · signed-in header for the student app pages. Exposes window.deskAccount (a promise of /api/account). */
(function () {
  window.deskAccount = fetch('/api/account', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).catch(function () { return { signedIn: false }; });
  window.deskAccount.then(function (me) {
    var nav = document.getElementById('deskNav'); if (!nav) return;
    var here = location.pathname;
    var links = me.signedIn
      ? [['/my.html', 'My Desk'], ['/interview-practice.html', 'Interviews'], ['/answers.html', 'Applications'], ['/drill.html', 'Market drill']]
      : [['/signin.html', 'Sign in']];
    nav.textContent = '';
    links.forEach(function (l) { var a = document.createElement('a'); a.href = l[0]; a.textContent = l[1]; if (here === l[0]) a.setAttribute('aria-current', 'page'); nav.appendChild(a); });
  });
})();
