export function closingSoonCount(programmes,now=new Date()){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const end=new Date(today+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+30);const last=end.toISOString().slice(0,10);
 return new Set(programmes.filter(p=>p.status!=='closed'&&/^\d{4}-\d{2}-\d{2}$/.test(p.closes||'')&&p.closes>=today&&p.closes<=last).map(p=>p.firm+'|'+p.name)).size;
}
