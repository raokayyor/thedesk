export function sentenceCoaching(transcript,fixes=[]){
 return String(transcript||'').split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(Boolean).map(text=>{
 const fix=fixes.find(f=>f.quote&&(text.includes(f.quote)||f.quote.includes(text)));
 if(fix)return {text,label:/filler|restart|repet|generic/i.test(fix.title+' '+fix.action)?'Cut or tighten':'Make this stronger',dimension:fix.dimension||'evidence',note:fix.action||fix.why,tryText:fix.trySource==='rewrite'?fix.tryText:''};
 if(/\b(?:we|our team)\b/i.test(text)&&!(/\bI\b/.test(text)))return {text,label:'Say what you did',dimension:'evidence',note:'Keep the team context, then identify your own action.'};
 if(/\bI\s+(?:researched|built|trained|flagged|analysed|compared|led|organised|reconciled|presented|tested|recorded)\b/i.test(text))return {text,label:'Keep',dimension:'evidence',note:'This identifies your own contribution. Add an observable outcome if you know it.'};
 if(/still need|need to research|haven.t|not yet/i.test(text))return {text,label:'Research gap',dimension:'relevance',note:'Add one checked firm detail and explain why it matters to you.'};
 if(/do not know|don.t know|unknown|cannot confirm/i.test(text))return {text,label:'Keep the honest limit',dimension:'evidence',note:'Do not invent an outcome. Say what you observed and what you can explain.'};
 if(/student|studying|degree|university/i.test(text))return {text,label:'Keep your introduction',dimension:'structure',note:'This gives your starting context. Keep it to one sentence, then move to experience.'};
 if(/internship|intern|placement|worked|role|project/i.test(text))return {text,label:'Relevant experience named',dimension:'relevance',note:'The role or project is clear. Follow it with your own contribution.'};
 if(/because|enjoy|interest|want to/i.test(text))return {text,label:'Make the connection',dimension:'relevance',note:'Link your interest to the work in this role, then distinguish the firm.'};
 return {text,label:'Keep the context concise',dimension:'structure',note:'Use this only if it helps answer the question. Then move to your own evidence.'};
 });
}
export function transcriptFollowUps(transcript){
 const sentences=String(transcript||'').split(/(?<=[.!?])\s+|\n+/).filter(s=>/\bI\b/.test(s));
 const action=sentences.find(s=>/\b(?:flagged|selected|chose|compared|analysed|built|researched|trained)\b/i.test(s))||sentences[0];
 if(!action)return [];
 const quote=action.trim().slice(0,240);
 return [{question:'You said, “'+quote+'” What did you personally decide, and why?',quote},{question:'What happened after that work, and what evidence do you have for the outcome?',quote},{question:'Looking back at that example, what would you do differently and why?',quote}];
}
export function compareAttempts(current,previous){
 if(!previous)return null;const words=new Set(String(previous.transcript||'').toLowerCase().match(/[a-z0-9]+/g)||[]);
 return {before:previous.transcript||'',after:current.transcript||'',previousScore:previous.overall,score:current.overall,delta:current.overall-previous.overall,dimensions:Object.keys(current.scores||{}).map(key=>({key,before:previous.scores?.[key],after:current.scores[key],delta:Number.isFinite(previous.scores?.[key])?current.scores[key]-previous.scores[key]:null})),tokens:String(current.transcript||'').split(/(\s+)/).map(text=>({text,added:!!text.trim()&&!words.has(text.toLowerCase().replace(/[^a-z0-9]/g,''))}))};
}
export function deliveryMeasures(transcript,seconds){const words=String(transcript||'').match(/\b[\w’']+\b/g)||[],fillers=(String(transcript||'').match(/\b(?:um|uh|erm|you know|sort of|kind of)\b/gi)||[]).length;return {pace:seconds>5?Math.round(words.length*60/seconds):null,fillers,ending:/[.!?]\s*$/.test(transcript)?'The transcript ends with a complete sentence.':'Finish with one complete sentence that connects back to the question.',pauses:null};}
