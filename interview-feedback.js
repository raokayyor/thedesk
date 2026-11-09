// The Desk · real feedback on spoken answers, plus the interviewer's push-back follow-up.
// Load after the coach scripts. Replaces the automatic word-count check with model feedback (the old check stays as a fallback).
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  if (typeof assess !== 'function') return;
  const fallback = assess, originalRender = typeof render === 'function' ? render : null;
  let FU = null, t0 = 0, spoken = 0, busy = false, ME = null, requestVersion=0,activeRequest=null;
  function cancelFeedback(){requestVersion++;activeRequest?.abort();activeRequest=null;busy=false;const b=$('#assessBtn');if(b){b.disabled=false;b.textContent='Assess this answer'}}
  document.addEventListener('desk:questionchange',cancelFeedback);
  fetch('/api/value-account?view=me', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(d => { ME = d; }).catch(() => { });

  // How long they spoke, for "you got to your point after X seconds".
  const began = () => { t0 = Date.now(); spoken = 0; }, ended = () => { if (t0) spoken = (Date.now() - t0) / 1000; t0 = 0; };
  if (typeof start === 'function') { const s0 = start; start = function () { began(); return s0.apply(this, arguments); }; }
  if (typeof stop === 'function') { const s1 = stop; stop = function () { ended(); return s1.apply(this, arguments); }; }
  const rb = $('#recordBtn'), sb = $('#stopBtn');
  if (rb) rb.addEventListener('click', began, true);
  if (sb) sb.addEventListener('click', ended, true);

  // Labels that match what the model scores.
  const label = (id, text) => { const b = document.getElementById(id); const s = b && b.parentElement && b.parentElement.querySelector('span'); if (s) s.textContent = text; };
  const extra = () => { let el = $('#fbExtra'); if (!el) { el = document.createElement('div'); el.id = 'fbExtra'; el.className = 'fb-extra'; const body = $('#feedback .feedbackBody'); if (body) body.before(el); else $('#feedback').append(el); } return el; };

  function show(f, paid) {
    $('#overallScore').textContent = f.overall;
    $('#mStructure').textContent = f.scores.structure; $('#mSpecificity').textContent = f.scores.evidence; $('#mRelevance').textContent = f.scores.relevance; $('#mConfidence').textContent = f.pushback === null ? f.scores.delivery : f.pushback;
    label('mSpecificity', 'Evidence'); label('mConfidence', f.pushback === null ? 'Delivery' : 'Handling push-back');
    $('#verdictTitle').textContent = f.verdictTitle; $('#verdictText').textContent = f.verdict;
    $('#fixes').replaceChildren(...f.fixes.map(x => { const li = document.createElement('li'); li.innerHTML = esc(x.fix) + (x.quote ? `<span class="fb-quote">You said: “${esc(x.quote)}”</span>` : ''); return li; }));
    $('#stronger').innerHTML = (f.strongerOpening ? `<p><b>A stronger first sentence:</b> ${esc(f.strongerOpening)}</p>` : '') + (f.strengths.length ? `<p><b>Keep:</b></p><ul>${f.strengths.map(s => `<li>${esc(s.point)}${s.quote ? ` <span class="fb-quote">“${esc(s.quote)}”</span>` : ''}</li>`).join('')}</ul>` : '');
    const point = f.secondsToPoint;
    const el = extra();
    const frameworkHtml=f.framework?`<section class="fb-framework"><div class="kicker">Practitioner-style HireVue Input</div><h3>${esc(f.framework.label)}</h3>${(f.frameworkChecks||[]).map(c=>`<article><strong>${esc(c.label)}</strong> <span>${c.status==='clear'?'Clear evidence':c.status==='partial'?'Partly shown':'Not yet evidenced'}</span>${c.quote?`<blockquote>“${esc(c.quote)}”</blockquote>`:''}<p>${esc(c.advice)}</p></article>`).join('')}<p class="fb-why">Preparation feedback based on your answer and The Desk’s framework. Scores guide your practice; they are not employer ratings.</p></section>`:'';
    el.innerHTML = frameworkHtml+`<div class="fb-row"><div class="fb-chip ${point > 10 ? 'warn' : 'ok'}"><b>${point <= 2 ? 'Straight to the point' : '~' + point + ' seconds'}</b><span>${point <= 2 ? 'You answered from your first sentence.' : 'before you got to your point. ' + (point > 10 ? 'Reviewers decide early: lead with the answer.' : 'Good.')}</span></div>
        <div class="fb-chip"><b>${f.words} words</b><span>${spoken ? Math.round(spoken) + ' seconds spoken' : 'in your answer'}</span></div></div>
      ${f.followUp && !FU ? `<div class="fb-follow"><div class="fb-k">The interviewer pushes back</div><p class="fb-fq">“${esc(f.followUp.question)}”</p><p class="fb-why">${esc(f.followUp.why)}</p><button class="primary" type="button" id="fbAnswerFollow">Answer the follow-up</button></div>` : ''}
      ${FU ? '<p class="fb-why">That was your answer to the follow-up. Holding your ground with a reason and a specific detail is what interviewers are testing.</p>' : ''}
      ${paid && ME && ME.call ? `<p class="fb-why">Want a practitioner’s view on your answers? <a href="${esc(ME.call.url)}" target="_blank" rel="noopener">${esc(ME.call.label)}</a>.</p>` : ''}`;
    const fb = $('#fbAnswerFollow'); if (fb) fb.onclick = () => askFollowUp(f.followUp.question);
    $('#feedback').classList.add('active'); $('#feedback').scrollIntoView({ behavior: 'smooth' });
  }
  function askFollowUp(question) {
    const q = questions[current];
    FU = { questionRef: q, originalQ: q.q, question: q.q, answer: $('#transcript').value.trim(), followQ: question };
    q.q = question;
    $('#question').textContent = question;
    const qt = $('#questionType'); if (qt) qt.textContent = 'Interviewer follow-up';
    $('#questionHint').textContent = 'Follow-up. Hold your ground: give a reason and one specific detail.';
    $('#transcript').value = ''; $('#feedback').classList.remove('active');
    if ($('#voiceQuestions')?.checked) document.getElementById('hearQuestion')?.click();
    ($('#preview') || $('#question')).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (originalRender) render = function () { cancelFeedback(); if (FU?.questionRef) FU.questionRef.q = FU.originalQ; FU = null; const el = $('#fbExtra'); if (el) el.innerHTML = ''; label('mSpecificity', 'Specificity'); label('mConfidence', 'Confidence'); return originalRender.apply(this, arguments); };

  assess = async function () {
    const q = questions[current];
    if (!q || q.challenge || busy) return fallback.apply(this, arguments);
    const transcript = $('#transcript').value.trim();
    if (transcript.split(/\s+/).length < 20) return fallback.apply(this, arguments);
    const version=++requestVersion,questionText=q.q;const controller=new AbortController();activeRequest=controller;busy = true; const btn = $('#assessBtn'), was = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = 'Reading your answer…'; }
    try {
      const r = await fetch('/api/interview-feedback', { method: 'POST', signal:controller.signal, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        question: FU ? FU.followQ : q.q, kind: FU ? 'follow-up' : (q.kind || q.type || ''), transcript, seconds: spoken,
        firm: (typeof profile === 'object' && profile.targetFirm) || '', role: (typeof profile === 'object' && profile.targetSector) || '', cv: ($('#cvText') || {}).value || '', programme:globalThis.DeskInterviewSession?.readSelection()?.programme,stage:globalThis.DeskInterviewSession?.readSelection()?.round,format:globalThis.DeskInterviewSession?.readSelection()?.format,roleDescription:globalThis.DeskInterviewSession?.readSelection()?.roleDescription,
        followUpOf: FU ? { question: FU.question, answer: FU.answer } : null }) });
      const d = await r.json().catch(() => ({}));
      if(version!==requestVersion||questions[current]!==q||q.q!==questionText)return;
      if (!r.ok || !d.feedback) {
        fallback.apply(this, arguments);
        const msg = d.error || 'Detailed feedback isn’t available right now, so this is the quick automatic check.';
        extra().innerHTML = `<p class="fb-why">${esc(msg)}${d.upgrade ? ' <a href="/assessment-start.html">See Full Cycle</a>.' : ''}</p>`;
        return;
      }
      show(d.feedback, d.paid);
      if (!d.paid && typeof d.left === 'number') extra().insertAdjacentHTML('beforeend', `<p class="fb-why">${d.left} free detailed feedback${d.left === 1 ? '' : 's'} left today. Full Cycle includes 60 detailed feedbacks a day.</p>`);
      if (FU) FU = { ...FU, done: true };
    } catch (e) { if(version===requestVersion)fallback.apply(this, arguments); }
    finally { if(version!==requestVersion)return;activeRequest=null;busy = false; if (btn) { btn.disabled = false; btn.textContent = was; } }
  };
  const ab = $('#assessBtn'); if (ab) ab.onclick = () => assess();
  const css = document.createElement('style');
  css.textContent = `.fb-extra{padding:0 18px}.fb-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.fb-chip{border:1px solid var(--line,#ddd7cf);border-radius:8px;padding:10px 12px;font-size:12px;min-width:160px}.fb-chip b{display:block;font:500 18px "Fraunces",Georgia,serif}.fb-chip.warn b{color:var(--orange,#ff5a14)}.fb-chip.ok b{color:#15803d}
  .fb-follow{margin-top:14px;background:#11191e;color:#fff;border-radius:10px;padding:16px 18px}.fb-k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#ffb38f;font-weight:700}.fb-fq{font:500 20px/1.3 "Fraunces",Georgia,serif;margin:6px 0}.fb-follow .fb-why{color:#cfd6db}
  .fb-framework{margin:16px 0;padding:18px;border:1px solid #c8d7e7;border-radius:10px;background:#f0f5fa}.fb-framework article{margin-top:16px}.fb-framework article>span{font-size:11px;display:inline-block;margin-left:6px;color:#1d4e89}.fb-framework blockquote{font-size:13px;margin:6px 0;color:#52616c}.fb-framework article p{font-size:13px;line-height:1.6} .fb-why{font-size:12px;color:#5f6b76;margin:8px 0}.fb-quote{display:block;font-size:11px;color:#677279;font-style:italic;margin-top:2px}`;
  document.head.append(css);
})();

