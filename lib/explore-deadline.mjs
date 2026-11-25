export function nextExploreDeadline(rows,now=new Date()){
 const today=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'T00:00:00Z');
 return (rows||[]).filter(p=>p.status==='open'&&/^\d{4}-\d{2}-\d{2}$/.test(p.closes||'')).map(p=>({...p,days:Math.round((new Date(p.closes+'T00:00:00Z')-today)/86400000)})).filter(p=>p.days>=0&&p.days<=14).sort((a,b)=>a.days-b.days)[0]||null;
}
const BIG_NAMES=/^(?:goldman sachs|j\.?\s?p\.?\s?morgan(?: chase)?|morgan stanley|bank of america(?: \/ merrill)?|citi(?:group)?|barclays|hsbc|deutsche bank|ubs|wells fargo|lloyds(?: banking group)?|natwest(?: group)?|santander|rbc(?: capital markets)?|bnp paribas|société générale|societe generale|lazard|rothschild(?: & co)?|evercore|pjt partners|moelis(?: & company)?|perella weinberg(?: partners)?|centerview(?: partners)?|houlihan lokey|pwc|deloitte|ey|kpmg|blackrock|fidelity(?: international| investments)?|schroders|vanguard|legal & general(?: investment management)?|lgim|m&g(?: investments)?|abrdn|pimco|wellington(?: management)?|capital group|invesco|amundi|t\.? rowe price)$/i;
export function nextExploreDeadlines(rows,now=new Date(),{route}={}){
 const today=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'T00:00:00Z');
 return (rows||[]).filter(p=>BIG_NAMES.test(String(p.firm||'').trim())&&p.status==='open'&&/^\d{4}-\d{2}-\d{2}$/.test(p.closes||'')&&(!route||p.sector===route)).map(p=>({...p,days:Math.round((new Date(p.closes+'T00:00:00Z')-today)/86400000)})).filter(p=>p.days>=0).sort((a,b)=>a.days-b.days||a.firm.localeCompare(b.firm)).slice(0,3);
}
