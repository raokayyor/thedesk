import test from 'node:test';
import assert from 'node:assert/strict';
import {strictAssessmentSchema} from '../lib/assessment-tool-schema.mjs';
import {WEAK_LINES_SCHEMA} from '../lib/weak-lines.mjs';

test('strict tool schema constrains severity without unsupported bounds',()=>{
 const original=structuredClone(WEAK_LINES_SCHEMA);
 original.items.properties.original.enum=['E1','E2'];
 const schema=strictAssessmentSchema(original);
 assert.deepEqual(schema.items.properties.severity.enum,[1,2,3]);
 assert.deepEqual(schema.items.required,['original','issue','severity']);
 assert.deepEqual(schema.items.properties.original.enum,['E1','E2']);
 assert.equal(schema.items.additionalProperties,false);
 assert.equal(schema.items.properties.issue.pattern,undefined);
 assert.match(schema.items.properties.issue.description,/Word limits/);
 assert.doesNotMatch(JSON.stringify(schema),/"(?:minimum|maximum|minItems|maxItems)":/);
 assert.equal(original.maxItems,8);
});
test('fixed array counts stay explicit and empty source enums cannot invalidate a request',()=>{
 const s=strictAssessmentSchema({type:'array',minItems:7,maxItems:7,items:{type:'string',enum:[]}});
 assert.equal(s.description,'Return exactly 7 items.');
 assert.equal(s.items.enum,undefined);
});
