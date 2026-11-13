import {sql} from './report-store.mjs';
import {loadProgrammes} from './programmes.mjs';
export async function resultDeadline(row,account,now=new Date()){
 const programmes=(await loadProgrammes()).programmes,byKey=Object.fromEntries(programmes.map(p=>[p.firm+'|'+p.name,p]));let candidates=[];
 if(account){const items=await sql().query("SELECT kind,data FROM desk_value_items WHERE principal=$1 AND kind IN ('application','shortlist') ORDER BY created_at DESC LIMIT 100",['account:'+account.id]).catch(()=>[]);const shortlist=items.find(x=>x.kind==='shortlist')?.data?.list||{};candidates=items.filter(x=>x.kind==='application').map(x=>{const live=byKey[x.data.firm+'|'+x.data.programme];return {...x.data,...(live?.closes?{deadline:live.closes}:{})}});for(const [key,v]of Object.entries(shortlist)){const p=byKey[key];if(p)candidates.push({firm:p.firm,programme:p.name,deadline:p.closes,stage:v.stage});}}
 if(!candidates.length&&row.input.profile?.targetFirm){const firm=row.input.profile.targetFirm.toLowerCase().replace(/\W/g,'');candidates=programmes.filter(p=>p.firm.toLowerCase().replace(/\W/g,'')===firm&&p.status!=='closed').map(p=>({firm:p.firm,programme:p.name,deadline:p.closes}));}
 const today=now.toISOString().slice(0,10);return candidates.filter(c=>/^\d{4}-\d{2}-\d{2}$/.test(c.deadline||'')&&c.deadline>=today&&!['Offer','Unsuccessful','Closed','Withdrawn'].includes(c.stage)).sort((a,b)=>a.deadline.localeCompare(b.deadline)).map(c=>({firm:c.firm,programme:c.programme,date:c.deadline}))[0]||null;
}
