import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../lib/tool-links.mjs';import '../member-dashboard-core.js';
import '../desk-navigation-core.js';
test('the grouped member sidebar is the only desktop sidebar for either tier',()=>{
 const nav=readFileSync(new URL('../desk-nav.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../desk-navigation.css',import.meta.url),'utf8');
 const home=readFileSync(new URL('../my.html',import.meta.url),'utf8');
 assert.doesNotMatch(nav,/desk-laptop-menu|data-member-preview|tier-tag/);
 assert.doesNotMatch(css,/desk-laptop-menu/);
 assert.doesNotMatch(home,/body\.member-dashboard \.desk-nav\{display:none/);
 for(const title of ['Interview coach','Numerical & commercial tests','Assessment centre hub','Crib sheet','Story bank'])assert.ok(globalThis.DeskNavigationCore.groups.flatMap(g=>g.items).some(i=>i[1]===title));
});
test('the same sidebar sends free accounts to a trial and members to the full interview',()=>{
 const core=globalThis.DeskNavigationCore;
 assert.equal(core.href('interview',{signedIn:true,member:false}),'/interview.html?trial=1');
 assert.equal(core.href('interview',{signedIn:true,member:true}),'/interview-start.html');
 assert.equal(core.href('crib',{signedIn:true,member:false}),'/ac-crib.html?trial=1');
 assert.equal(core.href('crib',{signedIn:true,member:true}),'/ac-crib.html');
});
