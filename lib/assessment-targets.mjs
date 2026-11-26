export const TARGET_ROUTES=[
 {key:'ib',label:'Investment banking',sector:'Investment Banking / IBD',firms:['Barclays','J.P. Morgan','Goldman Sachs','Morgan Stanley','Lazard','Evercore']},
 {key:'markets',label:'Markets',sector:'Sales & Trading / Markets',firms:['Barclays','J.P. Morgan','Goldman Sachs','UBS','HSBC','Deutsche Bank']},
 {key:'am',label:'Asset management',sector:'Asset Management / Investing',firms:['BlackRock','Fidelity International','Schroders','Vanguard','PIMCO','J.P. Morgan']},
 {key:'big4',label:'Big Four',sector:'Accounting / Audit',firms:['Deloitte','EY','KPMG','PwC']},
 {key:'consulting',label:'Consulting',sector:'Consulting / Advisory',firms:['McKinsey','BCG','Bain','Deloitte','EY','PwC']},
 {key:'unsure',label:'Not sure yet',sector:'General Finance',firms:['Barclays','J.P. Morgan','BlackRock','Deloitte','EY','KPMG','PwC']}
];
export const TARGET_KEY='desk-assessment-targets-v1';
export function targetRoute(value){const v=String(value||'').toLowerCase();return TARGET_ROUTES.find(r=>[r.key,r.label,r.sector].some(x=>x.toLowerCase()===v));}
export function firmName(value){const v=String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');return [...new Set(TARGET_ROUTES.flatMap(r=>r.firms))].find(f=>f.toLowerCase().replace(/[^a-z0-9]/g,'')===v)||'';}
export function cleanTargets(value={}){const r=targetRoute(value.route||value.targetSector);return {route:r?.key||'',sector:r?.sector||'',firms:[...new Set((Array.isArray(value.firms)?value.firms:[]).map(firmName).filter(f=>f&&(!r||r.firms.includes(f))))].slice(0,3)};}
export function readTargets(storage=globalThis.localStorage){try{return cleanTargets(JSON.parse(storage.getItem(TARGET_KEY)||'{}'));}catch{return cleanTargets();}}
export function saveTargets(value,storage=globalThis.localStorage){const target=cleanTargets(value);try{storage.setItem(TARGET_KEY,JSON.stringify(target));}catch{}return target;}
export function entryTargets(search,saved={}){const q=new URLSearchParams(search);let back;try{back=new URL(q.get('return')||'/', 'https://desk.invalid');}catch{}const firm=firmName(q.get('firm')||q.get('targetFirm')||back?.searchParams.get('firm')),route=targetRoute(q.get('route'));if(route)return cleanTargets({route:route.key,firms:firm?[firm]:saved.firms});if(firm){const previous=targetRoute(saved.route),r=previous?.firms.includes(firm)?previous:TARGET_ROUTES.find(r=>r.firms.includes(firm));return cleanTargets({route:r?.key,firms:[firm]});}return cleanTargets(saved);}
