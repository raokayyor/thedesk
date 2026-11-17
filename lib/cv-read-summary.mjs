export function cvSummary(text=''){
 const lines=String(text).split(/\r?\n/).map(x=>x.trim()).filter(Boolean),bulletLines=lines.filter(x=>/^(?:[-•▪*]|\d+[.)])\s*\S/.test(x));
 const headings=lines.filter(x=>x.length<180&&!/^[-•▪*]/.test(x)&&!/@|https?:/i.test(x));
 const roles=headings.filter(x=>/\b(intern|internship|barista|waiter|assistant|analyst|treasurer|captain|president|volunteer|associate)\b/i.test(x));
 const projects=headings.filter(x=>/\b(project|dissertation|coursework)\b/i.test(x)&&!/^projects?\s*:?$/i.test(x));
 return {roles:[...new Set(roles)],projects:[...new Set(projects)],bulletCount:bulletLines.length,lineCount:lines.length};
}
