import test from 'node:test';import assert from 'node:assert/strict';import {closingSoonCount} from '../lib/home-deadlines.mjs';
test('counts distinct upcoming deadlines only, including the 30-day boundary',()=>{const p=(name,closes,status='open')=>({firm:'Bank',name,closes,status});assert.equal(closingSoonCount([p('Today','2026-11-18'),p('Today','2026-11-18'),p('Boundary','2026-12-18'),p('Late','2026-12-19'),p('Past','2026-11-17'),p('Closed','2026-11-20','closed'),p('Rolling',null)],new Date('2026-11-18T12:00:00Z')),2);assert.equal(closingSoonCount([],new Date('2026-11-18')),0);});

import {upcomingDeadlines} from '../lib/home-deadlines.mjs';
import {testimonialsForSlot,TESTIMONIALS} from '../data/testimonials.mjs';
test('nearest deadline is selected by date, not source order',()=>{const rows=upcomingDeadlines([{firm:'Later',name:'Graduate',closes:'2026-12-01'},{firm:'Next',name:'Internship',closes:'2026-11-20'}],new Date('2026-11-18'));assert.equal(rows[0].firm,'Next');});
test('new pricing quote replaces Cydney in pricing but retains her on the practitioner page',()=>{const added=[...TESTIMONIALS,{name:'New student',quote:'Approved quote',uni:'University',outcome:'Final round',slot:'pricing'}];assert.deepEqual(testimonialsForSlot('pricing',added).map(t=>t.name),['New student']);assert.ok(testimonialsForSlot('one-to-one',added).some(t=>t.name==='Cydney'));});
