// The Desk: interviewer layer for the interview page (works on the live and GitHub versions).
// Adds to the camera panel: an AI interviewer tile (speaking / listening / waiting, with a real voice level),
// live captions of the question as it is read, and a tools bar (captions, framing guide, mirror, mic level, voice used).
// Reads only shared hooks: .camera, #preview, #camStatus, #question. Load after the page's own scripts.
(() => {
  if (window.__deskInterviewer) return; window.__deskInterviewer = true;
  const $ = s => document.querySelector(s);
  const camera = $('.camera'); if (!camera) return;
  const store = { get(k, d) { try { const v = localStorage.getItem('dc-iv-' + k); return v == null ? d : v === '1'; } catch { return d; } }, set(k, v) { try { localStorage.setItem('dc-iv-' + k, v ? '1' : '0'); } catch {} } };
  const opts = { captions: store.get('captions', true), guide: store.get('guide', false), mirror: store.get('mirror', true) };

  const css = document.createElement('style');
  css.textContent = `
  .dc-iv{position:absolute;right:16px;top:58px;width:188px;background:rgba(14,20,24,.82);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 11px;color:#fff;font-family:inherit;z-index:3;transition:border-color .2s}
  .dc-iv.speaking{border-color:#ff854c}.dc-iv.listening{border-color:#3ecf8e}
  .dc-iv-top{display:flex;gap:9px;align-items:center}
  .dc-iv-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2b3a44,#1b252b);border:2px solid rgba(255,255,255,.18);display:grid;place-items:center;font-weight:700;font-size:12px;letter-spacing:.04em;position:relative;flex:none}
  .dc-iv.speaking .dc-iv-av{border-color:#ff854c;box-shadow:0 0 0 calc(var(--lv,0)*9px) rgba(255,133,76,.25)}
  .dc-iv.listening .dc-iv-av{border-color:#3ecf8e}
  .dc-iv-name{font-size:11px;font-weight:700;line-height:1.25}.dc-iv-firm{font-size:9.5px;color:#b9c2c7;line-height:1.3}
  .dc-iv-state{display:flex;align-items:center;gap:7px;margin-top:9px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#cfd6da}
  .dc-iv-bars{display:flex;gap:2px;align-items:flex-end;height:14px}.dc-iv-bars i{width:3px;background:#5b666d;border-radius:2px;height:3px;transition:height .08s}
  .dc-iv.speaking .dc-iv-bars i{background:#ff854c}.dc-iv.listening .dc-iv-bars i{background:#3ecf8e}
  .dc-iv-ai{margin-top:7px;font-size:8.5px;color:#8f9aa0}
  .dc-cap{position:absolute;left:50%;transform:translateX(-50%);bottom:18px;width:min(86%,720px);text-align:center;z-index:3;pointer-events:none}
  .dc-cap span{display:inline;background:rgba(0,0,0,.72);color:#fff;font-size:17px;line-height:1.55;padding:3px 8px;border-radius:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
  .dc-cap b{font-weight:400;color:rgba(255,255,255,.35)}
  .dc-guide{position:absolute;inset:0;pointer-events:none;z-index:2}
  .dc-guide:before{content:"";position:absolute;left:50%;top:14%;width:26%;height:62%;transform:translateX(-50%);border:2px dashed rgba(255,255,255,.45);border-radius:50% 50% 46% 46%}
  .dc-guide:after{content:"Eyes on this line · look at the lens, not the screen";position:absolute;left:8%;right:8%;top:33%;border-top:1px solid rgba(255,133,76,.7);color:rgba(255,255,255,.75);font-size:10px;padding-top:4px;text-align:center}
  .camera.dc-mirror video{transform:scaleX(-1)}
  .dc-tools{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:9px 14px;background:#0f161a;border-top:1px solid #222c31;color:#cfd6da;font-size:11px}
  .dc-tools button{background:#1b252b;color:#dfe5e8;border:1px solid #2c383f;border-radius:999px;padding:6px 11px;font:inherit;font-size:11px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
  .dc-tools button[aria-pressed=true]{background:#24323a;border-color:#ff854c;color:#fff}
  .dc-tools .dc-sp{flex:1}
  .dc-mic{display:inline-flex;align-items:center;gap:7px}.dc-mic-m{width:90px;height:6px;background:#26323a;border-radius:4px;overflow:hidden}.dc-mic-m i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3ecf8e,#c7e85a 70%,#ff854c);transition:width .08s}
  .dc-voice{font-size:10.5px;color:#9aa6ac}.dc-voice b{color:#fff;font-weight:600}
  @media (max-width:700px){.dc-iv{width:150px;top:52px;right:10px;padding:8px}.dc-iv-firm,.dc-iv-ai{display:none}.dc-cap span{font-size:13px}}
  `;
  document.head.appendChild(css);

  // ---- interviewer tile
  const tile = document.createElement('div');
  tile.className = 'dc-iv'; tile.setAttribute('aria-live', 'polite');
  tile.innerHTML = `<div class="dc-iv-top"><div class="dc-iv-av">AI</div><div><div class="dc-iv-name">Interviewer</div><div class="dc-iv-firm"></div></div></div>
    <div class="dc-iv-state"><span class="dc-iv-bars">${'<i></i>'.repeat(7)}</span><span class="dc-iv-label">Waiting for you</span></div>
    <div class="dc-iv-ai">AI voice · practice interview</div>`;
  camera.appendChild(tile);
  const bars = [...tile.querySelectorAll('.dc-iv-bars i')], label = tile.querySelector('.dc-iv-label');

  const cap = document.createElement('div'); cap.className = 'dc-cap'; cap.hidden = true; camera.appendChild(cap);
  const guide = document.createElement('div'); guide.className = 'dc-guide'; guide.hidden = !opts.guide; camera.appendChild(guide);
  camera.classList.toggle('dc-mirror', opts.mirror);

  function firm() {
    const q = $('#question')?.textContent || '';
    const sel = $('#firmSelect'); const s = sel && sel.value && sel.options?.[sel.selectedIndex]?.textContent;
    const m = q.match(/\bat ([A-Z][\w.&'’ -]{1,40}?)[?.]?\s*$/) || q.match(/\b(?:join|choose|why) ([A-Z][\w.&'’-]+(?: [A-Z][\w.&'’-]+){0,3})/);
    return (s && !/choose|select/i.test(s) ? s : m?.[1]) || '';
  }
  function setFirm() {
    const f = firm();
    tile.querySelector('.dc-iv-firm').textContent = f ? 'Practice for ' + f : 'Practice interview';
    tile.querySelector('.dc-iv-av').textContent = f ? f.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AI' : 'AI';
  }

  // ---- state
  let state = 'waiting', speakStart = 0, speakDur = 0, recording = false;
  function setState(s) {
    state = s; tile.classList.toggle('speaking', s === 'speaking'); tile.classList.toggle('listening', s === 'listening');
    label.textContent = s === 'speaking' ? 'Asking the question' : s === 'listening' ? 'Listening to your answer' : s === 'preparing' ? 'Getting ready…' : 'Waiting for you';
    if (s === 'speaking') { speakStart = performance.now(); showCaption(); } else if (s !== 'preparing') { cap.hidden = true; }
  }

  // Interviewer audio: ElevenLabs plays through new Audio(); device voice through speechSynthesis.
  let voiceUsed = '';
  let ctx = null; const levels = { voice: null, mic: null };
  function audioCtx() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } } if (ctx?.state === 'suspended') ctx.resume().catch(() => {}); return ctx; }
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const p = origPlay.apply(this, arguments);
    if (!(this instanceof HTMLVideoElement) && this.src && /^blob:/.test(this.src) && !this.__dcSeen) {
      this.__dcSeen = true; voiceUsed = 'natural'; showVoice();
      const el = this;
      const begin = () => { speakDur = (isFinite(el.duration) ? el.duration : 0) * 1000; setState('speaking'); };
      if (el.readyState >= 1) begin(); else el.addEventListener('loadedmetadata', begin, { once: true });
      el.addEventListener('ended', () => state === 'speaking' && setState('waiting'), { once: true });
      el.addEventListener('pause', () => state === 'speaking' && setState('waiting'), { once: true });
      try { const c = audioCtx(); if (c) { const src = c.createMediaElementSource(el), an = c.createAnalyser(); an.fftSize = 256; src.connect(an); an.connect(c.destination); levels.voice = an; } } catch {}
    }
    return p;
  };
  if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
    const origSpeak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = u => {
      voiceUsed = voiceUsed || 'device'; if (voiceUsed !== 'natural') voiceUsed = 'device'; showVoice();
      const words = (u.text || '').split(/\s+/).length; speakDur = words / 2.5 * 1000 / (u.rate || 1);
      u.addEventListener('start', () => { levels.voice = null; setState('speaking'); });
      u.addEventListener('end', () => setState('waiting')); u.addEventListener('error', () => setState('waiting'));
      return origSpeak(u);
    };
  }
  // Recording: watch MediaRecorder so "listening" matches the real recorder.
  if (window.MediaRecorder) {
    const P = MediaRecorder.prototype, s0 = P.start, s1 = P.stop;
    P.start = function () { const r = s0.apply(this, arguments); recording = true; setState('listening'); this.addEventListener('stop', () => { recording = false; setState('waiting'); }, { once: true }); return r; };
    P.stop = function () { recording = false; setState('waiting'); return s1.apply(this, arguments); };
  }
  // The page's own status line, as a fallback (e.g. "Preparing interviewer audio…").
  const status = $('#camStatus'), vs = $('#voiceStatus');
  if (vs) new MutationObserver(() => { if (/Preparing interviewer audio/i.test(vs.textContent) && state === 'waiting') setState('preparing'); if (/could not play/i.test(vs.textContent)) setState('waiting'); }).observe(vs, { childList: true, characterData: true, subtree: true });
  if (status) new MutationObserver(() => { if (/speaking/i.test(status.textContent) && state === 'waiting') setState('preparing'); attachMic(); }).observe(status, { childList: true, characterData: true, subtree: true });

  // ---- captions (words appear in step with the voice)
  function showCaption() {
    if (!opts.captions) return;
    cap.hidden = false;
  }
  function drawCaption() {
    if (cap.hidden || state !== 'speaking') return;
    const words = ($('#question')?.textContent || '').trim().split(/\s+/);
    const dur = speakDur || words.length / 2.5 * 1000;
    const n = Math.min(words.length, Math.ceil((performance.now() - speakStart) / dur * words.length * 1.04));
    // show a rolling window of ~16 words so long questions stay on two lines
    const start = Math.max(0, Math.min(n - 10, words.length - 16));
    const shown = words.slice(start, n).join(' '), rest = words.slice(n, start + 16).join(' ');
    cap.innerHTML = '<span>' + esc(shown) + (rest ? ' <b>' + esc(rest) + '</b>' : '') + '</span>';
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- mic level
  let micStream = null;
  function attachMic() {
    const v = $('#preview'), st = v?.srcObject;
    if (!st || st === micStream || !st.getAudioTracks?.().length) return;
    micStream = st;
    try { const c = audioCtx(); if (!c) return; const an = c.createAnalyser(); an.fftSize = 256; c.createMediaStreamSource(st).connect(an); levels.mic = an; micWrap.hidden = false; } catch {}
  }
  const buf = new Uint8Array(128);
  function level(an) { if (!an) return 0; an.getByteTimeDomainData(buf); let s = 0; for (const b of buf) { const x = (b - 128) / 128; s += x * x; } return Math.min(1, Math.sqrt(s / buf.length) * 4); }

  // ---- tools bar
  const tools = document.createElement('div'); tools.className = 'dc-tools';
  tools.innerHTML = `<button type="button" data-t="captions">Captions</button><button type="button" data-t="guide">Framing guide</button><button type="button" data-t="mirror">Mirror</button>
    <span class="dc-mic" hidden><span>Your mic</span><span class="dc-mic-m"><i></i></span></span><span class="dc-sp"></span><span class="dc-voice"></span>`;
  camera.insertAdjacentElement('afterend', tools);
  const micWrap = tools.querySelector('.dc-mic'), micBar = tools.querySelector('.dc-mic-m i');
  function syncTools() { tools.querySelectorAll('button[data-t]').forEach(b => b.setAttribute('aria-pressed', String(!!opts[b.dataset.t]))); }
  tools.addEventListener('click', e => {
    const b = e.target.closest('button[data-t]'); if (!b) return; const k = b.dataset.t; opts[k] = !opts[k]; store.set(k, opts[k]); syncTools();
    if (k === 'guide') guide.hidden = !opts.guide; if (k === 'mirror') camera.classList.toggle('dc-mirror', opts.mirror);
    if (k === 'captions') { if (!opts.captions) cap.hidden = true; else if (state === 'speaking') cap.hidden = false; }
  });
  function showVoice() {
    const el = tools.querySelector('.dc-voice');
    const natural = voiceUsed === 'natural' || (!voiceUsed && window.DeskNaturalVoice?.enabled);
    el.innerHTML = 'Interviewer voice: <b>' + (natural ? 'Natural (AI)' : 'Device voice') + '</b>';
  }
  syncTools(); showVoice(); window.DeskNaturalVoice?.ready?.then(showVoice);

  // ---- animation loop
  let t = 0;
  (function frame() {
    t++;
    const lv = state === 'speaking' ? (levels.voice ? level(levels.voice) : 0.35 + 0.35 * Math.abs(Math.sin(t / 5)) * Math.random())
      : state === 'listening' ? level(levels.mic) : state === 'preparing' ? 0.15 + 0.1 * Math.sin(t / 6) : 0;
    bars.forEach((b, i) => { const k = Math.max(0.12, lv * (0.55 + 0.45 * Math.sin(t / 3 + i * 1.3))); b.style.height = (3 + k * 11).toFixed(1) + 'px'; });
    tile.style.setProperty('--lv', lv.toFixed(2));
    micBar.style.width = (level(levels.mic) * 100).toFixed(0) + '%';
    if (t % 4 === 0) drawCaption();
    requestAnimationFrame(frame);
  })();

  setFirm();
  const q = $('#question'); if (q) new MutationObserver(setFirm).observe(q, { childList: true, characterData: true, subtree: true });
  setInterval(attachMic, 1500);
})();
