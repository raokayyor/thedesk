/* The Desk · free result: the headline score shows straight away; the full breakdown appears once the student gives an email.
   The email creates a free account (or adds the result to an existing one). Deadline alerts are a separate, unticked choice. */
(function () {
  var id = new URLSearchParams(location.search).get('id');
  if (!/^[a-f0-9]{48}$/.test(id || '')) return; // samples and demos are never gated
  var hero = document.querySelector('.page section.hero');
  if (!hero) return;
  var track = function (action, alerts) { try { window.deskTrack && window.deskTrack('result_gate', { action: action, alerts: !!alerts }); } catch (e) { } };
  var hidden = [];
  for (var el = hero.nextElementSibling; el && !el.matches('footer'); el = el.nextElementSibling) { if (el.tagName !== 'SCRIPT') { el.classList.add('desk-gated'); hidden.push(el); } }
  var style = document.createElement('style');
  style.textContent = '.desk-gated{display:none!important}' +
    '.desk-gate{margin:0;padding:28px 44px;background:#fffdfa;border-top:1px solid #e3ddd3;border-bottom:1px solid #e3ddd3}' +
    '.desk-gate .in{max-width:620px}.desk-gate .k{font:700 11px/1.2 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#d9480f}' +
    '.desk-gate h2{font:400 30px/1.15 Georgia,serif;margin:8px 0 0;color:#10191d}.desk-gate p{font:400 16px/1.55 Arial,sans-serif;color:#3d4954;margin:10px 0 0}' +
    '.desk-gate ul{margin:10px 0 0;padding-left:20px;font:400 15px/1.6 Arial,sans-serif;color:#3d4954}' +
    '.desk-gate form{margin-top:18px;display:grid;gap:12px}.desk-gate label.e{font:700 12px/1 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#6b7682}' +
    '.desk-gate input[type=email]{font:16px Arial,sans-serif;padding:13px 14px;border:1px solid #d4ccbf;border-radius:6px;width:100%;box-sizing:border-box;background:#fff}' +
    '.desk-gate .chk{display:flex;gap:10px;align-items:flex-start;font:15px/1.45 Arial,sans-serif;color:#10191d}.desk-gate .chk input{margin-top:3px;width:18px;height:18px;flex:none}' +
    '.desk-gate button{font:700 16px Arial,sans-serif;background:#d9480f;color:#fff;border:0;border-radius:6px;padding:14px 20px;cursor:pointer;justify-self:start}' +
    '.desk-gate .small{font-size:13px;color:#6b7682}.desk-gate .small a{color:inherit}.desk-gate .err{color:#b42318;font:600 14px Arial,sans-serif;margin:0}' +
    '.desk-saved{padding:12px 44px;background:#e4f1ec;color:#10191d;font:15px/1.5 Arial,sans-serif;border-bottom:1px solid #cfe3da}' +
    '@media (max-width:760px){.desk-gate{padding:22px 20px}.desk-gate h2{font-size:24px}.desk-gate button{width:100%}.desk-saved{padding:12px 20px}}';
  document.head.appendChild(style);
  function reveal() { hidden.forEach(function (el) { el.classList.remove('desk-gated'); }); }
  function note(text) { var n = document.createElement('div'); n.className = 'desk-saved'; n.setAttribute('role', 'status'); n.textContent = text; hero.after(n); }

  fetch('/api/account?unlock=' + id, { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : { unlocked: true }; })
    .catch(function () { return { unlocked: true }; })
    .then(function (d) { if (d.unlocked) reveal(); else showGate(); });

  function showGate() {
    var gate = document.createElement('section'); gate.className = 'desk-gate'; gate.id = 'deskGate';
    gate.innerHTML = '<div class="in"><div class="k">Your full result is ready</div><h2>Where should we save it?</h2>' +
      '<p>Below your score you’ll see:</p><ul><li>One CV improvement to start with</li><li>Your CV screening check</li><li>Your numerical and technical test results</li><li>Where you stand on all 7 competencies</li><li>Your priorities for further preparation</li></ul>' +
      '<form novalidate><label class="e" for="gEmail">Your email</label><input type="email" id="gEmail" autocomplete="email" required placeholder="you@university.ac.uk">' +
      '<label class="chk"><input type="checkbox" id="gAlerts"><span>Email me weekly deadline alerts for my target firms. Unsubscribe any time.</span></label>' +
      '<button type="submit" id="gGo">Show my full result</button><p class="err" id="gErr" role="alert"></p>' +
      '<p class="small">We’ll save your result to a free account with this email, so you can open it on any device. We use email service providers to deliver your sign-in links and any alerts you choose. <a href="/privacy.html">Privacy notice</a></p></form></div>';
    hero.after(gate);
    track('shown');
    gate.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = gate.querySelector('#gEmail').value.trim(), alerts = gate.querySelector('#gAlerts').checked, err = gate.querySelector('#gErr'), btn = gate.querySelector('#gGo');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Enter a valid email address.'; return; }
      btn.disabled = true; btn.textContent = 'Saving…'; err.textContent = '';
      fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'claim', assessmentId: id, email: email, alerts: alerts }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Something went wrong. Try again.'); return d; }); })
        .then(function (d) {
          track('submitted', alerts);
          gate.remove(); reveal();
          if (d.existingAccount) note(d.emailSent ? 'This email already has a Desk account. We’ve emailed you a link to add this result to it' + (alerts ? ' and switch on your deadline alerts.' : '.') : 'This email already has a Desk account. Sign in to add this result to it.');
          else if (d.emailSent) note('We’ve sent a link to ' + email + ': confirm your email to save this result to your account' + (alerts ? ' and start your weekly deadline alerts.' : '.'));
          else note('Saved to your free account on this device.' + (alerts ? ' Your deadline alerts will start once email is confirmed.' : ''));
          try { var s = document.querySelector('.desk-saved'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) { }
        })
        .catch(function (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = 'Show my full result'; });
    });
  }
})();
