// Shared, deterministic date selection for the dashboard and regression tests.
(function(root){
 function upcoming(applications,now=new Date()){
  const day=new Date(now);day.setHours(0,0,0,0);
  const remaining=value=>{if(!value)return null;const d=new Date(String(value).slice(0,10)+'T00:00:00');return Number.isFinite(+d)?Math.round((d-day)/86400000):null;};
  return (applications||[]).filter(a=>!['Rejected','Unsuccessful','Withdrawn','Offer','Accepted','Closed'].includes(a.stage)).map(a=>{
   const interview=/^interview$/i.test(a.stage||'');
   const days=remaining(interview?(a.interviewDate||a.deadline):a.deadline);
   return {...a,interview,days};
  }).filter(a=>a.firm&&(a.interview&&(a.days===null||a.days>=0)||a.days!==null&&a.days>=0&&a.days<=7))
   .sort((a,b)=>(a.days??Infinity)-(b.days??Infinity)||Number(b.interview)-Number(a.interview))[0]||null;
 }
 function nearest(applications,now=new Date()){
  const day=new Date(now);day.setHours(0,0,0,0);
  return (applications||[]).filter(a=>a.firm&&!['Rejected','Unsuccessful','Withdrawn','Offer','Accepted','Closed'].includes(a.stage)).map(a=>{const interview=/^interview$/i.test(a.stage||''),date=interview?(a.interviewDate||a.deadline):a.deadline;const days=date?Math.round((new Date(String(date).slice(0,10)+'T00:00:00')-day)/86400000):null;return {...a,interview,date,days};}).filter(a=>a.days===null||Number.isFinite(a.days)&&a.days>=0).sort((a,b)=>(a.days??Infinity)-(b.days??Infinity)||Number(b.interview)-Number(a.interview))[0]||null;
 }
 root.DeskDashboard={upcoming,nearest};
})(globalThis);
