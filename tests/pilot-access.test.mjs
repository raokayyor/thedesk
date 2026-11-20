import test from 'node:test';
import assert from 'node:assert/strict';
import {validPilotCode,validAmeliaCode,PILOT_EXPIRES} from '../lib/pilot-access.mjs';
test('pilot code validates exact pass and expires',()=>{const now=Date.parse('2026-11-12');assert.equal(validPilotCode('newjob',now),true);assert.equal(validPilotCode('NEWJOB',now),false);assert.equal(validPilotCode('',now),false);assert.equal(validPilotCode(null,now),false);assert.equal(validPilotCode('newjob',Date.parse(PILOT_EXPIRES)),false);});

test('Amelia demo accepts the requested password without changing the general tester code',()=>{const now=Date.parse('2026-11-20');assert.equal(validAmeliaCode('rao123',now),true);assert.equal(validPilotCode('rao123',now),false);assert.equal(validAmeliaCode('wrong',now),false);assert.equal(validAmeliaCode('rao123',Date.parse(PILOT_EXPIRES)),false);});
