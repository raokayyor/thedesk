export function nextExploreDeadline(rows,now=new Date()){
 const today=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'T00:00:00Z');
 return (rows||[]).filter(p=>p.status==='open'&&/^\d{4}-\d{2}-\d{2}$/.test(p.closes||'')).map(p=>({...p,days:Math.round((new Date(p.closes+'T00:00:00Z')-today)/86400000)})).filter(p=>p.days>=0&&p.days<=14).sort((a,b)=>a.days-b.days)[0]||null;
}
