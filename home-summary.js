async function loadHomepageDeadlines(route=''){
 const slot=document.getElementById('deadlineCount');if(!slot)return;slot.hidden=true;
 try{const response=await fetch('/api/home-summary?route='+encodeURIComponent(route));if(!response.ok)return;const data=await response.json();if(data.deadlines?.length<3||!Array.isArray(data.deadlines))return;
 const label=document.createElement('span');label.className='deadline-label';label.textContent='Closing in the next 30 days';const list=document.createElement('div');list.className='deadline-list';
 for(const p of data.deadlines){const row=document.createElement('a');row.className='deadline-programme';row.href=p.source_url||p.url;row.target='_blank';row.rel='noopener';const title=document.createElement('strong');title.textContent=p.firm+' · '+p.name;const detail=document.createElement('span');const days=Math.max(0,Math.floor((Date.now()-Date.parse(p.last_checked))/86400000));detail.textContent='Closes '+new Date(p.closes+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' · checked '+days+' days ago ↗';row.append(title,detail);list.append(row);}
 slot.replaceChildren(label,list);slot.hidden=false;}catch{}
}
loadHomepageDeadlines(new URLSearchParams(location.search).get('route')||'');document.addEventListener('desk:routechange',e=>loadHomepageDeadlines(e.detail.route));

(()=>{const bar=document.getElementById('phoneScoreBar'),hero=document.getElementById('cta'),pricing=document.getElementById('homepagePricing'),final=document.querySelector('.final'),phone=matchMedia('(max-width:900px)');if(!bar||!hero||!pricing||!final||!('IntersectionObserver' in window))return;
 let heroVisible=true,pricingVisible=false,finalVisible=false;
 const update=()=>{bar.hidden=!phone.matches||heroVisible||pricingVisible||finalVisible||hero.getBoundingClientRect().bottom>0;};
 new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===hero)heroVisible=entry.isIntersecting;if(entry.target===pricing)pricingVisible=entry.isIntersecting;if(entry.target===final)finalVisible=entry.isIntersecting;}update();},{threshold:0}).observe(hero);
 const offers=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===pricing)pricingVisible=entry.isIntersecting;if(entry.target===final)finalVisible=entry.isIntersecting;}update();},{threshold:0});offers.observe(pricing);offers.observe(final);phone.addEventListener('change',update);
})();
(async()=>{const strip=document.getElementById('returningResult');if(!strip)return;let resultId;try{resultId=sessionStorage.getItem('desk-free-result-id')||localStorage.getItem('desk-free-result-id');}catch{}
 try{const response=await fetch('/api/desk-home',{credentials:'same-origin',cache:'no-store'});if(response.ok){const desk=await response.json();if(desk.member)return;if(desk.report?.assessmentId)resultId=desk.report.assessmentId;}}catch{}
 if(!/^[a-f0-9]{32,128}$/i.test(resultId||''))return;
 try{const response=await fetch('/api/assessment-result?id='+encodeURIComponent(resultId),{credentials:'same-origin',cache:'no-store'});if(!response.ok)return;const data=await response.json();if(data.paid)return;const score=data.result?.overallScore,estimate=data.conversion?.estimate,n=data.result?.priorities?.length;if(!Number.isFinite(score)||!Number.isFinite(estimate?.low)||!Number.isFinite(estimate?.high)||!Number.isInteger(n))return;strip.href='/result-final-design.html?id='+encodeURIComponent(resultId);strip.textContent='Your score: '+score+' · '+n+' '+(n===1?'fix':'fixes')+' to ~'+estimate.low+'–'+estimate.high+' · Unlock · £89';strip.hidden=false;}catch{}
})();
