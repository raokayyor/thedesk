import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../tracker.html',import.meta.url),'utf8');
const data=JSON.parse(fs.readFileSync(new URL('../data/firms-wave1.json',import.meta.url),'utf8'));
const marker=html.indexOf('// Wave 1'),start=html.indexOf('P=P.concat(',marker)+'P=P.concat('.length,end=html.indexOf(');',start);
assert.deepEqual(JSON.parse(html.slice(start,end)),data.rows,'visible rows and exported source data must agree');
assert.equal(data.rows.length,43);assert.equal(new Set(data.rows.map(r=>r.firm)).size,27);
assert.equal(new Set(data.rows.map(r=>r.firm+'|'+r.name)).size,43);
for(const row of data.rows){assert.equal(new URL(row.url).protocol,'https:');assert(['open','closed','unconfirmed','notyet'].includes(row.status));assert(['firm','listing','none'].includes(row.conf));for(const k of ['opens','closes','checked'])if(row[k])assert.equal(new Date(row[k]).toISOString().slice(0,10),row[k]);}
const nomura=data.rows.find(r=>r.firm==='Nomura');assert.equal(nomura.status,'unconfirmed');assert.equal(nomura.closes,null);assert.deepEqual(nomura.elig,[]);
assert.equal(data.rows.find(r=>r.firm==='PKF').checked,null);
assert(!html.includes("Checked 15 October 2026 against each firm's careers site"));
console.log('PASS tracker source integrity, 43 unique rows/27 firms, valid dates/links, conflicting and unchecked entries preserved');

