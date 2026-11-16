import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('public crib trial builds only its fixed example without requesting a saved CV or paid generation',()=>{
  const nodes=new Map();
  function element(id){
    if(!nodes.has(id)) nodes.set(id,{hidden:true,textContent:'',innerHTML:'',addEventListener(){},append(){},querySelector(){return element('foot');},cloneNode(){return {...this};},replaceWith(next){nodes.set(id,next);}});
    return nodes.get(id);
  }
  let requests=0;
  const context={URLSearchParams,Date,location:{search:'?trial=1&id=another-person&firm=barclays'},window:{print(){}},document:{getElementById:element,querySelector:element,createElement:element},fetch(){requests++;throw Error('A public example must not load private data');},DeskInterviewBank:{firmPacks:{jpm:{tests:['Teamwork']}},firms:{jpm:{label:'J.P. Morgan'}},resolveFirm:()=> 'jpm'}};
  vm.createContext(context);
  const html=readFileSync(new URL('../ac-crib.html',import.meta.url),'utf8');
  const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('function render(c, k)'));
  vm.runInContext(script,context);
  element('build').onclick();
  assert.equal(requests,0);
  assert.equal(element('firm').disabled,true);
  assert.equal(element('firm').value,'jpm');
  assert.equal(element('print').hidden,false);
  assert.match(element('sheet').innerHTML,/Jamie Patel/);
  assert.match(element('sheet').innerHTML,/J.P. Morgan/);
  assert.match(element('sheet').innerHTML,/does not state the outcome/);
  assert.doesNotMatch(element('sheet').innerHTML,/another-person|Barclays/);
});
