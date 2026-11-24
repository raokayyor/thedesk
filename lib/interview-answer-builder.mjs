// One four-section answer is shared by the editor, assembled answer and camera guide.
export function answerBuilderFields(example){
 return (example?.beats||[]).slice(0,4).map((beat,index)=>({index,label:beat.label,instruction:beat.instruction||'',text:beat.gap?'':beat.confirmed?beat.text:/contribution|your actions|personal action/i.test(beat.label)?example.contributionDraft||beat.text:beat.text,gap:!!beat.gap||!!beat.hasGaps,prompt:beat.gap?beat.text:beat.instruction||'Add your own detail using only what happened.'}));
}
export function assemblePracticeAnswer(example,values=[]){
 if(!example?.beats||example.beats.length!==4)throw Error('Your question needs a four-section answer plan.');
 const beats=example.beats.map((beat,index)=>{const text=String(values[index]??'').trim();if(text.length>800)throw Error('Keep each section within 800 characters.');return text?{...beat,text,gap:false,hasGaps:/\[[^\]]+\]/.test(text),confirmed:beat.confirmed||text!==beat.text,sourceId:text===beat.text?beat.sourceId:'student-confirmation'}:{...beat,text:beat.gap?beat.text:beat.instruction||'Add this section from your own evidence.',gap:true};});
 return {...example,beats,answer:beats.map((b,beatIndex)=>({...b,beatIndex,action:/contribution|your actions|personal action/i.test(b.label)})),text:beats.map(b=>b.gap?'['+b.text+']':b.text).join('\n\n'),prepared:true};
}
export function builderConfirmations(example,values=[]){return values.map((value,index)=>({sourceId:example.id,index,text:String(value||'').trim()})).filter(c=>c.text&&(example.beats[c.index]?.gap||c.text!==example.beats[c.index]?.text));}
