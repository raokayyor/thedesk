// Add the method and scale from the selected story, without inventing a downstream outcome.
export function trialFixedAnswer(rewrite,guide){
 const parts=[];for(let i=0;i<4;i++){
  const original=rewrite.parts.find(p=>p.beat==='section-'+i)||rewrite.parts[i],beat=guide.beats[i];
  if(i===1){const method=beat.text||'',extra=original&&!original.gap&&!method.toLowerCase().includes(original.text.toLowerCase())?original.text:'';parts.push({...original,beat:'section-1',gap:false,text:[method,extra].filter(Boolean).join(' ')});for(const gap of beat.gaps||[])parts.push({beat:'section-1-gap',gap:true,text:gap.prompt});}
  else if(original&&!original.gap){parts.push(original);if(i===2&&!/reduced|increased|saved|improved|achieved|won|retained|adopted|used|shortlist|feedback|on track|grades|missed? a shift/i.test(original.text))for(const gap of beat.gaps||[])parts.push({beat:'section-2-gap',text:gap.prompt,gap:true});}
  else{if(beat.text)parts.push({beat:'section-'+i,text:beat.text,gap:false});parts.push({...original,beat:'section-'+i,gap:true,text:beat.gaps?.[0]?.prompt||original?.text||'Add your own detail'});}
 }
 return {parts,text:parts.map(p=>p.gap?'['+p.text+']':p.text).join(' ')};
}
