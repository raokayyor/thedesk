// The Desk · HireVue guide and "HireVue format" practice mode for the interview coach.
// Drop-in: add <link rel="stylesheet" href="/hirevue-guide.css"> and <script src="/hirevue-guide.js"></script> after the coach scripts.
// Uses the coach's own camera, recorder and questions. Firm formats live in HV_FIRM_FORMATS below: fill them in as students
// confirm them. Practitioner-approved points from the knowledge base (if installed) are added to each firm card.
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Content (The Desk's own wording) ----------
  const UPDATED = 'November 2026';
  // Firm formats, confirmed from invitations or student reports. Leave a field '' until confirmed; the page says so.
  // questions: '3–5', think: '30 seconds', answer: 'Up to 2 minutes', retakes: 'One practice question; no retakes', confirmed: 'Oct 2026, 3 students'
  const HV_FIRM_FORMATS = {
    jpm: { questions: '', think: '', answer: '', retakes: '', confirmed: '' },
    gs: { questions: '', think: '', answer: '', retakes: '', confirmed: '' },
    barclays: { questions: '', think: '', answer: '', retakes: '', confirmed: '' },
    ubs: { questions: '', think: '', answer: '', retakes: '', confirmed: '' },
    db: { questions: '', think: '', answer: '', retakes: '', confirmed: '' },
    bofa: { questions: '', think: '', answer: '', retakes: '', confirmed: '' },
    ey: { questions: '', think: '', answer: '', retakes: '', confirmed: '' },
    pwc: { questions: '', think: '', answer: '', retakes: '', confirmed: '' }
  };
  const ESSENTIALS = [
    ['Your first sentence does the work.', 'Give the answer straight away, then back it up. Reviewers form a view early, and a slow build-up costs you.'],
    ['Say your structure out loud.', '"Two reasons. First…" makes you easy to follow, for a person and for software reading the transcript.'],
    ['Four stories, not twenty scripts.', 'Prepare three or four real examples you can bend to different questions. Bullet points, never word-for-word.'],
    ['Know the firm, not just its name.', 'One recent deal or development, what the division does and who its clients are. This is where most candidates are thinnest.'],
    ['End on a result.', 'What changed because of what you did, with a number if you have one. "It went well" isn’t a result.'],
    ['Slow down.', 'Almost everyone speaks faster on camera. A short pause to think looks considered; filler words don’t.'],
    ['Look at the lens, not yourself.', 'Webcam at eye level, window moved close to the camera, your own video hidden if the platform allows.'],
    ['Practise in the real format.', 'Thinking time, a hard stop and no second chances. The practice mode below does exactly that.']
  ];
  const HOW = [
    ['What it is', 'A one-way recorded interview. A question appears on screen, you get a short time to think, then record your answer. There is no one on the other side while you record.'],
    ['Format', 'The employer sets the question count, preparation windows, answer limits and available attempts. Read your invitation and the instructions for each question; do not assume another candidate’s format applies.'],
    ['Retakes', 'Some firms allow a retake on some questions; many don’t. Assume you get one go unless the instructions say otherwise.'],
    ['Practice question', 'Most invitations start with an unscored practice question. Use it to check your camera, sound and timing.'],
    ['Who watches it', 'Both happen: some firms have software score the transcript against the qualities they’re looking for, and many have someone from HR or the team watch it. Prepare for a person watching, and make sure your words read well as a transcript too.'],
    ['Where it sits', 'Usually the first interview stage, after the application and online tests and before a live first round. For some spring weeks it is the main interview.']
  ];
  const TYPES = [
    { key: 'motivation', name: 'Why this firm / why this division', shape: 'Your reason → proof from your own experience → why this firm specifically', time: '60–90 seconds', qs: ['Why do you want to work at this firm?', 'Why this division rather than another part of the bank?'],
      weak: 'I’ve always been interested in finance and your firm is one of the most prestigious banks in the world, with a great culture and amazing opportunities to learn.',
      ok: 'I want to work in markets because I enjoy fast-paced environments, and your firm is a leader in fixed income. I followed the markets closely during my economics degree.',
      strong: 'Two reasons. First, I like work where a view gets tested quickly: running our society’s investment fund, I had to defend every position weekly and change my mind when the data did. Second, your rates business works with corporate treasurers hedging real exposures, and I’d rather start somewhere the client problem is concrete. I read about your work on [a recent example you have checked], and that’s the kind of problem I want to learn on.',
      notes: ['The weak answer could be about any bank; prestige and culture aren’t reasons.', 'The middle one names the area but the proof is vague: “followed the markets” is what everyone says.', 'The strong one leads with a structure, proves it with something they actually did, and names something specific to the firm. The bracket is a reminder: only use an example you have checked.'] },
    { key: 'cv', name: 'Walk me through your CV', shape: 'Now → the two or three steps that matter → why you’re here', time: '60–90 seconds', qs: ['Walk me through your CV.', 'Tell me about yourself.'] },
    { key: 'competency', name: 'Competency (teamwork, leadership, pressure)', shape: 'Situation in one line → what YOU did → result → what you learned', time: '90–120 seconds', qs: ['Tell me about a time you led a team.', 'Describe a time you worked under a tight deadline.'],
      weak: 'In my group project we had a tight deadline, so we all worked really hard together, split the tasks and managed to submit it on time. It taught me the importance of teamwork.',
      ok: 'In a group project, two members stopped contributing a week before the deadline. I reorganised the tasks and we submitted on time and got a good mark.',
      strong: 'A week before our valuation project was due, two of five team members went quiet and half the model was missing. I called a 20-minute meeting, split what was left by who knew which part, and took the cash-flow section myself because no one else had built one. I checked in each evening. We submitted a day early and got 72, the top mark in the module. Since then I agree who owns what in the first meeting, not the last week.',
      notes: ['The weak answer is all “we”: the reviewer can’t tell what you did.', 'The middle one has an action, but it’s one verb and a vague result.', 'The strong one is specific about the problem, what they personally did and why, a result with a number, and a lesson they still use.'] },
    { key: 'judgement', name: 'Judgement and ethics', shape: 'What you’d do first → why → how you’d handle the people involved', time: '60–90 seconds', qs: ['What would you do if you saw a colleague doing something against the rules?', 'A client asks for something that goes against policy. How do you respond?'],
      weak: 'I would probably talk to them first because I wouldn’t want to get anyone in trouble, and then see what happens.',
      ok: 'I’d raise it with my manager, because rules are there for a reason and it’s important to have integrity.',
      strong: 'I’d raise it promptly with my manager or compliance, because in a regulated firm the risk falls on clients and the bank, not just the colleague. I wouldn’t try to investigate it myself or keep quiet to protect someone. I’d stick to what I saw, not assumptions, and keep it confidential.',
      notes: ['The weak answer puts loyalty to a colleague ahead of the rules, which is the one thing a bank can’t hire.', 'The middle one gets the action right but the reason is a slogan.', 'The strong one is clear on the action, explains why in banking terms, and shows judgement about how to do it.'] },
    { key: 'commercial', name: 'Commercial awareness', shape: 'What happened → why it matters → what it means for this firm or its clients', time: '60–120 seconds', qs: ['Tell me about a deal or news story you’ve followed recently.', 'What’s a trend affecting this industry?'] },
    { key: 'technical', name: 'Light technical', shape: 'Definition in one line → how it works → a quick example', time: '45–90 seconds', qs: ['How would you value a company?', 'What happens to bond prices when interest rates rise, and why?'] }
  ];
  const MYTHS = [
    ['“An algorithm reads your face.”', 'Where software is used, it mostly works from what you say. Your words and your structure matter far more than your expression.'],
    ['“Nobody actually watches these.”', 'Plenty are watched by someone from HR or the team. Treat it as a real interview with a real person.'],
    ['“Memorise answers to the questions people post online.”', 'Learn the themes, not scripts. Questions get rotated, and a recited answer sounds recited.'],
    ['“Use every second of the answer time.”', 'Finish when you’ve made your point. A crisp 75 seconds beats a padded three minutes.'],
    ['“Thank them at the start.”', 'It isn’t wrong, but you’re talking to a recording and your time is short. Get to your answer.']
  ];
  const CHECKLIST = {
    'Two days before': ['Read the invitation: deadline, number of questions, timings, whether retakes are allowed.', 'Pick your four stories and map them to the question types above.', 'Prepare one recent, checked example of the firm’s work and one market story.', 'Do two full practice runs in HireVue format below and watch them back.'],
    'The hour before': ['Quiet room, door closed, phone on silent and out of reach.', 'Webcam at eye level, light in front of you, plain background.', 'Laptop plugged in; close other apps and browser tabs.', 'Dress as you would for the firm in person. Follow the employer’s guidance and choose clothing suited to the role.'],
    'Ten minutes before': ['Run the camera and sound check below. If you use wireless earphones, check they’re connected.', 'Glance at your four stories, not a script.', 'Use the platform’s practice question to check timing.', 'Slow your breathing. An invitation alone does not establish how the employer screened applications.']
  };
  const STORY_SLOTS = [
    ['Leading or organising people', 'a society role, a team project, a part-time job'],
    ['Working under pressure or to a deadline', 'exams plus a job, a project rescue, a busy shift'],
    ['Analysis or problem-solving', 'a valuation, a dissertation, a fix you found at work'],
    ['A setback and what you learned', 'a rejection, a mistake you put right, a plan that changed']
  ];

  // ---------- Build the guide ----------
  const anchor = $('.practice-settings') || $('main section');
  if (!anchor) return;
  const root = document.createElement('section');
  root.className = 'hv'; root.id = 'hirevueGuide'; root.setAttribute('aria-labelledby', 'hvTitle');
  const bank = globalThis.DeskInterviewBank;
  const firmKeys = bank ? Object.keys(bank.firms).filter(k => k !== 'general') : Object.keys(HV_FIRM_FORMATS);
  root.innerHTML = `
    <div class="hv-head"><div><div class="hv-kicker">HireVue and video interviews</div><h2 id="hvTitle">How to tackle HireVue</h2>
      <p>A practical preparation guide: understand the format, build answers from your own evidence and rehearse under a timer. Updated ${UPDATED}.</p><p><a href="/video-library.html">Watch The Desk’s firm preparation videos →</a></p></div>
      <div class="hv-jump"><button class="hv-btn" type="button" data-hv-go="hvPractise">Practise in HireVue format</button></div></div>
    <div class="hv-proof" data-desk-proof></div>
    <nav class="hv-tabs" aria-label="HireVue guide sections">${[['hvQuick', '2-minute version'], ['hvHow', 'How it works'], ['hvFirms', 'Your firm'], ['hvTypes', 'Question types'], ['hvStories', 'Your stories'], ['hvDay', 'On the day'], ['hvMyths', 'Myths'], ['hvPractise', 'Practise']].map(([id, l]) => `<button type="button" data-hv-go="${id}">${l}</button>`).join('')}</nav>

    <details class="hv-sec" id="hvQuick" open><summary>The 2-minute version</summary><ol class="hv-essentials">${ESSENTIALS.map(([t, d]) => `<li><b>${esc(t)}</b> ${esc(d)}</li>`).join('')}</ol></details>

    <details class="hv-sec" id="hvHow"><summary>How HireVue works</summary><dl class="hv-grid">${HOW.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl></details>

    <details class="hv-sec" id="hvFirms"><summary>Your firm</summary>
      <p class="hv-mute">Formats change between programmes and seasons. We only show a format once it’s been confirmed; always check your own invitation.</p>
      <label class="hv-label">Firm <select id="hvFirm">${firmKeys.map(k => `<option value="${k}">${esc(bank ? bank.firms[k].label : k)}</option>`).join('')}</select></label>
      <div id="hvFirmCard" class="hv-card"></div></details>

    <details class="hv-sec" id="hvTypes"><summary>The six question types</summary>
      <div class="hv-types">${TYPES.map(t => `<article class="hv-card"><h3>${esc(t.name)}</h3><p class="hv-shape"><b>Shape:</b> ${esc(t.shape)} <span class="hv-mute">· aim for ${esc(t.time)}</span></p>
        <p class="hv-mute">For example: ${t.qs.map(q => '“' + esc(q) + '”').join(' or ')}</p>
        ${t.strong ? `<details class="hv-ex"><summary>See illustrative weak, average and stronger answers (fictional examples)</summary>
          <div class="hv-ans weak"><span>Weak</span>${esc(t.weak)}</div><div class="hv-ans ok"><span>Average</span>${esc(t.ok)}</div><div class="hv-ans strong"><span>Strong</span>${esc(t.strong)}</div>
          <div class="hv-notes"><b>What makes the example stronger</b><ul>${t.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div></details>` : ''}
      </article>`).join('')}</div></details>

    <details class="hv-sec" id="hvStories"><summary>Your four stories</summary>
      <p class="hv-mute">Build a small bank of genuine examples, then choose one that fits the actual question. Write a few bullet points for each: the situation, what you did, the result. This stays in your browser.</p>
      <div class="hv-stories">${STORY_SLOTS.map(([t, e], i) => `<label class="hv-story"><b>${i + 1}. ${esc(t)}</b><span class="hv-mute">e.g. ${esc(e)}</span><textarea data-story="${i}" rows="4" placeholder="Situation… What I did… Result…"></textarea></label>`).join('')}</div>
      <p class="hv-mute" id="hvStoryCv"></p></details>

    <details class="hv-sec" id="hvDay"><summary>On the day</summary>
      <div class="hv-checks">${Object.entries(CHECKLIST).map(([when, items], g) => `<div class="hv-card"><h3>${esc(when)}</h3>${items.map((x, i) => `<label class="hv-check"><input type="checkbox" data-check="${g}-${i}"> <span>${esc(x)}</span></label>`).join('')}</div>`).join('')}</div>
      <div class="hv-row"><button class="hv-btn ghost" type="button" id="hvCamCheck">Run a camera and sound check</button><button class="hv-btn ghost" type="button" id="hvPrint">Print the checklist</button></div></details>

    <details class="hv-sec" id="hvMyths"><summary>Common misconceptions</summary>
      ${MYTHS.map(([m, v]) => `<div class="hv-myth"><b>You’ll hear:</b> ${esc(m)}<br><b>Our view:</b> ${esc(v)}</div>`).join('')}<div id="hvKbMyths"></div></details>

    <details class="hv-sec" id="hvPractise" open><summary>Practise in HireVue format</summary>
      <p>Thinking time, then a timed answer that stops on its own, with the number of retakes you choose. It uses the camera and the current question above. Afterwards, press “Assess this answer” for detailed feedback and the interviewer’s follow-up. <span class="hv-mute" id="hvFree"></span></p>
      <div class="hv-settings">
        <label class="hv-label">Thinking time <select id="hvThink"><option value="30" selected>30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option></select></label>
        <label class="hv-label">Answer time <select id="hvAnswer"><option value="60">1 minute</option><option value="120" selected>2 minutes</option><option value="180">3 minutes</option></select></label>
        <label class="hv-label">Retakes <select id="hvRetakes"><option value="0" selected>None (single-attempt practice)</option><option value="1">One</option><option value="2">Two</option></select></label>
      </div>
      <div class="hv-row"><button class="hv-btn" type="button" id="hvStart">Start this question in HireVue format</button><span class="hv-mute" id="hvStatus" role="status"></span></div>
      <div class="hv-stage" id="hvStage" hidden><div class="hv-phase" id="hvPhase">Thinking time</div><div class="hv-clock" id="hvClock">0:30</div><div class="hv-q" id="hvQ"></div>
        <div class="hv-row"><button class="hv-btn ghost" type="button" id="hvSkip">Start answering now</button><button class="hv-btn ghost" type="button" id="hvEnd">Finish answer</button></div></div>
    </details>`;
  anchor.after(root);

  // Navigation
  root.querySelectorAll('[data-hv-go]').forEach(b => b.addEventListener('click', () => { const d = document.getElementById(b.dataset.hvGo); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }));

  // Firm cards, with knowledge-base points if available.
  const firmSel = $('#hvFirm');
  const formatsP = fetch('/api/value-account?view=formats').then(r => r.ok ? r.json() : {}).then(d => d.formats || {}).catch(() => ({}));
  async function drawFirm() {
    let k = firmSel.value, f = HV_FIRM_FORMATS[k] || {}, label = bank && bank.firms[k] ? bank.firms[k].label : k;
    const row = (t, v) => `<div><dt>${t}</dt><dd>${v ? esc(v) : '<span class="hv-mute">Not confirmed yet</span>'}</dd></div>`;
    let kb = { tips: [], questions: [] };
    try { const r = await fetch('/api/knowledge?view=interview&firm=' + encodeURIComponent(label)); if (r.ok) kb = await r.json(); } catch (e) { }
    // Formats students reported after their own interview (approved by staff) fill anything not set above.
    const rep = (await formatsP)[label] || null;
    const val = (own, r) => own || (r && r.value ? r.value + (r.n > 1 ? ` (${r.n} students)` : '') : '');
    if (rep) f = { questions: val(f.questions, rep.questions && { ...rep.questions, value: rep.questions.value + ' questions' }), think: val(f.think, rep.think), answer: val(f.answer, rep.answer), retakes: val(f.retakes, rep.retakes), confirmed: f.confirmed || `reported by ${rep.reports} student${rep.reports === 1 ? '' : 's'}, latest ${new Date(rep.latest + '-01T12:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` };
    const tips = (kb.tips || []).filter(t => t.firm), qs = kb.questions || [];
    $('#hvFirmCard').innerHTML = `<h3>${esc(label)}</h3>
      <dl class="hv-grid small">${row('Questions', f.questions)}${row('Thinking time', f.think)}${row('Answer time', f.answer)}${row('Retakes', f.retakes)}</dl>
      ${f.confirmed ? `<p class="hv-mute">Confirmed: ${esc(f.confirmed)}</p>` : '<p class="hv-mute">Nobody has confirmed this firm’s format yet. Had yours? Tell us and we’ll add it for the next student.</p>'}
      ${bank && bank.firms[k] ? `<p><b>What to prepare:</b> ${esc(bank.firms[k].focus)}</p>` : ''}
      ${qs.length ? `<p><b>Commonly discussed for ${esc(label)}:</b></p><ul>${qs.map(q => `<li>${esc(q.q)}</li>`).join('')}</ul>` : ''}
      ${tips.length ? `<p><b>From our practitioners:</b></p><ul>${tips.map(t => `<li>${esc(t.text)}</li>`).join('')}</ul>` : ''}
      <div class="hv-row"><button class="hv-btn ghost" type="button" id="hvUseFirm">Practise ${esc(label)} questions</button>${window.DeskOutcome ? `<button class="hv-btn ghost" type="button" id="hvTell">Had yours? Tell us how it went</button>` : ''}</div>`;
    const tell = $('#hvTell'); if (tell) tell.onclick = () => window.DeskOutcome.open({ firm: label, stage: 'HireVue / video interview' });
    $('#hvUseFirm').onclick = () => { const s = document.getElementById('firmSelect'); if (s) { s.value = k; s.dispatchEvent(new Event('change')); s.onchange && s.onchange(); } document.getElementById('hvPractise').open = true; document.getElementById('hvPractise').scrollIntoView({ behavior: 'smooth' }); };
  }
  const coachFirm = document.getElementById('firmSelect');
  if (coachFirm && HV_FIRM_FORMATS[coachFirm.value]) firmSel.value = coachFirm.value;
  firmSel.onchange = drawFirm; drawFirm();
  // Myths from the knowledge base
  fetch('/api/knowledge?view=interview').then(r => r.ok ? r.json() : null).then(d => { if (d && d.myths && d.myths.length) $('#hvKbMyths').innerHTML = d.myths.map(m => `<div class="hv-myth"><b>You’ll hear:</b> ${esc(m.myth)}<br><b>Our view:</b> ${esc(m.view)}</div>`).join(''); }).catch(() => { });

  // Stories and checklist stay in this browser.
  const store = { get(k) { try { return localStorage.getItem('hv:' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('hv:' + k, v); } catch (e) { } } };
  root.querySelectorAll('[data-story]').forEach(t => { t.value = store.get('story' + t.dataset.story) || ''; t.addEventListener('input', () => store.set('story' + t.dataset.story, t.value)); });
  root.querySelectorAll('[data-check]').forEach(c => { c.checked = store.get('check' + c.dataset.check) === '1'; c.addEventListener('change', () => store.set('check' + c.dataset.check, c.checked ? '1' : '0')); });
  const cv = document.getElementById('cvText');
  if (cv && cv.value.trim()) $('#hvStoryCv').textContent = 'Your CV is loaded above: look at your experience and society lines for these stories.';
  $('#hvPrint').onclick = () => { document.body.classList.add('hv-printing'); document.getElementById('hvDay').open = true; window.print(); setTimeout(() => document.body.classList.remove('hv-printing'), 500); };
  $('#hvCamCheck').onclick = async () => { const b = document.getElementById('cameraBtn'); if (b && !b.disabled) b.click(); const p = document.getElementById('preview'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  // ---------- HireVue format practice ----------
  // Thinking countdown → recording starts (coach's start()) → answer countdown → recording stops (coach's stop()).
  const S = { phase: '', timer: null, retakesLeft: 0, qIndex: -1, generation:0 };
  const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const currentQ = () => (typeof questions !== 'undefined' && questions[current]) ? questions[current].q : (document.getElementById('question') || {}).textContent || '';
  function countdown(secs, onTick, onEnd) { clearInterval(S.timer); let left = secs; onTick(left); if(left<=0){onEnd();return} S.timer = setInterval(() => { left--; onTick(left); if (left <= 0) { clearInterval(S.timer); onEnd(); } }, 1000); }
  function setStatus(t) { $('#hvStatus').textContent = t; }
  async function hvStart(retake) {
    if (typeof start !== 'function' || typeof stop !== 'function') return setStatus('Practice mode needs the interview coach on this page.');
    if (typeof stream === 'undefined' || !stream) { setStatus('Turn on your camera first (the button by the video), then start.'); const b = document.getElementById('cameraBtn'); if (b && !b.disabled) b.click(); return; }
    if (!retake) { S.retakesLeft = +$('#hvRetakes').value; S.qIndex = typeof current !== 'undefined' ? current : -1; }
    const think = +$('#hvThink').value, answer = +$('#hvAnswer').value;
    $('#hvStage').hidden = false; $('#hvQ').textContent = currentQ(); $('#hvStart').disabled = true; $('#hvSkip').hidden = false; $('#hvEnd').hidden = true;
    const token=++S.generation;
    if(document.getElementById('voiceQuestions')?.checked){
      S.phase='question';window.DeskInterviewStarting=true;$('#hvPhase').textContent='Listen to the question';$('#hvClock').textContent='—';$('#hvSkip').hidden=true;
      const heard=await window.DeskInterviewVoice?.readQuestion();window.DeskInterviewStarting=false;
      if(token!==S.generation)return;
      if(!heard){S.phase='';$('#hvStart').disabled=false;setStatus('Question audio did not finish. Try Start again, or turn off Read questions aloud to continue.');return;}
    }
    $('#hvStage').scrollIntoView({ behavior: 'smooth', block: 'center' });$('#hvSkip').hidden=false;
    S.phase = 'think'; $('#hvPhase').textContent = 'Thinking time';
    countdown(think, l => { $('#hvClock').textContent = fmt(Math.max(l, 0)); }, () => beginAnswer(answer));
    setStatus(retake ? 'Retake started.' : '');
  }
  function beginAnswer(answer) {
    clearInterval(S.timer); S.phase = 'answer'; $('#hvPhase').textContent = 'Recording'; $('#hvSkip').hidden = true; $('#hvEnd').hidden = false;
    start();
    if (typeof tick !== 'undefined') clearInterval(tick);   // use our answer time, not the coach's default
    countdown(answer, l => { $('#hvClock').textContent = fmt(Math.max(l, 0)); const t = document.getElementById('timer'); if (t) t.textContent = fmt(Math.max(l, 0)).padStart(5, '0'); $('#hvClock').classList.toggle('low', l <= 10); }, finish);
  }
  function finish() {
    clearInterval(S.timer); if (S.phase !== 'answer') return; S.phase = ''; stop();
    $('#hvPhase').textContent = 'Answer recorded'; $('#hvClock').classList.remove('low'); $('#hvEnd').hidden = true; $('#hvStart').disabled = false;
    const left = S.retakesLeft;
    $('#hvStatus').innerHTML = `Done. Watch it back with “Play recording”, then check your transcript and get feedback. ${left > 0 ? `<button class="hv-btn ghost" type="button" id="hvRetake">Retake (${left} left)</button>` : 'No retakes left, as in the real thing.'}`;
    const r = document.getElementById('hvRetake'); if (r) r.onclick = () => { S.retakesLeft--; hvStart(true); };
  }
  document.addEventListener('desk:questionchange',()=>{S.generation++;window.DeskInterviewStarting=false;clearInterval(S.timer);S.phase='';$('#hvStart').disabled=false;$('#hvStage').hidden=true;setStatus('');});
  $('#hvStart').onclick = () => hvStart(false);
  fetch('/api/interview-feedback', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(d => { if (d && !d.paid) $('#hvFree').textContent = `Your first ${d.limit} answers each day get detailed feedback free (${d.left} left today).`; }).catch(() => { });
  $('#hvSkip').onclick = () => beginAnswer(+$('#hvAnswer').value);
  $('#hvEnd').onclick = finish;
  const stopBtn = document.getElementById('stopBtn');
  if (stopBtn) stopBtn.addEventListener('click', () => { if (S.phase === 'answer') finish();else if(S.phase){S.generation++;window.DeskInterviewStarting=false;window.DeskInterviewVoice?.cancel();clearInterval(S.timer);S.phase='';$('#hvStage').hidden=true;$('#hvStart').disabled=false;} });
})();
