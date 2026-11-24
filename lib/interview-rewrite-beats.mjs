export function normaliseRewriteParts(parts){return parts.flatMap(p=>{const clause=!p.gap&&p.beat==='experience'&&p.text.match(/^(.+?\b(?:interned|worked|internship|role)\b.+?), where (I .+)$/i);return clause?[{...p,text:clause[1]+'.'},{...p,text:clause[2],beat:'action',marker:undefined,change:null}]:[p];}).map((p,i)=>{
  const key=p.beat||(/why|firm|because/i.test(p.prompt||p.text)&&(!p.change||p.change===3)?'why':i===0?'who':p.change===1?'experience':'action');
  const corrected=key==='experience'&&/^I\s+(?:then\s+)?(?:researched|flagged|built|analysed|compared|presented|recorded|identified)/i.test(p.text)?'action':key==='action'&&!p.gap&&/most directly relevant|gave me a real sense|I (?:want|enjoy|am interested)/i.test(p.text)?'why':key;
  return {...p,beat:corrected};
 });}
export function rewriteBeats(rewrite,firm='this firm'){
 const beats=rewrite?.sections?.length===4?rewrite.sections.map(s=>({...s,parts:[]})):[{key:'who',label:'Who you are',parts:[]},{key:'experience',label:'Your best experience',parts:[]},{key:'action',label:'What you did',parts:[]},{key:'why',label:'Why '+firm,parts:[]}];
 for(const p of normaliseRewriteParts(rewrite?.parts||[]))(beats.find(b=>b.key===p.beat)||beats[2]).parts.push(p);
 return beats;
}
export function practiceRewriteBeats(rewrite,firm){return rewriteBeats(rewrite,firm).map(b=>({label:b.label,text:b.parts.map(p=>p.text).join(' '),quote:b.parts.filter(p=>!p.gap).map(p=>p.text).join(' '),note:b.parts.filter(p=>p.gap).map(p=>p.text).join(' '),present:b.parts.length>0&&!b.parts.some(p=>p.gap),gap:b.parts.some(p=>p.gap)}));}
export function rewriteGapConfig(prompt,firm=''){
 const firmGap=/\bfirm\b|\bemployer\b|checked detail|specific reason/i.test(prompt)||(/why|reason|about/i.test(prompt)&&firm&&prompt.toLowerCase().includes(firm.toLowerCase()));
 if(firmGap)return {type:'firm',helper:'Only you know this. One true detail beats three general ones.',placeholder:'Name one thing you have checked and why it matters to you.',picks:[['A deal I researched','Which deal did you research, and what interested you?'],['Someone I spoke to','Who did you speak to, and what did you learn?'],['A specific team','Which team, and why does its work interest you?'],['Its training','What did you learn about its training, and why does that suit you?']]};
 if(/learn|develop|skill|improve|interest|reflect|next step/i.test(prompt))return {type:'development',helper:'Use your own interests or learning. You do not need to claim a new achievement.',placeholder:'I want to develop… because…',picks:[['A skill to build','Which skill do you want to build, and why?'],['Work I enjoyed','Which part of your own work interested you?'],['What I learned','What did you actually learn from this experience?'],['What I would change','What would you do differently next time?']]};
 if(/decid|decision|cho[os]|approach|trade.off|alternative/i.test(prompt))return {type:'decision',helper:'Explain your own decision and the reason behind it.',placeholder:'I chose… because…',picks:[['My choice','What did you choose yourself?'],['An alternative','Which other option did you consider?'],['My reasoning','Why did you choose that approach?'],['The trade-off','What did you gain or give up?']]};
 return {type:'outcome',helper:'Describe what you actually saw or were told. If you do not know, say so.',placeholder:'What actually happened after your work?',picks:[['How the work was used','Who used your work, and how?'],['Feedback I received','What feedback did you actually receive?'],['What changed next','What happened next, and how do you know?'],['Outcome not known yet','Say what you know and what remains unknown.']]};
}
export function gapAnswerText(parts,id,value,firm=''){
 const index=parts.findIndex(p=>p.id===id),previous=parts[index-1]?.text||'';let text=String(value||'').trim();
 if(/because\s*$/i.test(previous)){text=text.replace(/^because\s+/i,'');if(/^its?\s/i.test(text))text='of '+text;}
 else if(firm&&rewriteGapConfig(parts[index]?.prompt||parts[index]?.text||'',firm).type==='firm'&&text&&!/^(?:I\b|My\b|The\b|This\b|After\b|Having\b)/i.test(text)){text=text.replace(/^because\s+/i,'');if(/^its?\s/i.test(text))text='of '+text;text="I'm applying to "+firm+' because '+text;}
 return text;
}
export function fillRewriteGap(rewrite,id,value,firm=''){
 const part=rewrite.parts.find(p=>p.id===id&&(p.gap||p.confirmed));if(!part)throw Error('Choose a gap in this answer.');
 const text=gapAnswerText(rewrite.parts,id,value,firm);if(String(value||'').trim().length<5||text.length>1000)throw Error('Use 5–1,000 characters of your own evidence.');
 const parts=rewrite.parts.map(p=>p===part?{...p,prompt:p.prompt||p.text,text,gap:false,confirmed:true,changed:true}:p);
 return {...rewrite,parts,text:parts.map(p=>p.gap?'['+p.text+']':p.text).join(' '),gaps:parts.filter(p=>p.gap).length};
}

export function alignFeedbackToRewrite(feedback,evidence=[],transcript=''){
 const rewrite=feedback.rewrite;if(!rewrite?.parts)return feedback;const beats=rewriteBeats(rewrite),byKey=Object.fromEntries(beats.map(b=>[b.key,b.parts]));const unused=evidence.filter(e=>e.org&&e.org!=='Your confirmed answer'&&!rewrite.text.toLowerCase().includes(e.org.toLowerCase())&&!transcript.toLowerCase().includes(e.org.toLowerCase()));
 for(const fix of feedback.improvement?.fixes||[]){const key=rewrite.sections?.length===4?rewrite.sections[{structure:0,evidence:1,relevance:3}[fix.dimension]]?.key:{structure:'experience',evidence:'action',relevance:'why'}[fix.dimension];if(!key)continue;const parts=byKey[key]||[];if(parts.length){fix.tryText=parts.slice(0,key==='action'?3:4).map(p=>p.gap?'['+p.text+']':p.text).join(' ');fix.trySource='rewrite';}
 if(unused.some(e=>[fix.action,fix.why].some(s=>s?.toLowerCase().includes(e.org.toLowerCase())))){const strongest=evidence.find(e=>e.org&&rewrite.text.includes(e.org));fix.title='Lead with your strongest relevant work';fix.why=strongest?'Your '+strongest.org+' example gives the interviewer direct evidence.':'Your fixed answer already contains a relevant example.';fix.action='Use the specific action in the fixed answer, then explain your own decision and the supported outcome.';}
 }
 return feedback;
}
