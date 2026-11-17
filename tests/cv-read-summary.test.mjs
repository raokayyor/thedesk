import test from 'node:test';
import assert from 'node:assert/strict';
import {cvSummary} from '../lib/cv-read-summary.mjs';
test('CV receipt summary only lists explicit headings and counts actual bullets',()=>{const summary=cvSummary('Jamie Test\nWork experience\nCafe Nero — Barista\n- Opened shop\n- Trained colleagues\nLVMH valuation project\n- Compared peers');assert.deepEqual(summary.roles,['Cafe Nero — Barista']);assert.deepEqual(summary.projects,['LVMH valuation project']);assert.equal(summary.bulletCount,3)});
test('ambiguous prose does not fabricate roles or projects',()=>{const summary=cvSummary('Jamie Test\nUniversity of Bristol\nEconomics\nI worked part-time while studying.');assert.deepEqual(summary.roles,[]);assert.deepEqual(summary.projects,[]);assert.equal(summary.bulletCount,0)});

test('part-time team member headings are detected without treating prose as a role',()=>{const summary=cvSummary('Pho House — Part-time Team Member\n- Worked twelve hours alongside university.');assert.deepEqual(summary.roles,['Pho House — Part-time Team Member']);assert.equal(summary.bulletCount,1)});
