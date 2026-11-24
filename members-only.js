import {FEATURES,featureKey,memberDestination} from '/feature-tour.mjs';
const raw=new URLSearchParams(location.search).get('feature'),key=featureKey(raw);
if(raw==='applications')location.replace('/tracker.html');else{const d=await (window.DeskSession||fetch('/api/desk-home',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null));if(d?.member)location.replace(memberDestination(key,d));else{const u=new URL(FEATURES[key].page,location.origin);u.searchParams.set('tour','1');location.replace(u.pathname+u.search);}}
