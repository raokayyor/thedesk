import {localReturn} from './lib/tier-journey.mjs';
const q=new URLSearchParams(location.search),id=q.get('id');
try{const r=await fetch(id?'/api/verify-checkout':'/api/membership',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(id?{assessmentId:id,sessionId:q.get('session_id')}:{action:'verify',sessionId:q.get('session_id')})}),d=await r.json();if(!r.ok)throw Error(d.error||'We could not confirm payment.');location.replace(localReturn(d.next));}catch(e){document.getElementById('status').textContent=e.message;}
