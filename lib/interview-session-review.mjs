// Session-local review queue. Successful reviews are retained when a later request fails.
export function rememberInterviewAnswer(entries,key,payload){
 let entry=entries.find(x=>x.key===key);
 if(!entry){entry={key,payload,feedback:null};entries.push(entry);}
 else if(entry.payload.transcript!==payload.transcript||entry.payload.question!==payload.question){entry.payload=payload;entry.feedback=null;}
 return entry;
}
export async function reviewInterviewAnswers(entries,assessor,onProgress=()=>{}){
 const pending=entries.filter(e=>!e.feedback);
 for(const [index,entry]of pending.entries()){onProgress({completed:index,total:pending.length,question:entry.payload.question});entry.feedback=await assessor(entry.payload);}
 onProgress({completed:pending.length,total:pending.length});return entries;
}
