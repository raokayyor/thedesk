export function programmeCalendar({firm,name,date,url},now=new Date()){
 if(!/^20\d\d-\d\d-\d\d$/.test(date||'')||new Date(date).toISOString().slice(0,10)!==date||new URL(url).protocol!=='https:')throw Error('Valid date and source required');
 const esc=s=>String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(';','\\;').replaceAll(',','\\,');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//The Desk//Programme reminders//EN','BEGIN:VEVENT','UID:'+encodeURIComponent(firm+'|'+name+'|'+date)+'@thedesk','DTSTAMP:'+now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z'),'DTSTART;VALUE=DATE:'+date.replaceAll('-',''),'SUMMARY:'+esc(firm+' application deadline: '+name),'DESCRIPTION:Check the official vacancy. Dates can change and roles may close early.','URL:'+url,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Check your programme application','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
}

