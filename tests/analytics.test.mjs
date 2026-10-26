import assert from 'node:assert/strict';
import { cleanProps, cleanBatch, parseAgent, isBot, cleanPage, EVENTS } from '../lib/analytics-core.mjs';

// Only whitelisted events and properties survive.
assert.equal(cleanProps('made_up_event', { a: 1 }), null);
assert.deepEqual(cleanProps('ip_start', { mode: 'first', firm: 'goldman sachs', division: 'Investment Banking', guide: true, transcript: 'secret answer', cv: 'x' }), { mode: 'first', firm: 'Goldman Sachs', division: 'Investment Banking', guide: true });
// Typed firm names are never stored.
assert.equal(cleanProps('ip_start', { firm: 'Jane Smith Capital' }).firm, 'other');
assert.equal(cleanProps('ip_start', { mode: 'hacked' }).mode, undefined);
// Error text loses emails and long numbers.
assert.deepEqual(cleanProps('error', { msg: 'Failed for amelia@bristol.ac.uk on 07700900123' }), {});
// Numbers are clamped, strings cut.
assert.equal(cleanProps('ip_answer', { words: 999999, seconds: -4 }).words, 3000);
assert.equal(cleanProps('ip_answer', { seconds: -4 }).seconds, 0);
assert.equal(cleanProps('page_view', { ref: 'WWW.Reddit.com' }).ref, 'reddit.com');
assert.equal(cleanProps('page_view', { ref: 'javascript:alert(1)' }).ref, undefined);
assert.equal(cleanProps('click', { id: '<img onerror>' }).id, undefined);
assert.equal(cleanPage('/interview-practice.html'), '/interview-practice.html');
assert.equal(cleanPage('https://evil.com/x'), '/other');
// Batches: need a session, max 20 events, bad events dropped.
assert.deepEqual(cleanBatch({ events: [{ e: 'ip_view', p: {} }] }), []);
const many = cleanBatch({ session: 'abc123def456', page: '/x', events: Array.from({ length: 50 }, () => ({ e: 'ip_view', p: { sample: true } })).concat([{ e: 'nope' }]) });
assert.equal(many.length, 20);
// Device parsing.
assert.deepEqual(parseAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'), { device: 'phone', os: 'iOS', browser: 'Safari' });
assert.deepEqual(parseAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', true), { device: 'tablet', os: 'iOS', browser: 'Safari' });
assert.deepEqual(parseAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'), { device: 'phone', os: 'Android', browser: 'Chrome' });
assert.equal(parseAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0').browser, 'In-app');
assert.equal(parseAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0').browser, 'Edge');
assert(isBot('Googlebot/2.1') && isBot('') && !isBot('Mozilla/5.0 (Windows NT 10.0) Chrome/129'));
for (const [k, spec] of Object.entries(EVENTS)) assert(!('transcript' in spec) && !('cv' in spec) && !('email' in spec), k + ' must not carry personal content');
console.log('Analytics checks passed: whitelist, scrubbing, batches, device parsing.');
