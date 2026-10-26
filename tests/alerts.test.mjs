import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseTracker, firmList, inferType } from '../lib/programmes.mjs';
import { buildDigest, digestEmail, typeFromProgramme, matchFirm } from '../lib/alerts-core.mjs';

// The tracker's own data is readable on the server.
const data = parseTracker(fs.readFileSync(new URL('../tracker.html', import.meta.url), 'utf8'));
assert(data.programmes.length >= 50 && data.checked, 'tracker programmes parsed');
assert(data.programmes.every(p => p.firm && p.name && p.type && p.id));
assert(firmList(data).some(g => g.firms.includes('Barclays')));
assert.equal(inferType({ name: 'Spring Insight Week' }), 'Spring week');
assert.equal(typeFromProgramme('Graduate programme')[0], 'Graduate');
assert.equal(matchFirm('barclays', ['Barclays', 'HSBC']), 'Barclays');

// Digest sections from a fixed set of programmes.
const P = (firm, status, opens, closes, extra = {}) => ({ id: firm + opens + closes, firm, name: firm + ' Programme', type: 'Graduate', status, opens, closes, rolling: false, url: 'https://example.com', ...extra });
const today = new Date('2026-10-26T00:00:00Z');
const fake = { checked: '2026-10-20', programmes: [
  P('Barclays', 'open', '2026-09-01', '2026-10-31'), P('Barclays', 'open', '2026-10-23', null, { rolling: true, name: 'Barclays New' }),
  P('HSBC', 'notyet', '2026-11-05', null), P('UBS', 'open', '2026-09-01', '2026-11-03'), P('Citi', 'closed', '2026-08-01', '2026-10-01') ] };
const d = buildDigest({ firms: ['Barclays', 'HSBC'], types: [] }, fake, { today, since: '2026-10-19T07:00:00Z' });
assert.deepEqual(d.sections.map(s => s[0]), ['Closing in the next two weeks', 'Newly opened', 'Opening soon']);
assert(/1 deadline/.test(d.subject) && d.count === 3);
assert(!d.sections.flatMap(s => s[1]).some(p => p.firm === 'UBS'), 'only chosen firms');
// Nothing for their firms → market-wide closing list, so an email is never empty.
const m = buildDigest({ firms: ['Citi'], types: [] }, fake, { today });
assert.equal(m.sections[0][0], 'Closing soon across the market');
const e = digestEmail(d, fake, { origin: 'https://thedesk.test', unsubscribeUrl: 'https://thedesk.test/unsubscribe.html?u=x', firms: ['Barclays', 'HSBC'] });
assert(e.html.includes('Unsubscribe') && e.text.includes('closes 31 Oct (5 days)') && e.html.includes('last checked 2026-10-20'));
console.log('Alerts checks passed: tracker parsing, digest sections, fallback, email content.');

// Future opening dates must not be described as newly opened, even if tracker status is stale.
const future = buildDigest({firms:['HSBC'],types:[]},{programmes:[P('HSBC','open','2026-11-10',null)]},{today,since:'2026-10-19T07:00:00Z'});
assert(!future.sections.some(s=>s[0]==='Newly opened'));
// Rolling programmes alone are a useful match, not a reason to send unrelated market dates.
const roll = buildDigest({firms:['HSBC'],types:[]},{programmes:[P('HSBC','open','2026-09-01',null,{rolling:true}),P('UBS','open','2026-09-01','2026-10-31')]},{today});
assert.equal(roll.count,1);assert.equal(roll.sections.length,1);assert.equal(roll.subject,'Open programmes at your chosen firms');
const none = buildDigest({firms:['Missing firm'],types:[]},{programmes:[]},{today});assert.equal(none.empty,true);
const escaped = digestEmail(buildDigest({firms:[],types:[]},{programmes:[P('<script>','open','2026-09-01','2026-10-31',{name:'<img onerror=x>'})]},{today}),{checked:'2026-10-20'},{origin:'https://thedesk.test',unsubscribeUrl:'https://thedesk.test/unsubscribe',firms:[]});
assert(!escaped.html.includes('<img onerror'));assert(escaped.html.includes('&lt;img'));
console.log('Additional checks passed: future dates, rolling-only matches, empty weeks and escaped email content.');
