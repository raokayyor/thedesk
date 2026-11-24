const sessionId=crypto.randomUUID();
export function trackPractice(event,area='interview',ref=''){if(navigator.doNotTrack==='1')return;fetch('/api/practice-events',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,area,sessionId,ref}),keepalive:true}).catch(()=>{});}
const handoff=new URLSearchParams(location.search).get('handoff');if(handoff&&/^[a-f0-9]{48}$/.test(handoff))trackPractice('laptop_return',location.pathname.includes('story')?'story':'interview',handoff);
