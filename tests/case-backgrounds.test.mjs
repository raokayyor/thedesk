import test from 'node:test';import assert from 'node:assert/strict';
import {SCENARIOS,scenarioText} from '../lib/assessment-centre.mjs';
test('every case provides company, market and decision context to candidates and prompts',()=>{
 assert.equal(Object.keys(SCENARIOS).length,13);
 for(const scenario of Object.values(SCENARIOS))for(const field of ['company','market','pressure']){
  const text=scenario.background[field];assert(text.length>90,scenario.id+' '+field);assert(scenarioText(scenario).includes(text));
 }
});
