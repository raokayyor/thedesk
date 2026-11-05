// The Desk · the programme list (deadlines) read straight from tracker.html, so alerts always match the tracker.
// tracker.html builds its data with plain `var` statements between `var CHECKED=` and `var londonParts`;
// that block is run in an isolated sandbox (no DOM, no network) and the result normalised.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

export const TYPES = ['Spring week', 'Summer internship', 'Off-cycle internship', 'Graduate', 'Placement'];
export const SECTOR_LABELS = { bb: 'Global investment banks', ib: 'Advisory boutiques and other banks', uk: 'UK banks', big4: 'Big Four', acc: 'Accountancy firms', ins: 'Insurance' };
export function inferType(p) {
  if (p.type && TYPES.includes(p.type)) return p.type;
  const n = String(p.name || '').toLowerCase();
  if (/spring|insight|discovery/.test(n)) return 'Spring week';
  if (/off-cycle|off cycle/.test(n)) return 'Off-cycle internship';
  if (/placement|industrial/.test(n)) return 'Placement';
  if (/intern|summer/.test(n)) return 'Summer internship';
  return 'Graduate';
}
export function parseTracker(html) {
  const a = html.indexOf('var CHECKED='), b = html.indexOf('var londonParts');
  if (a < 0 || b < a) throw new Error('Tracker data not found');
  const ctx = vm.createContext({});
  vm.runInContext(html.slice(a, b), ctx, { timeout: 1000 });
  const rows = Array.isArray(ctx.P) ? ctx.P : [];
  return {
    checked: typeof ctx.CHECKED === 'string' ? ctx.CHECKED : null,
    programmes: rows.filter(p => p && p.firm && p.name).map(p => ({
      id: createHash('sha256').update(p.firm + '|' + p.name).digest('hex').slice(0, 16),
      sector: p.sector || '', firm: String(p.firm), name: String(p.name), area: p.area || '', type: inferType(p),
      status: p.status || 'unconfirmed', opens: p.opens || null, closes: p.closes || null, rolling: p.rolling === true,
      entry: p.entry || '', url: /^https:\/\//.test(p.url || '') ? p.url : null
    }))
  };
}
let cache = null;
export async function loadProgrammes() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.data;
  const html = await readFile(new URL('../tracker.html', import.meta.url), 'utf8');
  cache = { at: Date.now(), data: parseTracker(html) };
  return cache.data;
}
export function firmList(data) {
  const by = {};
  for (const p of data.programmes) { (by[p.sector] ||= new Set()).add(p.firm); }
  return Object.entries(by).map(([sector, set]) => ({ sector, label: SECTOR_LABELS[sector] || sector, firms: [...set].sort() }));
}
