// The Desk · deadline alerts, pure helpers (no database), so they can be unit-tested.
import { emailLayout, escHtml as esc } from './email.mjs';

export const CONSENT_VERSION = 'deadline-alerts-v1';
const DAY = 86400000;
const londonDay = (d = new Date()) => new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) + 'T00:00:00Z');
const daysUntil = (iso, today) => iso ? Math.round((new Date(iso + 'T00:00:00Z') - today) / DAY) : null;
const fmt = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function typeFromProgramme(programmeType) {
  const t = String(programmeType || '').toLowerCase();
  if (/spring|insight/.test(t)) return ['Spring week'];
  if (/off-cycle/.test(t)) return ['Off-cycle internship'];
  if (/intern/.test(t)) return ['Summer internship'];
  if (/placement/.test(t)) return ['Placement'];
  if (/graduate/.test(t)) return ['Graduate'];
  return [];
}
export function matchFirm(name, allFirms) {
  const n = String(name || '').trim().toLowerCase(); if (!n) return null;
  return allFirms.find(f => f.toLowerCase() === n) || allFirms.find(f => f.toLowerCase().startsWith(n) || n.startsWith(f.toLowerCase())) || null;
}

// What one student's email contains this week. Never empty: falls back to the market-wide closing list.
export function buildDigest(prefs, data, { today = londonDay(), since = null } = {}) {
  const firms = prefs.firms || [], types = prefs.types || [];
  const mine = data.programmes.filter(p => (!firms.length || firms.includes(p.firm)) && (!types.length || types.includes(p.type)));
  const sinceDay = since ? londonDay(new Date(since)) : new Date(today - 7 * DAY);
  const closing = mine.filter(p => p.status === 'open' && p.closes && daysUntil(p.closes, today) >= 0 && daysUntil(p.closes, today) <= 14).sort((a, b) => a.closes.localeCompare(b.closes));
  const opened = mine.filter(p => p.status === 'open' && p.opens && new Date(p.opens + 'T00:00:00Z') > sinceDay && new Date(p.opens + 'T00:00:00Z') <= today && !closing.includes(p));
  const soon = mine.filter(p => p.status === 'notyet' && p.opens && daysUntil(p.opens, today) >= 0 && daysUntil(p.opens, today) <= 21);
  const rolling = firms.length ? mine.filter(p => p.status === 'open' && p.rolling && !p.closes && !opened.includes(p)).slice(0, 6) : [];
  let market = [];
  if (!closing.length && !opened.length && !soon.length && !rolling.length) market = data.programmes.filter(p => p.status === 'open' && p.closes && daysUntil(p.closes, today) >= 0 && daysUntil(p.closes, today) <= 14 && (!types.length || types.includes(p.type))).sort((a, b) => a.closes.localeCompare(b.closes)).slice(0, 6);
  const sections = [
    ['Closing in the next two weeks', closing, p => { const n = daysUntil(p.closes, today); return `closes ${fmt(p.closes)} (${n === 0 ? 'today' : n === 1 ? 'tomorrow' : n + ' days'})`; }],
    ['Newly opened', opened, p => `opened ${fmt(p.opens)}${p.rolling ? ' · reviewed as applications arrive, so apply early' : ''}`],
    ['Opening soon', soon, p => `expected to open ${fmt(p.opens)}`],
    ['Open now, reviewed as applications arrive', rolling, () => 'no fixed closing date: apply early'],
    ['Closing soon across the market', market, p => `closes ${fmt(p.closes)}`]
  ].filter(s => s[1].length);
  const count = closing.length + opened.length + soon.length + rolling.length;
  return { sections, count, empty: !sections.length, subject: closing.length ? `${closing.length} deadline${closing.length > 1 ? 's' : ''} in the next two weeks${firms.length === 1 ? ' at ' + firms[0] : ''}` : opened.length ? `${opened.length} new programme${opened.length > 1 ? 's' : ''} opened for you` : soon.length ? 'Programmes opening soon for you' : rolling.length ? 'Open programmes at your chosen firms' : 'This week’s deadlines across the market' };
}
export function digestEmail(digest, data, { origin, unsubscribeUrl, firms = [] }) {
  const rows = digest.sections.map(([title, items, line]) => `<h3 style="font-family:Georgia,serif;font-weight:500;font-size:19px;margin:18px 0 6px">${esc(title)}</h3>` +
    items.map(p => `<div style="padding:8px 0;border-bottom:1px solid #e3ddd3"><b>${esc(p.firm)}</b> · ${p.url ? `<a href="${esc(p.url)}" style="color:#a8360a">${esc(p.name)}</a>` : esc(p.name)}<br><span style="color:#3d4954;font-size:14px">${esc(p.type)} · ${esc(line(p))}</span></div>`).join('')).join('');
  const html = emailLayout(`<p style="margin:0">Your deadline alerts for ${firms.length ? esc(firms.slice(0, 5).join(', ')) + (firms.length > 5 ? ` and ${firms.length - 5} more` : '') : 'the firms on The Desk tracker'}.</p>${rows}
    <p style="margin:18px 0 0"><a href="${origin}/tracker.html" style="color:#a8360a;font-weight:700">See the full tracker</a> · <a href="${origin}/my.html#alerts" style="color:#a8360a">Change your firms</a></p>
    <p style="color:#6b7682;font-size:13px;margin:14px 0 0">Dates are checked on the firms’ own sites (last checked ${esc(data.checked || 'recently')}). Firms change dates and close early, so always confirm on the firm’s site before applying.</p>`,
    `You’re getting this because you asked for weekly deadline alerts from The Desk. <a href="${unsubscribeUrl}" style="color:#6b7682">Unsubscribe</a> · <a href="${origin}/privacy.html" style="color:#6b7682">Privacy</a>`);
  const text = 'Your deadline alerts from The Desk\n\n' + digest.sections.map(([title, items, line]) => title + '\n' + items.map(p => `- ${p.firm}: ${p.name} (${p.type}, ${line(p)})${p.url ? ' ' + p.url : ''}`).join('\n')).join('\n\n') +
    `\n\nDates are checked on the firms' own sites (last checked ${data.checked || 'recently'}). Always confirm on the firm's site.\n\nChange your firms: ${origin}/my.html#alerts\nUnsubscribe: ${unsubscribeUrl}`;
  return { html, text };
}

export function validateAlertPrefs(body,allFirms,allTypes){
 if(typeof body.enabled!=='boolean'||!Array.isArray(body.firms)||!Array.isArray(body.types)||body.firms.length>60||body.types.length>allTypes.length||body.firms.some(f=>typeof f!=='string'||!allFirms.includes(f))||body.types.some(t=>typeof t!=='string'||!allTypes.includes(t)))throw new Error('Invalid alert preferences');
 return {enabled:body.enabled,firms:[...new Set(body.firms)],types:[...new Set(body.types)]};
}
