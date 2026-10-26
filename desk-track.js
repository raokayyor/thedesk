/* The Desk · anonymous usage tracking.
   No cookies, no device storage, no CV text, answers or recordings. Honours Global Privacy Control.
   Pages call window.deskTrack('event_name', { ...whitelisted props }). The server drops anything not whitelisted. */
(function () {
  if (window.deskTrack) return;
  var off = navigator.globalPrivacyControl === true || location.protocol === 'file:' ||
    (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !/[?&]track=1\b/.test(location.search));
  var rnd = function () { try { return crypto.randomUUID().replace(/-/g, '').slice(0, 24); } catch (e) { return (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 24); } };
  var session = rnd();
  var params = new URLSearchParams(location.search);
  var aid = /^[a-f0-9]{48}$/.test(params.get('id') || '') ? params.get('id') : '';
  var q = [], timer = null;
  function flush() {
    if (!q.length) return;
    var body = JSON.stringify({ session: session, page: location.pathname, aid: aid, touch: navigator.maxTouchPoints > 1, events: q.splice(0, 20) });
    try { fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, credentials: 'omit' }).catch(function () { }); } catch (e) { }
    if (q.length) flush();
  }
  window.deskTrack = function (e, p) {
    if (off) return;
    q.push({ e: String(e), p: p || {} });
    clearTimeout(timer);
    if (q.length >= 10) flush(); else timer = setTimeout(flush, 2500);
  };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
  // Page view, with where they came from (host only) and campaign tags.
  var ref = ''; try { var r = new URL(document.referrer); if (r.host !== location.host) ref = r.hostname; } catch (e) { }
  window.deskTrack('page_view', { ref: ref, utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '' });
  // Clicks on buttons and links that have an id or a data-track name. Never their text.
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-track],a[id],button[id]') : null;
    if (!el) return;
    var id = el.getAttribute('data-track') || el.id;
    if (/^[A-Za-z][\w-]{0,39}$/.test(id)) window.deskTrack('click', { id: id });
  }, true);
  // Script errors, so we see failures nobody reports.
  window.addEventListener('error', function (e) { if (e && e.message) window.deskTrack('error', { where: 'script_error' }); });
  window.addEventListener('unhandledrejection', function (e) { var m = e && e.reason && (e.reason.message || String(e.reason)); if (m) window.deskTrack('error', { where: 'promise_error' }); });
})();
