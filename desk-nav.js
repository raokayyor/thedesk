// Shared grouped navigation; access stays enforced by the existing APIs.
(function(){
 if(window.DeskNavigation)return;
 const core=document.createElement('script');core.src='/desk-navigation-core.js';core.onload=boot;document.head.append(core);
 const css=document.createElement('link');css.rel='stylesheet';css.href='/desk-navigation.css';document.head.append(css);
 let data={},root,account;
 window.DeskNavigation={update(d){data=d||{};if(root)draw();},get data(){return data}};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const paths={desk:'<path d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5M10 20v-5h4v5"/>',prac:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',apps:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12.5h18"/>',comm:'<circle cx="9" cy="8" r="3"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="18" cy="9" r="2.5"/><path d="M16 15c3 0 4 2 5 5"/>',more:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',cam:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',group:'<circle cx="12" cy="7" r="3"/><circle cx="5" cy="15" r="2.5"/><circle cx="19" cy="15" r="2.5"/><path d="M8 20c1-3 2-4 4-4s3 1 4 4"/>',case:'<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"/>',sheet:'<path d="M7 3h10v18H7zM10 7h4M10 11h4M10 15h2"/>'};
 function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[id]+'</svg>';}
 function boot(){
  document.body.classList.add('desk-shell');
  const fonts=document.createElement('link');fonts.rel='stylesheet';fonts.href='https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=Figtree:wght@400;500;600;700&display=swap';document.head.append(fonts);
  root=document.createElement('nav');root.className='desk-nav desk-group-nav';root.setAttribute('aria-label','Your Desk');document.body.append(root);
  account=document.createElement('a');account.href='/desk-section.html?view=account';account.className='desk-account-avatar';
  const header=document.querySelector('body>header,header.top,.page>header');if(header){header.classList.add('desk-shell-header');(header.querySelector('.hin')||header).append(account);}
  draw();
  const tour=new URLSearchParams(location.search).get('preview')==='empty'||new URLSearchParams(location.search).has('tour');
  if(!tour)fetch('/api/desk-home',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}).then(r=>r.ok?r.json():null).then(d=>{if(d){data=d;draw();document.dispatchEvent(new CustomEvent('desk:navigationready',{detail:d}));}}).catch(()=>{});
  let focused=false;
  function syncVisibility(){
   const visible=id=>{const el=document.getElementById(id);return el&&!el.hidden&&getComputedStyle(el).display!=='none'};
   const path=location.pathname,live=path==='/group-exercise.html'&&(visible('room')||visible('assessmentLoading'))||path==='/case-study.html'&&(visible('s-write')||visible('s-present')||visible('s-qs'))||path==='/inbox-exercise.html'&&visible('s-work');
   const hide=focused||!!live;if(document.body.classList.contains('desk-nav-away')!==hide)document.body.classList.toggle('desk-nav-away',hide);
  }
  document.addEventListener('focusin',e=>{focused=e.target.matches('input,textarea,select,[contenteditable="true"]');syncVisibility();});document.addEventListener('focusout',()=>{focused=false;setTimeout(syncVisibility,0)});
  new MutationObserver(syncVisibility).observe(document.body,{attributes:true,attributeFilter:['class','hidden'],subtree:true});document.addEventListener('desk:render',syncVisibility);syncVisibility();
 }
 function draw(){
  const C=window.DeskNavigationCore,p=new URLSearchParams(location.search),active=location.pathname==='/desk-section.html'?p.get('view'):C.groupFor(location.pathname);
  root.innerHTML='<a class="desk-side-logo" href="/my.html">The Desk</a><div class="desk-groups">'+C.groups.map(g=>{const url=g.id==='desk'?'/my.html':'/desk-section.html?view='+g.id;return '<section class="desk-nav-group"><a class="desk-group-link" href="'+url+'"'+(active===g.id?' aria-current="page"':'')+'>'+icon(g.icon)+'<span>'+g.label+'</span>'+(g.id==='community'&&data.community?.unread>0?'<i class="desk-reply-dot" aria-label="New replies"></i>':'')+'</a><div class="desk-group-items">'+g.items.map(([key,title])=>'<a href="'+esc(C.href(key,data))+'">'+esc(title)+'</a>').join('')+'</div></section>';}).join('')+'</div>';
  account.textContent=(data.profile?.name||data.profile?.firstName||'').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase()||'•';account.setAttribute('aria-label',data.signedIn?'Account for '+(data.profile?.name||'you'):'Log in or create an account');window.DeskNavigation.icon=icon;
 }
})();
