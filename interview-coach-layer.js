// The Desk · interview coach layer (loaded last on interview.html).
// 1. "Your CV for this question": as each question appears, picks the 3 points from the student's CV that best
//    answer it, highlights the words that matter, says why each one works, and shows the full CV with them marked.
// 2. A practitioner layer: who's behind the guidance, what interviewers listen for on this type of question.
// 3. A calmer, question-first look.
// It only reads the page (question text, question type, the CV box) and adds panels; it never changes how
// recording, timing or feedback work.
(() => {
  if (window.__deskCoachLayer) return; window.__deskCoachLayer = true;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- what each kind of question is really asking for ----------
  const THEMES = [
    { key: 'teamwork', label: 'teamwork', test: /team|together|colleague|group|collaborat|work with others|conflict|disagree/i,
      words: /\b(team|together|colleagues?|group|society|committee|collaborat\w*|alongside|with (?:the|a|my) \w+|seminar)\b/gi, why: 'shows you working with other people' },
    { key: 'leadership', label: 'leadership', test: /lead|leader|took charge|initiative|motivat|organis|organiz/i,
      words: /\b(led|lead|leading|president|head|captain|chair|organi[sz]ed|founded|set up|trained|mentored|managed|coordinated|ran)\b/gi, why: 'shows you taking the lead or helping others improve' },
    { key: 'pressure', label: 'handling pressure', test: /pressure|deadline|stress|busy|several|prioriti|juggl|time management|difficult|challenge|resilien|setback|fail/i,
      words: /\b(deadline|pressure|busy|alongside|while|despite|hours per week|full university timetable|exams?|part-time|juggl\w*|prioriti[sz]\w*)\b/gi, why: 'shows you delivering while stretched' },
    { key: 'mistake', label: 'spotting and fixing problems', test: /mistake|error|went wrong|problem|issue|improve|differently|learn/i,
      words: /\b(identified|spotted|noticed|flagged|escalated|corrected|fixed|resolved|error|duplicate|issue|problem|tested|checked)\b/gi, why: 'shows you noticing a problem and acting on it' },
    { key: 'analysis', label: 'analysis and numbers', test: /analy|technical|model|valu|numbers|data|excel|research|deal|transaction|company you|stock|pitch/i,
      words: /\b(dcf|valuation|model\w*|excel|analysis|analy[sz]ed|research\w*|comparables?|comps|ebitda|revenue|sensitivity|data|screen\w*|benchmark\w*|python|forecast\w*)\b/gi, why: 'shows real analytical work you can talk through' },
    { key: 'communication', label: 'communication', test: /communicat|present(?:ation|ed|ing)?\b|persuad|convinc|influenc|client|customer|explain (?:a|something) (?:complex|technical|difficult)/i,
      words: /\b(presented|presentation|pitched|explained|wrote|report\w*|persuad\w*|customer-facing|clients?|customers?|seminar)\b/gi, why: 'shows you explaining or persuading' },
    { key: 'motivation', label: 'why this role', test: /why (?:do you|this|us|the|investment|banking|our|are you)|motivat|interest(?:ed)? in|attract|career|introduc|tell me about yourself|walk me through/i,
      words: /\b(corporate finance|investment|transactions?|acquisition|deal|valuation|banking|markets?|intern\w*|analyst|equity|m&a|finance)\b/gi, why: 'links your experience to the job you want' }
  ];
  const NUM = /(£|\$|€)?\b\d[\d,.]*(%|k|m|bn)?\b/gi;
  const ACTION = /^(built|led|created|founded|managed|organi[sz]ed|presented|analy[sz]ed|identified|trained|applied|designed|developed|launched|raised|wrote|ran|delivered|negotiated|improved|reduced|increased|maintained|supported)\b/i;

  // ---------- read the CV into short, quotable points ----------
  function cvPoints() {
    const raw = ($('cvText')?.value || '').replace(/\r/g, '');
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const pts = []; let heading = '', section = '';
    for (const line of lines) {
      const isHeading = /^[A-Z][A-Z &/]{3,}$/.test(line);
      const isRole = /—|–| - /.test(line) && line.split(/\s+/).length <= 14 && !/[.;]\s+\w/.test(line);
      if (isHeading) { heading = ''; section = line.toUpperCase(); continue; }
      if (isRole) { heading = line; continue; }
      if (/^(email|phone|tel|linkedin|modules?|languages?|skills?|interests?|a-?levels?|gcses?)\b/i.test(line) || line.split(/\s+/).length < 5) continue;
      // Split long paragraphs into clauses a student could actually say.
      for (const part of line.split(/;\s+|\.\s+(?=[A-Z])/)) {
        const clean = part.replace(/\s*\[CONFIRM:[^\]]*\]/gi, '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
        if (clean.split(/\s+/).length >= 5 && !/^(SKILLS|INTERESTS|LANGUAGES)/.test(section) && !/^(modules?|predicted|final year|grades?)\b/i.test(clean)) pts.push({ text: clean, source: heading || (section === 'EDUCATION' ? 'Education' : ''), confirm: /\[CONFIRM/i.test(part) });
      }
    }
    return pts;
  }
  function themesFor(q, type) {
    const t = (type + ' ' + q).toLowerCase();
    const hits = THEMES.filter(th => th.test.test(t));
    // An introduction or "why" question is about motivation first, whatever else it mentions.
    const mi = hits.findIndex(h => h.key === 'motivation'); if (mi > 0) hits.unshift(...hits.splice(mi, 1));
    if (!hits.length) hits.push(THEMES.find(x => x.key === 'motivation'), THEMES.find(x => x.key === 'analysis'));
    return hits;
  }
  function score(pt, themes) {
    let s = 0; const why = [];
    for (const th of themes) { const m = pt.text.match(th.words); if (m) { s += 3 * Math.min(m.length, 2); why.push(th.why); } }
    if ((pt.text.match(NUM) || []).length) { s += 2; why.push('has a number you can quote'); }
    if (ACTION.test(pt.text)) s += 1;
    if (pt.confirm) s -= 0.5;
    return { s, why: [...new Set(why)] };
  }
  function mark(text, themes) {
    let h = esc(text);
    const words = new Set();
    for (const th of themes) for (const m of text.match(th.words) || []) words.add(m);
    for (const m of text.match(NUM) || []) if (/\d/.test(m)) words.add(m);
    [...words].sort((a, b) => b.length - a.length).forEach(w => { h = h.replace(new RegExp('(^|[^\\w>])(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\w<])', 'g'), '$1<mark>$2</mark>'); });
    return h;
  }

  // ---------- panels ----------
  const css = `
  .dc-cv{background:#fffdfa;border:1px solid #ddd7cf;border-radius:16px;padding:18px 20px;margin:14px 0}
  .dc-cv h3{font:500 20px/1.2 Fraunces,Georgia,serif;margin:4px 0 2px}.dc-k{font:700 11px/1 "DM Sans",Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#ff5a14}
  .dc-pts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
  .dc-pt{background:#fff;border:1px solid #ddd7cf;border-left-width:1px;border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.5;position:relative}
  .dc-pt .n{position:absolute;top:10px;right:12px;font:600 18px Fraunces,Georgia,serif;color:#c2410c}
  .dc-pt .src{font-size:12px;color:#5f6b76;font-weight:600;margin-bottom:4px;padding-right:22px}
  .dc-pt .why{font-size:12px;color:#15803d;font-weight:700;margin-top:6px}
  .dc-pt .chk{font-size:12px;color:#9a3412;margin-top:4px}
  .dc-cv mark,.dc-full mark{background:#ffe2cc;color:inherit;border-radius:3px;padding:0 2px}
  .dc-full{white-space:pre-wrap;font-size:13px;line-height:1.6;background:#fff;border:1px solid #ddd7cf;border-radius:12px;padding:12px 14px;max-height:360px;overflow:auto;margin-top:10px}
  .dc-full .hl{background:#fff1e6;border-radius:4px;box-shadow:0 0 0 2px #ffd2b3}
  .dc-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px;font-size:13px;color:#5f6b76}
  .dc-btn{background:transparent;border:1px solid #11191e;border-radius:999px;padding:7px 14px;font:700 13px "DM Sans",Arial,sans-serif;cursor:pointer;color:#11191e}
  .dc-pr{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:start;background:#11191e;color:#fff;border-radius:16px;padding:16px 20px;margin:14px 0}
  .dc-pr .k2{color:#ffb38f}.dc-pr ul{margin:6px 0 0;padding-left:18px;font-size:14px;line-height:1.55}.dc-pr .by{font-size:12px;color:#cfd6db;margin-top:8px}
  .dc-faces{display:flex}.dc-av{width:34px;height:34px;border-radius:50%;background:#dbe5f1;color:#123459;display:inline-flex;align-items:center;justify-content:center;font:700 12px "DM Sans",Arial,sans-serif;border:2px solid #11191e;margin-left:-8px}.dc-av:first-child{margin-left:0}
  .dc-empty{font-size:14px;color:#5f6b76;margin-top:8px}
  /* Calmer page: smaller hero, slimmer session bar, transcript column only as tall as it needs */
  body.dc-on .intro{padding:6px 0 4px!important;margin:0!important}
  body.dc-on .intro h1{font-size:clamp(24px,3vw,32px)!important;line-height:1.15!important;margin:4px 0!important}
  body.dc-on .intro p{display:none}
  body.dc-on .session-context{padding:12px 16px!important;margin:8px 0!important}
  body.dc-on .session-context .session-name{font-size:13px!important}
  body.dc-on section.transcript{min-height:0!important;height:auto!important}
  body.dc-on section.transcript textarea{min-height:140px!important}
  @media(max-width:860px){.dc-pts{grid-template-columns:1fr}.dc-pr{grid-template-columns:1fr}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const panel = document.createElement('section'); panel.className = 'dc-cv'; panel.setAttribute('aria-live', 'polite');
  const pr = document.createElement('section'); pr.className = 'dc-pr';
  let showFull = false, lastQ = '';

  const PANEL = [['KR', 'Kayyor Rao'], ['PC', 'Peter Cheley'], ['NR', 'Neil Robertson'], ['JS', 'Jim Staples'], ['CS', 'Chris Sharkey']];
  const LISTEN = {
    teamwork: ['Your part, not the team’s: say “I”, not “we”.', 'How you handled a disagreement or a weak link.', 'What the team achieved because of what you did.'],
    leadership: ['A moment you took responsibility nobody gave you.', 'How you got others to follow, not just your title.', 'A result you can measure.'],
    pressure: ['How you decided what to do first, and why.', 'What you dropped or delegated.', 'Proof it got done, and what you’d do differently.'],
    mistake: ['That you own it quickly and specifically.', 'What you did to fix it.', 'What you changed afterwards, so it doesn’t happen again.'],
    analysis: ['Walk through one piece of work: the question, your method, the answer.', 'One number you can defend.', 'What the analysis changed or recommended.'],
    communication: ['Who the audience was and what they needed.', 'How you adapted the message.', 'What happened as a result.'],
    motivation: ['Where you are now, in one line.', 'One or two experiences that point to this job.', 'Why this firm, specifically, as the next step.']
  };

  function render() {
    const q = ($('question')?.textContent || '').trim(), type = ($('questionType')?.textContent || '').trim();
    if (!q) return;
    const themes = themesFor(q, type), pts = cvPoints();
    // Points that match what the question is testing come first; a number alone isn't enough.
    const ranked = pts.map(p => ({ ...p, ...score(p, themes) })).filter(p => p.s > 0).sort((a, b) => (b.why.some(w => w !== 'has a number you can quote') - a.why.some(w => w !== 'has a number you can quote')) || b.s - a.s);
    // Best point from each different experience first, so the student has a range of examples; then fill up.
    const top = [], seen = new Set();
    for (const p of ranked) { if (top.length === 3) break; if (!seen.has(p.source)) { top.push(p); seen.add(p.source); } }
    for (const p of ranked) { if (top.length === 3) break; if (!top.includes(p)) top.push(p); }
    const label = themes.map(t => t.label).slice(0, 2).join(' and ');
    if (!pts.length) {
      panel.innerHTML = `<div class="dc-k">Your CV for this question</div><h3>Add your CV to see your best evidence here.</h3><p class="dc-empty">Paste your CV in “Your CV” above, or take the free assessment, and we’ll highlight the lines that answer each question.</p>`;
    } else {
      const fullHtml = (() => { let h = esc(($('cvText')?.value || '').replace(/\s*\[CONFIRM:[^\]]*\]/gi, '')); top.forEach((t, i) => { const e = esc(t.text); if (h.includes(e)) h = h.replace(e, `<span class="hl" title="Point ${i + 1}">${mark(t.text, themes)}</span>`); }); return h; })();
      panel.innerHTML = `<div class="dc-k">Your CV for this question</div><h3>The ${top.length === 1 ? 'point' : top.length + ' points'} from your CV that answer this best</h3>
        <div style="font-size:13px;color:#5f6b76">This question is testing <b>${esc(label)}</b>. Highlighted words are what the interviewer will listen for.</div>
        <div class="dc-pts">${top.map((t, i) => `<div class="dc-pt"><span class="n">${i + 1}</span>${t.source ? `<div class="src">${esc(t.source)}</div>` : ''}<div>${mark(t.text, themes)}</div>${t.why.length ? `<div class="why">✓ ${esc(t.why.slice(0, 2).join(' · '))}</div>` : ''}${t.confirm ? '<div class="chk">Check the detail before you say it</div>' : ''}</div>`).join('')}</div>
        <div class="dc-row"><span>${top[0] ? 'Open with point 1, then use one more as your example.' : ''}</span><button class="dc-btn" type="button" data-dc="full">${showFull ? 'Hide my full CV' : 'Show my full CV, highlighted'}</button></div>
        ${showFull ? `<div class="dc-full">${fullHtml}</div>` : ''}`;
      panel.querySelector('[data-dc=full]').onclick = () => { showFull = !showFull; render(); };
    }
    const lead = themes[0]?.key || 'motivation', firm = ($('firmSelect')?.selectedOptions?.[0]?.textContent || '').trim();
    pr.innerHTML = `<div class="dc-faces" aria-hidden="true">${PANEL.slice(0, 4).map(([i]) => `<span class="dc-av">${i}</span>`).join('')}</div>
      <div><div class="dc-k k2">What the interviewer is listening for</div><ul>${(LISTEN[lead] || LISTEN.motivation).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="by">From The Desk’s practitioner panel: people who have interviewed and hired for banks${firm && !/not sure/i.test(firm) ? ', including candidates for ' + esc(firm) : ''}.</div></div>`;
    // Pre-select the best example in the answer builder, if the student hasn't chosen one.
    const sel = $('answerCvEvidence');
    if (sel && top[0] && q !== lastQ) {
      const best = [...sel.options].find(o => o.value && (o.value.includes(top[0].text.slice(0, 40)) || top[0].text.includes(o.value.replace(/\s*\[CONFIRM:[^\]]*\]/gi, '').slice(0, 40))));
      if (best && sel.dataset.dcTouched !== '1') { sel.value = best.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    lastQ = q;
  }

  function place() {
    const qEl = $('question'); if (!qEl) return false;
    // Put the panels straight after the question card, so they're in view during thinking time.
    const card = qEl.closest('.qbox') || qEl.parentElement;
    if (!card?.parentElement) return false;
    if (panel.parentElement !== card.parentElement) { card.after(panel); panel.after(pr); }
    return true;
  }
  function start() {
    if (!place()) return setTimeout(start, 500);
    document.body.classList.add('dc-on');
    const sel = $('answerCvEvidence'); if (sel) sel.addEventListener('change', e => { if (e.isTrusted) sel.dataset.dcTouched = '1'; });
    render();
    const mo = new MutationObserver(() => { const q = ($('question')?.textContent || '').trim(); if (q && q !== lastQ) { showFull = false; if (sel) sel.dataset.dcTouched = ''; render(); } });
    ['question', 'questionType'].forEach(id => $(id) && mo.observe($(id), { childList: true, characterData: true, subtree: true }));
    const cv = $('cvText'); if (cv) cv.addEventListener('input', () => { clearTimeout(cv.__dc); cv.__dc = setTimeout(render, 500); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
