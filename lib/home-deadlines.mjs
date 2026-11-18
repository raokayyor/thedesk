export function upcomingDeadlines(programmes,now=new Date()){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const end=new Date(today+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+30);const last=end.toISOString().slice(0,10),seen=new Set();
 return programmes.filter(p=>{const key=p.firm+'|'+p.name;if(seen.has(key)||p.status==='closed'||!/^\d{4}-\d{2}-\d{2}$/.test(p.closes||'')||p.closes<today||p.closes>last)return false;seen.add(key);return true;}).sort((a,b)=>a.closes.localeCompare(b.closes)||a.firm.localeCompare(b.firm));
}
export const closingSoonCount=(programmes,now=new Date())=>upcomingDeadlines(programmes,now).length;

export function homepageDeadlines(programmes,route='',now=new Date()){
 const groups=route==='insurance'?['ins']:route==='am'?['am']:route==='big4'?['big4','acc']:route==='markets'?['bb','uk','markets']:['ib','pe','corporate'].includes(route)?['bb','ib','uk']:['bb','ib','uk','am','big4'];
 const rows=upcomingDeadlines(programmes,now).filter(p=>groups.includes(p.sector||p.firm_group));
 return rows.length>=3?rows.slice(0,3):[];
}
