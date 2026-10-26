/* The Desk · free result page: three likely interview questions from the student's own CV (text only). */
(function () {
  var id = new URLSearchParams(location.search).get('id');
  if (!/^[a-f0-9]{48}$/.test(id || '')) return; // samples and demos: nothing to show
  var box = document.getElementById('ivTeaser'), list = document.getElementById('ivTeaserList');
  if (!box || !list) return;
  fetch('/api/interview-questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teaser: true, assessmentId: id }) })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.questions || !d.questions.length) return;
      if (d.firm) document.getElementById('ivTeaserTitle').textContent = 'Three practice questions for your ' + d.firm + ' preparation.';
      d.questions.forEach(function (q) {
        var li = document.createElement('li'); li.textContent = q.text;
        if (q.why) { var s = document.createElement('small'); s.textContent = q.why; li.appendChild(s); }
        list.appendChild(li);
      });
      box.hidden = false;
      try { window.deskTrack && window.deskTrack('click', { id: 'teaser_shown' }); } catch (e) { }
    }).catch(function () { });
})();
