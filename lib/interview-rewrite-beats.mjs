export function rewriteBeats(rewrite,firm='this firm'){
 const beats=[{key:'who',label:'Who you are',parts:[]},{key:'experience',label:'Your best experience',parts:[]},{key:'action',label:'What you did',parts:[]},{key:'why',label:'Why '+firm,parts:[]}];
 const separated=(rewrite?.parts||[]).flatMap(p=>{const clause=!p.gap&&p.beat==='experience'&&p.text.match(/^(.+?\b(?:interned|worked|internship|role)\b.+?), where (I .+)$/i);return clause?[{...p,text:clause[1]+'.'},{...p,text:clause[2],beat:'action',marker:undefined,change:null}]:[p];});
 for(const [i,p]of separated.entries()){
  const key=p.beat||(/why|firm|because/i.test(p.prompt||p.text)&&(!p.change||p.change===3)?'why':i===0?'who':p.change===1?'experience':'action');
  const corrected=key==='experience'&&/^I\s+(?:then\s+)?(?:researched|flagged|built|analysed|compared|presented|recorded|identified)/i.test(p.text)?'action':key==='action'&&!p.gap&&/most directly relevant|gave me a real sense|I (?:want|enjoy|am interested)/i.test(p.text)?'why':key;
  (beats.find(b=>b.key===corrected)||beats[2]).parts.push(p);
 }
 return beats;
}
export function practiceRewriteBeats(rewrite,firm){return rewriteBeats(rewrite,firm).map(b=>({label:b.label,text:b.parts.map(p=>p.text).join(' '),quote:b.parts.filter(p=>!p.gap).map(p=>p.text).join(' '),note:b.parts.filter(p=>p.gap).map(p=>p.text).join(' '),present:b.parts.length>0&&!b.parts.some(p=>p.gap),gap:b.parts.some(p=>p.gap)}));}
export function gapAnswerText(parts,id,value){
 const index=parts.findIndex(p=>p.id===id),previous=parts[index-1]?.text||'';let text=String(value||'').trim();
 if(/because\s*$/i.test(previous)){text=text.replace(/^because\s+/i,'');if(/^its?\s/i.test(text))text='of '+text;}
 return text;
}
export function fillRewriteGap(rewrite,id,value){
 const part=rewrite.parts.find(p=>p.id===id&&(p.gap||p.confirmed));if(!part)throw Error('Choose a gap in this answer.');
 const text=gapAnswerText(rewrite.parts,id,value);if(text.length<5||text.length>1000)throw Error('Use 5–1,000 characters of your own evidence.');
 const parts=rewrite.parts.map(p=>p===part?{...p,prompt:p.prompt||p.text,text,gap:false,confirmed:true,changed:true}:p);
 return {...rewrite,parts,text:parts.map(p=>p.gap?'['+p.text+']':p.text).join(' '),gaps:parts.filter(p=>p.gap).length};
}
