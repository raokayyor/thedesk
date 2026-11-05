// The Desk · shared bits for any page: a My Desk / Sign in link in the header, the "How did it go?" form
// (window.DeskOutcome.open({ firm, stage })), real student quotes ([data-desk-proof]) and, for Full Cycle,
// the 5-minute call card ([data-desk-call], or automatically at the top of the Full Cycle report).
(() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = document.createElement('style');
  css.textContent = `.dm-link{font:700 13px/1 "DM Sans",Arial,sans-serif;color:inherit;text-decoration:none;border:1px solid currentColor;border-radius:999px;padding:8px 14px;margin-left:10px;white-space:nowrap}
  .dm-dlg{border:0;border-radius:14px;padding:0;max-width:560px;width:calc(100% - 32px);color:#121a22;background:#fff}.dm-dlg::backdrop{background:rgba(17,25,30,.5)}
  .dm-form{padding:22px;font:15px/1.5 "DM Sans",Arial,sans-serif}.dm-form h3{font:500 22px "Fraunces",Georgia,serif;margin:0 0 6px}.dm-form label{display:block;font-weight:700;font-size:13px;margin-top:10px}
  .dm-form input,.dm-form select,.dm-form textarea{display:block;width:100%;margin-top:4px;font:inherit;font-weight:400;padding:9px 10px;border:1px solid #d6cfc3;border-radius:8px;background:#fff;color:#121a22}.dm-form textarea{min-height:70px}
  .dm-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.dm-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center}.dm-btn{font:700 14px "DM Sans",Arial,sans-serif;border:0;border-radius:999px;padding:10px 18px;background:#11191e;color:#fff;cursor:pointer}.dm-btn.ghost{background:#fff;color:#11191e;border:1px solid #11191e}
  .dm-check{display:flex!important;gap:8px;align-items:flex-start;font-weight:400!important}.dm-check input{width:auto!important;margin-top:4px}.dm-mute{color:#5f6b76;font-size:13px}
  .dm-quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.dm-quote{background:#fff;border:1px solid #e4ded2;border-radius:12px;padding:14px 16px;font-size:15px}.dm-quote b{display:block;font-size:13px;margin-top:8px}
  .dm-call{background:#11191e;color:#fff;border-radius:12px;padding:16px 18px;margin:0 0 16px;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap}.dm-call a{background:#fff;color:#11191e;font-weight:700;text-decoration:none;border-radius:999px;padding:10px 16px}
  @media(max-width:560px){.dm-grid{grid-template-columns:1fr}.dm-link{padding:7px 10px;font-size:12px}}`;
  document.head.append(css);
  const me = fetch('/api/value-account?view=me', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).catch(() => null);
  window.DeskMe = me;

  // Header link.
  me.then(d => {
    if (!d || document.querySelector('.dm-link') || /\/my(\.html)?$/.test(location.pathname)) return;
    const top = document.querySelector('header.top .top-right, header.top .top-in, .top');
    if (!top) return;
    const a = document.createElement('a'); a.className = 'dm-link'; a.href = '/my.html';
    a.textContent = d.signedIn ? 'My Desk' : (d.assessments && d.assessments.length ? 'Save my work' : 'Sign in');
    top.append(a);
  });

  // 5-minute call card for Full Cycle.
  me.then(d => {
    if (!d || !d.call) return;
    let mount = document.querySelector('[data-desk-call]');
    if (!mount && /fullcycle\.html$/.test(location.pathname)) { const main = document.getElementById('main'); if (main) { mount = document.createElement('div'); main.prepend(mount); } }
    if (!mount) return;
    mount.innerHTML = `<div class="dm-call"><div><b>Included with Full Cycle</b><br>${esc(d.call.label)}: five minutes on what to fix first.</div><a href="${esc(d.call.url)}" target="_blank" rel="noopener">Book a time</a></div>`;
  });

  // Real, approved student quotes.
  const fillProof = () => { const proofs = document.querySelectorAll('[data-desk-proof]');
  if (proofs.length) fetch('/api/value-account?view=proof').then(r => r.ok ? r.json() : null).then(d => {
    if (!d) return;
    const qs = (d.quotes || []).slice(0, 6);
    const stats = [d.stats && d.stats.practiceAnswers30d ? `${d.stats.practiceAnswers30d.toLocaleString('en-GB')} practice answers in the last 30 days` : '', d.stats && d.stats.progressed ? `${d.stats.progressed} students told us they moved to the next stage` : ''].filter(Boolean);
    proofs.forEach(p => { if (!qs.length && !stats.length) { p.hidden = true; return; }
      p.innerHTML = `${stats.length ? `<p class="dm-mute">${stats.map(esc).join(' · ')}</p>` : ''}<div class="dm-quotes">${qs.map(q => `<div class="dm-quote">“${esc(q.quote)}”<b>${esc(q.firstName)}${q.university ? ', ' + esc(q.university) : ''}</b><span class="dm-mute">${esc(q.stage)}${q.firm ? ' · ' + esc(q.firm) : ''}${q.outcome && !/Prefer|waiting/i.test(q.outcome) ? ' · ' + esc(q.outcome.toLowerCase()) : ''}</span></div>`).join('')}</div>`; });
  }).catch(() => { }); };
  // Runs after the page's other scripts, so sections they add (like the HireVue guide) are found.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillProof); else fillProof();

  // "How did it go?"
  window.DeskOutcome = { async open(pre = {}) {
    const d = (await me) || {}; const o = d.options || { stages: ['HireVue / video interview', 'First round', 'Assessment centre / superday', 'Final / partner'], outcomes: ['Still waiting', 'Moved to the next stage', 'Offer', 'Rejected', 'Prefer not to say'], think: [''], answer: [''], retakes: [''] };
    const months = [...Array(12)].map((_, i) => { const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() - i); return [x.toISOString().slice(0, 7), x.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })]; });
    const opt = (list, sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + list.filter(Boolean).map(v => `<option ${v === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');
    let dlg = document.getElementById('dmOutcome'); if (dlg) dlg.remove();
    dlg = document.createElement('dialog'); dlg.id = 'dmOutcome'; dlg.className = 'dm-dlg';
    dlg.innerHTML = `<form class="dm-form" method="dialog"><h3>How did it go?</h3><p class="dm-mute">Two minutes. It helps the next student, and we use it to keep the firm guides accurate. We never show your name unless you choose to share a quote.</p>
      <div class="dm-grid"><label>Firm<input name="firm" required value="${esc(pre.firm || '')}"></label><label>Programme<input name="programme" placeholder="e.g. Spring week"></label></div>
      <div class="dm-grid"><label>Stage<select name="stage">${opt(o.stages, pre.stage || o.stages[0])}</select></label><label>When<select name="month">${months.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label></div>
      <div class="dm-hv"><div class="dm-grid"><label>Number of questions<input name="questions" type="number" min="1" max="15"></label><label>Thinking time<select name="think">${opt(o.think, '', 'Not sure')}</select></label></div>
      <div class="dm-grid"><label>Answer time<select name="answer">${opt(o.answer, '', 'Not sure')}</select></label><label>Retakes<select name="retakes">${opt(o.retakes, '', 'Not sure')}</select></label></div></div>
      <label>What were you asked? <span class="dm-mute">(one per line, in your own words, no online test questions)</span><textarea name="asked"></textarea></label>
      <label>How did it go?<select name="outcome">${opt(o.outcomes, 'Still waiting')}</select></label>
      <label class="dm-check"><input type="checkbox" name="usedDesk"> <span>I practised on The Desk</span></label>
      <label class="dm-check"><input type="checkbox" name="consent"> <span>You can share a short quote from me with my first name and university</span></label>
      <div class="dm-share" hidden><label>Your quote<textarea name="quote" maxlength="400" placeholder="What helped, in a sentence or two"></textarea></label><div class="dm-grid"><label>First name<input name="firstName" maxlength="30"></label><label>University<input name="university" maxlength="80"></label></div></div>
      <div class="dm-row"><button class="dm-btn" value="send">Send</button><button class="dm-btn ghost" value="cancel" formnovalidate>Cancel</button><span class="dm-mute dm-msg" role="status"></span></div></form>`;
    document.body.append(dlg);
    const f = dlg.querySelector('form'), hv = dlg.querySelector('.dm-hv'), share = dlg.querySelector('.dm-share');
    const sync = () => { hv.hidden = !/HireVue/.test(f.stage.value); share.hidden = !f.consent.checked; };
    f.stage.onchange = sync; f.consent.onchange = sync; sync();
    f.onsubmit = async e => {
      if (e.submitter && e.submitter.value === 'cancel') return;
      e.preventDefault();
      const body = { action: 'outcome', firm: f.firm.value, programme: f.programme.value, stage: f.stage.value, month: f.month.value, questions: f.questions.value, think: f.think.value, answer: f.answer.value, retakes: f.retakes.value, asked: f.asked.value, outcome: f.outcome.value, usedDesk: f.usedDesk.checked, consent: f.consent.checked, quote: f.quote.value, firstName: f.firstName.value, university: f.university.value };
      const r = await fetch('/api/value-account', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) { dlg.querySelector('.dm-msg').textContent = out.error || 'Couldn’t send. Try again.'; return; }
      f.innerHTML = `<h3>Thank you</h3><p>That helps the next student. ${out.id ? 'We check every report before anything appears on the site.' : ''}</p><div class="dm-row"><button class="dm-btn" value="close">Close</button></div>`;
    };
    dlg.showModal();
  } };
})();
