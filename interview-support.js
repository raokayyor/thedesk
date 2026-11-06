(() => {
  const browserVoiceAvailable = typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
  const voiceAvailable = browserVoiceAvailable || !!window.DeskNaturalVoice;
  const voiceToggle = document.getElementById('voiceQuestions');
  const hearButton = document.getElementById('hearQuestion');
  const voiceStatus = document.getElementById('voiceStatus');
  let speechToken = 0, spokenQuestion = '', reading = false, waiting = false;
  function isRecording() { return recorder && recorder.state === 'recording'; }
  function updateRecordLabel() { document.getElementById('recordBtn').textContent = isRecording() ? 'Recording your answer…' : 'Start recording'; }
  function lock(active) {
    for (const id of ['firmSelect','roleSelect','practiceFocus','logicToggle','newSessionBtn','cameraBtn','audioOnlyBtn']) { const control = document.getElementById(id); if (control) control.disabled = active; }
    document.getElementById('buildQuestions').disabled = active;
    document.getElementById('nextBtn').disabled = active;
    hearButton.disabled = active || !voiceAvailable;
    document.getElementById('playBtn').disabled = active || !recordingUrl;
    document.getElementById('recordBtn').disabled = !!isRecording();
    document.getElementById('stopBtn').disabled = !isRecording() && !reading;
  }
  function cancelVoice() {
    speechToken++;
    if (browserVoiceAvailable) window.speechSynthesis.cancel();
    window.DeskNaturalVoice?.cancel();
    reading = false; waiting = false;
  }
  async function readQuestion() {
    if (isRecording() || reading) return false;
    cancelVoice();
    const token=speechToken;reading=true;lock(true);
    const preview = document.getElementById('preview');
    if (preview.src && !preview.srcObject) { preview.pause(); preview.removeAttribute('src'); preview.srcObject = stream; preview.muted = true; preview.controls = false; if (stream) preview.play().catch(() => {}); }
    await window.DeskNaturalVoice?.ready;
    if(token!==speechToken)return false;
    if (!voiceAvailable) { voiceStatus.textContent = 'Spoken questions are unavailable in this browser. Read the question above and start your answer.'; return false; }
    const question = questions[current].q;
    reading = true; lock(true);
    document.getElementById('camStatus').textContent = 'Interviewer speaking';
    voiceStatus.textContent = 'Listen to the question. Your answer is not recording yet.';
    return new Promise(resolve => {
      let settled=false;
      const finish=success=>{
        if(settled)return;settled=true;clearTimeout(timeout);
        if(token!==speechToken){resolve(false);return}
        reading=false;lock(false);
        document.getElementById('camStatus').textContent=stream?(stream.getVideoTracks().length?'Camera ready':'Microphone ready'):'Camera off';
        if(success){spokenQuestion=question;hearButton.textContent='Repeat question';voiceStatus.textContent='Question finished. Click Start recording when you are ready; nothing is recording yet.';updateRecordLabel()}
        else voiceStatus.textContent='Voice could not play. Try again, or switch off “Read questions aloud” and answer the displayed question.';
        resolve(success);
      };
      const timeout=setTimeout(()=>{window.DeskNaturalVoice?.cancel();if(browserVoiceAvailable)window.speechSynthesis.cancel();finish(false)},45000);
      if(window.DeskNaturalVoice?.enabled&&assessment?.id){voiceStatus.textContent='Preparing interviewer audio…';window.DeskNaturalVoice.speak(question,assessment.id).then(finish);return}
      if(!browserVoiceAvailable){finish(false);return}
      const utterance=new SpeechSynthesisUtterance(question);utterance.lang='en-GB';utterance.rate=0.97;
      const voices=window.speechSynthesis.getVoices();const preferred=voices.find(v=>/^en-GB/i.test(v.lang)&&/natural|online|neural/i.test(v.name))||voices.find(v=>/^en/i.test(v.lang)&&/natural|online|neural/i.test(v.name))||voices.find(v=>/^en-GB/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));if(preferred)utterance.voice=preferred;
      utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);
      try{window.speechSynthesis.speak(utterance)}catch{finish(false)}
    });
  }

  function renderGuide() {
    const course = [profile.course, profile.university].filter(Boolean).join(' at ');
    const role = profile.targetSector || 'your target role';
    const guides = [
      {shape:'Where you are now → relevant evidence → why this role.', points:[course ? 'Briefly introduce your studies: ' + course + '.' : 'Briefly introduce your studies or current situation.', 'Choose one or two experiences that relate to ' + role + '.', 'Explain what you personally did and what you learned or achieved.', 'Finish with why this role is a sensible next step. Aim for 60–90 seconds.']},
      {shape:'Context → your contribution → finding or decision → outcome.', points:['Set the scene for the CV example in one sentence.', 'Be clear about your own work and separate it from the team’s contribution.', 'Explain your method, conclusion or decision, and why it mattered.', 'Give an outcome you can support. Use numbers only if they are true.']},
      {shape:'Situation → challenge → action → result → reflection.', points:['Choose one specific example that addresses the question.', 'Explain the difficulty and what responsibility you actually had.', 'Describe the action or decision you took, including any trade-off.', 'Explain the result and what you would repeat or change next time.']},
      {shape:'Explain it simply → show how it works → connect it to the role.', points:['Define the concept or development in plain English.', 'Explain the mechanism or what changed, rather than listing facts.', 'Give a practical example and explain who is affected.', 'Connect it to ' + role + '. Be honest about anything you are unsure of.']},
      {shape:'Why the work → why the firm → evidence that backs you up.', points:['Say which parts of the work interest you and explain why.', profile.targetFirm ? 'Use a specific, researched reason for choosing ' + profile.targetFirm + '.' : 'Use a specific, researched reason for choosing the firm.', 'Connect your motivation to one experience or action from your CV.', 'Close with the contribution you could bring. Avoid prestige-only answers.']}
    ];
    const guide = guides[current] || guides[0];
    document.getElementById('answerGuideShape').textContent = guide.shape;
    const list = document.getElementById('answerGuidePoints');
    list.replaceChildren(...guide.points.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    const cv = document.getElementById('cvText').value.trim();
    document.getElementById('answerGuideEvidence').textContent = cv ? 'A possible starting point from the text you supplied: “' + evidence(cv) + '”. Choose this only if it fits the question, and add the details of your actual contribution.' : 'Load your assessment or add your CV to identify a relevant example. You can still prepare using a genuine experience of your choice.';
  }
  const baseRender = render;
  render = function() {
    cancelVoice();
    if (isRecording()) stop();
    if (recordingUrl) { URL.revokeObjectURL(recordingUrl); recordingUrl = ''; }
    spokenQuestion = ''; hearButton.textContent = 'Hear question';
    baseRender(); renderGuide(); lock(false); updateRecordLabel();
    voiceStatus.textContent = voiceAvailable ? 'Click Hear question to listen, then Start recording when you are ready.' : 'Spoken questions are unavailable in this browser. The question is shown above.';
  };
  const baseStart = start;
  start = function() {
    cancelVoice();
    const video = document.getElementById('preview'); video.pause(); video.removeAttribute('src'); video.srcObject = stream; video.muted = true; video.controls = false;
    video.play().catch(() => {});
    speechFinal = ''; document.getElementById('transcript').value = '';
    try { baseStart(); lock(true); voiceStatus.textContent = 'Your answer is recording. The interviewer voice is off.'; }
    catch { lock(false); notice('Recording is unavailable in this browser. You can still type an answer below.'); }
  };
  const baseStop = stop;
  stop = function() { cancelVoice(); baseStop(); lock(false); voiceStatus.textContent = 'Stopped. Review your answer or try again.'; };
  hearButton.onclick = () => { if (!reading && !waiting) readQuestion(); };
  voiceToggle.onchange = () => { if (!voiceToggle.checked && reading) { stop(); } updateRecordLabel(); };
  document.getElementById('recordBtn').onclick = async () => {
    if (!stream || isRecording()) return;
    cancelVoice();
    waiting = false;
    start();
    updateRecordLabel();
  };
  document.getElementById('stopBtn').onclick = stop;
  const baseCamera = document.getElementById('cameraBtn').onclick;
  document.getElementById('cameraBtn').onclick = async () => { await baseCamera(); lock(false); };
  const baseNext = document.getElementById('nextBtn').onclick;
  document.getElementById('nextBtn').onclick = () => { const previous = current; baseNext(); if (current !== previous && voiceToggle.checked && voiceAvailable) readQuestion(); };
  if (!voiceAvailable) { voiceToggle.checked = false; voiceToggle.disabled = true; hearButton.disabled = true; }
  document.getElementById('cvText').addEventListener('input',renderGuide);
  window.addEventListener('pagehide',() => { cancelVoice(); if (isRecording()) baseStop(); if (stream) stream.getTracks().forEach(track => track.stop()); if (recordingUrl) URL.revokeObjectURL(recordingUrl); });
  renderGuide(); updateRecordLabel();
  if (!voiceAvailable) voiceStatus.textContent = 'Spoken questions are unavailable in this browser. Read the question above and start your answer.';
})();
