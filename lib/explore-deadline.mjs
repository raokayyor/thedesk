export function nextExploreDeadline(rows,now=new Date()){
 const today=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'T00:00:00Z');
 return (rows||[]).filter(p=>p.status==='open'&&/^\d{4}-\d{2}-\d{2}$/.test(p.closes||'')).map(p=>({...p,days:Math.round((new Date(p.closes+'T00:00:00Z')-today)/86400000)})).filter(p=>p.days>=0&&p.days<=14).sort((a,b)=>a.days-b.days)[0]||null;
}
const BIG_NAMES=/^(?:goldman sachs|j\.?\s?p\.?\s?morgan(?: chase)?|morgan stanley|bank of america(?: \/ merrill)?|citi(?:group)?|barclays|hsbc|deutsche bank|ubs|wells fargo|lloyds(?: banking group)?|natwest(?: group)?|santander|rbc(?: capital markets)?|bnp paribas|société générale|societe generale|lazard|rothschild(?: & co)?|evercore|pjt partners|moelis(?: & company)?|perella weinberg(?: partners)?|centerview(?: partners)?|houlihan lokey|pwc|deloitte|ey|kpmg|blackrock|fidelity(?: international| investments)?|schroders|vanguard|legal & general(?: investment management)?|lgim|m&g(?: investments)?|abrdn|pimco|wellington(?: management)?|capital group|invesco|amundi|t\.? rowe price)$/i;
export function isExploreFrontOffice(p){
 const text=[p.name,p.area,p.route].filter(Boolean).join(' ');
 if(/technology|developer|software|data\s|\bAI\b|operations|infrastructure|cyber|risk office|reinsurance|relationship management/i.test(text))return false;
 return /investment bank|\bIBD\b|sales.*trading|markets|asset management|investment management|audit|assurance|deals|transaction advisory|corporate finance|mergers|\bM&A\b/i.test(text);
}
export function matchesDeadlineRoute(p,route){
 if(!route||route==='General Finance')return true;
 const text=[p.name,p.area,p.route].filter(Boolean).join(' ');
 if(/Investment Banking|^ib$/.test(route))return /investment bank|IBD|corporate finance|mergers|M&A/i.test(text);
 if(/Markets|^markets$/.test(route))return /markets|trading|sales/i.test(text);
 if(/Asset Management|^am$/.test(route))return /asset management|investment management|investing/i.test(text)||p.sector==='am';
 if(/Accounting|^big4$/.test(route))return /audit|assurance|deals|transaction advisory/i.test(text);
 if(/Consulting|^consulting$/.test(route))return /consult|advisory/i.test(text);
 return p.sector===route;
}
export function nextExploreDeadlines(rows,now=new Date(),{route}={}){
 const today=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'T00:00:00Z');
 return (rows||[]).filter(p=>BIG_NAMES.test(String(p.firm||'').trim())&&isExploreFrontOffice(p)&&p.status==='open'&&/^\d{4}-\d{2}-\d{2}$/.test(p.closes||'')&&matchesDeadlineRoute(p,route)).map(p=>({...p,days:Math.round((new Date(p.closes+'T00:00:00Z')-today)/86400000)})).filter(p=>p.days>=0).sort((a,b)=>a.days-b.days||a.firm.localeCompare(b.firm)).slice(0,3);
}
