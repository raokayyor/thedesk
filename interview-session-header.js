// Compact interview identity; keep existing setup nodes and handlers intact.
(()=>{
const header=document.querySelector('.session-context');if(!header)return;
const left=document.createElement('div');left.className='session-identity';while(header.firstChild)left.append(header.firstChild);header.append(left);
const right=document.createElement('aside');right.className='session-practitioner';right.setAttribute('aria-label','Interview context and practitioner');header.append(right);
function draw(){
 const bank=window.DeskInterviewBank,firmKey=document.getElementById('firmSelect')?.value,role=document.getElementById('roleSelect')?.value;
 let setup;try{setup=JSON.parse(sessionStorage.getItem(window.DeskInterviewSession?.KEY||'desk-interview-setup-v1')||'null')}catch{}
 const format=setup?.format||'hirevue',kind=format==='technical'?'Technical interview':format==='hirevue'?'HireVue interview':'Regular interview';
 const firm=firmKey&&firmKey!=='general'?bank?.firms[firmKey]?.label:null;
 const person=['audit','tax','deals'].includes(role)?{name:'Chris Sharkey',area:'Accounting, audit & insurance practitioner',initials:'CS'}:role==='asset'?{name:'Peter Cheley',area:'Asset management practitioner',initials:'PC'}:{name:'Kayyor Rao',area:'Banking practitioner',photo:'/assets/kayyor-rao.jpg',initials:'KR'};
 right.replaceChildren();const context=document.createElement('div');context.className='session-context-tags';
 for(const text of [firm||'No firm chosen',kind]){const tag=document.createElement('span');tag.textContent=text;context.append(tag)}right.append(context);
 const row=document.createElement('div');row.className='session-practitioner-person';
 const avatar=person.photo?document.createElement('img'):document.createElement('span');if(person.photo){avatar.src=person.photo;avatar.alt=person.name}else{avatar.textContent=person.initials;avatar.setAttribute('aria-hidden','true')}avatar.className='session-practitioner-avatar';
 const detail=document.createElement('div'),name=document.createElement('strong'),area=document.createElement('div');name.textContent=person.name;area.textContent=person.area;detail.append(name,area);row.append(avatar,detail);right.append(row);
 const mode=header.querySelector('.session-mode-badge');if(mode&&format==='technical')mode.textContent=document.body.dataset.deskMode==='test'?'Mock interview · Technical questions':'Practice mode · Technical guidance';
}
const style=document.createElement('style');style.textContent='.session-context{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(280px,1fr)!important;align-items:center!important;gap:20px!important}.session-identity{min-width:0}.session-practitioner{padding:4px 0 4px 22px;border-left:1px solid #ddd7cf}.session-context-tags{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}.session-context-tags span{font-size:12px;font-weight:600;background:#edf3fa;color:#1d4e89;padding:5px 10px;border-radius:20px}.session-practitioner-person{display:flex;gap:11px;align-items:center;font-size:13px;line-height:1.5}.session-practitioner-person strong{font-size:14px}.session-practitioner-person div div{color:#64748b}.session-practitioner-avatar{width:42px;height:42px;flex:none;object-fit:cover;border-radius:50%;background:#dce6f2;display:grid;place-items:center;font-weight:700;color:#1d4e89}@media(max-width:650px){.session-context{grid-template-columns:1fr!important;gap:12px!important}.session-practitioner{border-left:0;border-top:1px solid #ddd7cf;padding:12px 0 0}}';document.head.append(style);
for(const id of ['firmSelect','roleSelect'])document.getElementById(id)?.addEventListener('change',draw);
for(const id of ['sessionRole','sessionEmployerRound']){const node=document.getElementById(id);if(node)new MutationObserver(draw).observe(node,{childList:true,characterData:true,subtree:true})}
document.addEventListener('desk:questionchange',draw);window.interviewProfileReady?.then(draw);draw();
})();
