import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {questionsForRoute} from '../lib/question-banks.mjs';
const html=readFileSync(new URL('../assessment.html',import.meta.url),'utf8');
const rendering=html.slice(html.indexOf('function renderQuestionTable('),html.indexOf('const labels='));
test('the assessment preserves the table and all answer choices from the approved bank',()=>{const root={},scope={document:{getElementById:()=>root}};vm.runInNewContext(rendering,scope);const q=questionsForRoute('General Finance').numerical.find(q=>q.id==='N0501');scope.renderSet('quiz',[[q.question,q.options,q.answer,q.table]],'n');assert.match(root.innerHTML,/<table/);assert.match(root.innerHTML,/Revenue by region/);for(const value of ['Europe','160','450',...q.options].filter(x=>x!=='450'))assert.ok(root.innerHTML.includes(value));assert.equal((root.innerHTML.match(/type="radio"/g)||[]).length,4);assert.match(html,/q\.answer,q\.table/);});
test('table values are escaped and tables are optional for ordinary questions',()=>{const scope={};vm.runInNewContext(rendering,scope);assert.equal(scope.renderQuestionTable(undefined),'');const markup=scope.renderQuestionTable({title:'<img onerror=alert(1)>',columns:['A','B'],rows:[['<script>',10]]});assert.doesNotMatch(markup,/<img|<script>/);assert.match(markup,/&lt;script&gt;/);assert.match(markup,/scope="row"/);});
