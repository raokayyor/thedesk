import {matchesDeadlineRoute} from './explore-deadline.mjs';
const normal=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const kind=value=>/spring|insight/i.test(value)?'spring':/off.?cycle/i.test(value)?'offcycle':/placement|industrial/i.test(value)?'placement':/summer|intern/i.test(value)?'summer':/grad/i.test(value)?'graduate':'';
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
export const programmeDeadlineConfirmed=row=>row.status==='open'&&validDate(row.closes)&&Number.isFinite(Date.parse(row.last_checked))&&!!row.checked_by&&!/legacy|snapshot|not reverified/i.test(row.checked_by)&&!row.review_reason;
export function confirmedSummaryDeadline(programmes,profile={},now=new Date()){
 const firm=normal(profile.targetFirm),programme=profile.programme;if(!firm||!programme)return null;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 return programmes.filter(p=>p.deadlineConfirmed===true&&p.status==='open'&&!p.review_reason&&normal(p.firm)===firm&&validDate(p.closes)&&p.closes>=today&&(kind(programme)?kind(p.type||p.name)===kind(programme):normal(p.name)===normal(programme))&&matchesDeadlineRoute(p,profile.targetSector||profile.targetDivision)).sort((a,b)=>a.closes.localeCompare(b.closes)||a.name.localeCompare(b.name)).map(p=>({firm:p.firm,programme:p.name,date:p.closes,days:Math.round((Date.parse(p.closes+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000)}))[0]||null;
}
