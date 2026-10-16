import {renderFullFirmGuide} from '/firm-guide-full.mjs';
import {FIRM_GUIDES} from '/data/firm-guides.mjs';
import {BANK_LOGOS} from '/data/bank-logos.mjs';
const q=new URLSearchParams(location.search),id=/^[a-f0-9]{48}$/.test(q.get('id')||'')?q.get('id'):'',sample=q.get('dashboard')==='sample';
const context=id?'?id='+encodeURIComponent(id):sample?'?dashboard=sample':'';
const dashboard=(sample?'/fullcycle-report-v3-test.html':id?'/fullcycle.html?id='+encodeURIComponent(id):'/assessment-start.html')+(id||sample?'#prep':'');
const index=[{name:'Deutsche Bank',slug:'deutsche-bank',category:'Banking'},...FIRM_GUIDES];
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const anchor=(text,href,cls)=>{const a=el('a',text,cls);a.href=href;if(/^https:\/\//.test(href)){a.target='_blank';a.rel='noopener noreferrer';}return a;};
function addFirm(name,status){if(!id&&!sample){location.href='/assessment-start.html';return;}try{const key='desk-prep-'+(sample?'sample':id);let values=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(values))values=[];values=Array.from(new Set([...values,name])).filter(n=>index.some(f=>f.name===n));localStorage.setItem(key,JSON.stringify(values));status.textContent=name+' prep added to your dashboard.';}catch{status.textContent='Your browser could not save this firm. Please allow local storage and retry.';}}
document.querySelectorAll('[data-guide-hub]').forEach(a=>a.href='/graduate-programmes.html'+context);
document.querySelectorAll('[data-dashboard]').forEach(a=>{a.href=dashboard;a.textContent=id||sample?'My dashboard →':'Start an assessment →';});
const root=document.getElementById('guideHub');
if(root){
 if(id||sample){const box=el('section',null,'guide-add');box.id='add-firm';box.append(el('div','Your dashboard','kicker'),el('h2','Add a firm to your prep'),el('p','Only the firms you add appear in Prep. Saving a guide does not run AI or purchase anything.'));
 const select=el('select');select.setAttribute('aria-label','Choose firm');for(const f of index){const o=el('option',f.name);o.value=f.name;select.append(o);}const btn=el('button','Add to my dashboard','btn'),status=el('p');status.setAttribute('role','status');btn.onclick=()=>addFirm(select.value,status);box.append(select,btn,status,anchor('Back to my dashboard →',dashboard));root.append(box);}
 for(const category of ['Banking','Accounting & professional services','Insurance','Asset management']){root.append(el('h2',category,'hub-category'));const grid=el('div',null,'bank-grid');for(const f of index.filter(f=>f.category===category)){const tile=anchor('', '/'+f.slug+'.html'+context,'bank-tile unlocked');if(BANK_LOGOS[f.name]){const img=el('img');img.src=BANK_LOGOS[f.name];img.alt=f.name;tile.append(img);}else tile.append(el('span',f.name.split(/[\s\/&]+/).filter(Boolean).map(w=>w[0]).join('').slice(0,3).toUpperCase(),'firm-initial'));tile.append(el('h3',f.name),el('span','Explore guide →','tile-status'));grid.append(tile);}root.append(grid);}
}else{
 await renderFullFirmGuide({id,sample,context,dashboard,el,anchor,addFirm});
}

