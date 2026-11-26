import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('review goals can be selected together, deselected independently and restored',()=>{
 const source=readFileSync(new URL('../assessment-submit.js',import.meta.url),'utf8').split("for(const button of document.querySelectorAll('.preparation-option'))")[1];
 const handlers={},field={value:'',addEventListener(type,fn){handlers[type]=fn},dispatchEvent(e){handlers[e.type]?.()}},buttons=['applications','tests','interviews'].map(goal=>({dataset:{goal},attrs:{},addEventListener(type,fn){this[type]=fn},setAttribute(key,value){this.attrs[key]=value}}));
 vm.runInNewContext("for(const button of document.querySelectorAll('.preparation-option'))"+source,{document:{getElementById:()=>field,querySelectorAll:()=>buttons},Event});
 buttons[0].click();buttons[1].click();assert.equal(field.value,'applications,tests');assert.equal(buttons[0].attrs['aria-pressed'],'true');assert.equal(buttons[1].attrs['aria-pressed'],'true');buttons[0].click();assert.equal(field.value,'tests');assert.equal(buttons[0].attrs['aria-pressed'],'false');field.value='applications,interviews';field.dispatchEvent(new Event('change'));assert.equal(buttons[0].attrs['aria-pressed'],'true');assert.equal(buttons[2].attrs['aria-pressed'],'true');
});
