import {answerBuilderFields} from './interview-answer-builder.mjs';
export function scriptExample(example){
 if(!example)return example;
 const fields=answerBuilderFields(example);
 const beats=example.beats.map((beat,i)=>({...beat,text:fields[i].text||beat.text}));
 return {...example,beats,answer:beats.map((b,i)=>({...b,beatIndex:i}))};
}
export function scriptParts(beat){
 const text=String(beat.text||'');
 if(beat.gap)return [{text,gap:true,ordinal:0}];
 let end=0,ordinal=0;const parts=[];
 for(const m of text.matchAll(/\[([^\]]+)\]/g)){if(m.index>end)parts.push({text:text.slice(end,m.index)});parts.push({text:m[1],gap:true,ordinal:ordinal++});end=m.index+m[0].length;}
 if(end<text.length)parts.push({text:text.slice(end)});return parts;
}
export function replaceScriptGap(beat,ordinal,value){
 const parts=scriptParts(beat);if(!parts.some(p=>p.gap&&p.ordinal===ordinal))throw Error('This gap has changed. Reopen it.');
 return parts.map(p=>p.gap?(p.ordinal===ordinal?value:'['+p.text+']'):p.text).join('');
}
export function scriptSummary(example){const parts=example.beats.flatMap(scriptParts);return {gaps:parts.filter(p=>p.gap).length,minutes:Math.max(1,Math.round(parts.filter(p=>!p.gap).map(p=>p.text).join(' ').split(/\s+/).length/130))};}
export function swapScriptExperience(current,next){
 next=scriptExample(next);
 const intro=/who you are|introduction|your studies/i.test(current.beats[0]?.label||'');
 if(!intro)return next; // Behavioural stories must keep their own scene, actions and result together.
 const beats=next.beats.map((b,i)=>i===0||i===3?{...current.beats[i]}:b);
 return {...next,beats,answer:beats.map((b,i)=>({...b,beatIndex:i}))};
}
export function personalAsking(generic,example){
 if(!example||example.templateOnly)return generic;
 const evidence=String(example.point||'').replace(/\[[^\]]*\]/g,'').trim().split(/[,.;!?]/)[0].replace(/\s+(?:and|or|with)$/i,'')+'.';
 const org=String(example.source||'').split(/\s+[—–-]\s+/)[0];
 if(!evidence||!org||/saved|earlier answer|own evidence/i.test(org))return generic;
 return generic+" For you, that’s "+org+': '+evidence;
}
