// The Desk · usage analytics, pure helpers (no dependencies, so they can be unit-tested).
// Principles: no cookies or device storage, no CV text, answers, transcripts, recordings, names or emails.
// Only event names, a few whitelisted choices and counts, and coarse device type.
import { FIRMS, DIVISIONS, MODES, QUESTION_TYPES } from '../interview-practice-core.mjs';

const S = max => ({ t: 's', max });
const N = (min, max) => ({ t: 'n', min, max });
const B = { t: 'b' };
const E = (...v) => ({ t: 'e', v });
const QT = E(...QUESTION_TYPES);
const FIRM = { t: 'firm' }, DIV = { t: 'div' };

// Every event the site may send, and the only properties each may carry.
export const EVENTS = {
  page_view:    { ref: { t: 'host' }, utm_source: {t:'id'}, utm_medium: {t:'id'}, utm_campaign: {t:'id'} },
  click:        { id: { t: 'id' } },
  error:        { where: {t:'id'} },
  result_gate:  { action: E('shown', 'submitted'), alerts: B },
  ip_view:      { sample: B },
  ip_check:     { cam: E('ok', 'bad', 'off'), mic: E('ok', 'bad'), words: B, sr: B, secs: N(0, 120) },
  ip_type_only: {},
  ip_start:     { mode: E(...Object.keys(MODES)), firm: FIRM, division: DIV, guide: B, pushback: B, typed: B, voice: B, sample: B },
  ip_answer:    { qtype: QT, followup: B, typed: B, transcribed: B, words: N(0, 3000), seconds: N(0, 900), timedOut: B },
  ip_stt:       { ok: B },
  ip_followup:  { qtype: QT, source: E('rules', 'model') },
  ip_feedback:  { qtype: QT, kind: E('full', 'quick'), overall: N(0, 5), followup: B },
  ip_retry:     { qtype: QT },
  ip_complete:  { answered: N(0, 10), avg: N(0, 5) },
  ip_cta:       { target: E('mentor', 'fullcycle', 'call') },
  call_click:   { where: E('interview', 'my', 'answers', 'drill', 'report') }
};

const scrub = s => String(s == null ? '' : s)
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')   // never keep an email address
  .replace(/\d{6,}/g, '#')                          // or long numbers (phones, ids)
  .replace(/\s+/g, ' ').trim();
const firmNames = Object.keys(FIRMS).map(k => k.toLowerCase());
const divNames = DIVISIONS.map(d => d.toLowerCase());

export function cleanProps(event, props) {
  const spec = EVENTS[event]; if (!spec) return null;
  const out = {}; props = props && typeof props === 'object' ? props : {};
  for (const [k, rule] of Object.entries(spec)) {
    const v = props[k]; if (v === undefined || v === null || v === '') continue;
    if (rule.t === 'b') out[k] = v === true;
    else if (rule.t === 'n') { const n = Number(v); if (Number.isFinite(n)) out[k] = Math.round(Math.max(rule.min, Math.min(rule.max, n)) * 10) / 10; }
    else if (rule.t === 'e') { if (rule.v.includes(v)) out[k] = v; }
    else if (rule.t === 's') { const s = scrub(v).slice(0, rule.max); if (s) out[k] = s; }
    else if (rule.t === 'host') { const s = String(v).toLowerCase(); if (/^[a-z0-9.-]{1,80}$/.test(s)) out[k] = s.replace(/^www\./, ''); }
    else if (rule.t === 'id') { const s = String(v); if (/^[A-Za-z][\w-]{0,39}$/.test(s)) out[k] = s; }
    else if (rule.t === 'firm') { const i = firmNames.indexOf(String(v).toLowerCase()); out[k] = i >= 0 ? Object.keys(FIRMS)[i] : 'other'; }   // typed firm names are never stored
    else if (rule.t === 'div') { const i = divNames.indexOf(String(v).toLowerCase()); out[k] = i >= 0 ? DIVISIONS[i] : 'other'; }
  }
  return out;
}

export function cleanPage(p) { const s = String(p || ''); return /^\/[\w\-./]{0,79}$/.test(s) ? s : '/other'; }
export const isBot = ua => !ua || /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|preview|curl|wget|python|node-fetch|axios/i.test(ua);

// Coarse device only. "In-app" matters: camera and mic often fail inside Instagram/LinkedIn browsers.
export function parseAgent(ua, touch) {
  ua = String(ua || '');
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch === true);
  const os = ios ? 'iOS' : /Android/.test(ua) ? 'Android' : /CrOS/.test(ua) ? 'ChromeOS' : /Windows/.test(ua) ? 'Windows' : /Macintosh|Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const device = /iPad|Tablet/.test(ua) || (/Macintosh/.test(ua) && touch === true) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet' : /Mobi|iPhone|iPod|Android/.test(ua) ? 'phone' : 'desktop';
  const browser = /FBAN|FBAV|Instagram|LinkedInApp|Snapchat|TikTok|Line\//.test(ua) ? 'In-app' : /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung' : /CriOS/.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  return { device, os, browser };
}

// Validates a batch from the browser. Returns clean rows (without visitor/device, added by the server).
export function cleanBatch(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.events)) return [];
  const session = /^[a-z0-9]{8,32}$/i.test(body.session || '') ? String(body.session).toLowerCase() : null;
  if (!session) return [];
  const page = cleanPage(body.page);
  return body.events.slice(0, 20).map(x => {
    const event = x && typeof x.e === 'string' ? x.e : '';
    const props = cleanProps(event, x && x.p);
    return props ? { session, page, event, props } : null;
  }).filter(Boolean);
}
