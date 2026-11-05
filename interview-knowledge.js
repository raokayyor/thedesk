// The Desk · adds practitioner-approved knowledge to the interview coach:
// one question commonly discussed for the candidate's firm, and "what interviewers look for" tips.
// Loaded after the coach's own scripts; does nothing if the knowledge base is empty or unavailable.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  if (typeof derive !== 'function' || typeof render !== 'function') return;
  let K = { questions: [], tips: [], myths: [] }, key = '';
  const firmName = () => { const s = $('firmSelect'); const picked = s && s.value && s.value !== 'general' && s.selectedIndex >= 0 ? s.options[s.selectedIndex].text : ''; return (typeof profile === 'object' && profile && profile.targetFirm) || picked || ''; };
  const division = () => { const r = $('roleSelect'); return (r && r.value ? r.options[r.selectedIndex].text : '') || (typeof profile === 'object' && profile && (profile.targetDivision || profile.targetSector)) || ''; };
  async function fetchKnowledge() {
    const f = firmName(), d = division(), k = f + '|' + d;
    if (k === key) return K;
    key = k;
    try { const r = await fetch('/api/knowledge?view=interview&firm=' + encodeURIComponent(f) + '&division=' + encodeURIComponent(d)); if (r.ok) K = await r.json(); } catch (e) { }
    return K;
  }
  function tipsBox() {
    let box = $('kbTips');
    if (!box) { const hint = $('questionHint'); if (!hint) return; box = document.createElement('div'); box.id = 'kbTips'; box.style.cssText = 'margin-top:12px;padding:12px 14px;border-radius:12px;background:#eef3f9;font-size:15px;line-height:1.5'; hint.after(box); }
    const tips = (K.tips || []).slice(0, 3);
    if (!tips.length && !(K.myths || []).length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<b>What interviewers look for</b><ul style="margin:6px 0 0;padding-left:18px">${tips.map(t => `<li>${esc(t.text)}</li>`).join('')}${(K.myths || []).slice(0, 1).map(m => `<li><b>Common advice to ignore:</b> ${esc(m.myth)} ${esc(m.view)}</li>`).join('')}</ul><span style="font-size:13px;color:#5f6b76">From The Desk’s practitioners.</span>`;
  }
  const originalDerive = derive, originalRender = render;
  // eslint-disable-next-line no-global-assign
  derive = function () {
    originalDerive.apply(this, arguments);
    fetchKnowledge().then(() => {
      // Skip a reported question that repeats one already in the set (e.g. a second "why this firm").
      const words = s => new Set(String(s).toLowerCase().match(/[a-z]{4,}/g) || []);
      const overlap = (a, b) => { const A = words(a), B = words(b); let n = 0; A.forEach(w => { if (B.has(w)) n++; }); return n / Math.max(1, Math.min(A.size, B.size)); };
      const fq = (K.questions || []).find(x => Array.isArray(questions) && !questions.some(q => overlap(q.q, x.q) >= 0.6));
      if (fq && Array.isArray(questions) && !questions.some(q => q.kb)) {
        // Before the "why this firm" question, or 5th if there isn't one.
        const at = questions.findIndex(q => q.kind === 'motivation'); const pos = at > 0 ? at : Math.min(4, questions.length);
        const tips = (K.tips || []).slice(0, 3).map(t => t.text);
        questions.splice(pos, 0, { id: 'kb-' + Date.now(), kind: 'case', q: fq.q, hint: 'Commonly comes up at ' + fq.firm + (fq.stage ? ' (' + fq.stage.toLowerCase() + ')' : '') + '. ' + fq.hint, guide: { shape: 'Answer directly, then back it with your own example or reasoning.', points: tips.length ? tips : ['Give your answer in the first sentence.', 'Support it with one specific example or reason.', 'Say what it means for the firm or client.'] }, kb: true });
        if (current === 0) render(); else { const lbl = $('questionLabel'); if (lbl) lbl.textContent = 'Question ' + (current + 1) + ' of ' + questions.length; }
      } else tipsBox();
    });
  };
  render = function () { originalRender.apply(this, arguments); tipsBox(); };
  const btn = $('buildQuestions'); if (btn) btn.onclick = derive;
  ['firmSelect', 'roleSelect'].forEach(id => { const el = $(id); if (el) el.addEventListener('change', () => { key = ''; fetchKnowledge().then(tipsBox); }); });
  fetchKnowledge().then(tipsBox);
})();
