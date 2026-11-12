import test from 'node:test';
import assert from 'node:assert/strict';
import {validPilotCode,PILOT_EXPIRES} from '../lib/pilot-access.mjs';
test('pilot code validates exact pass and expires',()=>{const now=Date.parse('2026-11-12');assert.equal(validPilotCode('newjob',now),true);assert.equal(validPilotCode('NEWJOB',now),false);assert.equal(validPilotCode('',now),false);assert.equal(validPilotCode(null,now),false);assert.equal(validPilotCode('newjob',Date.parse(PILOT_EXPIRES)),false);});
