// A presentation fallback must never manufacture evidence or change scoring.
// Paragraph CVs can combine a role/date and multiple achievements on one line.
// Select one exact action sentence from that same line, keeping all its facts.
export function assessmentPreviewFallback(analysis,errors,cvText){
 if(!errors.length||errors.some(error=>!/^CV (?:placeholder|issue)(?:\b|:)/.test(error)))return null;
 const original=analysis.cvPreview?.original;
 if(typeof original!=='string'||!cvText.includes(original))return null;
 const action=/\b(?:supported|assisted|helped|researched|recorded|flagged|presented|worked|trained|built|compared|tested|identified|attended|analysed|analyzed|prepared|reviewed|led|organised|organized|created|developed|managed|delivered|reconciled|calculated|negotiated|coordinated)\b/i;
 const choices=original.split(/(?<=[.!?])\s+(?=[A-Z])/u).map(text=>text.trim()).filter(text=>{const words=text.split(/\s+/).length;return words>=4&&words<=36&&action.test(text)&&cvText.includes(text)});
 choices.sort((a,b)=>((/\d/.test(b)?5:0)+b.split(/\s+/).length)-((/\d/.test(a)?5:0)+a.split(/\s+/).length));
 if(!choices.length)return null;
 const selected=choices[0],copy=structuredClone(analysis);
 copy.cvPreview={...copy.cvPreview,original:selected,issue:errors.some(error=>error.startsWith('CV issue'))?'Keep your stated work factual; add only details you can substantiate.':copy.cvPreview.issue,structure:selected.replace(/^[-•]\s*/,'').replace(/[.!?]$/,'')+'. [Optional: add one further detail you can substantiate.]'};
 return copy;
}
