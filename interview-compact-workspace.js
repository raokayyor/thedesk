// Keep the original recording and transcript nodes and their event handlers.
const row=document.querySelector('.interview-recording-row');
const controls=row?.querySelector('.interview-recording-controls');
const transcript=row?.querySelector('.transcript');
const cv=document.querySelector('.dc-cv'),pr=document.querySelector('.dc-pr');
if(row&&controls&&transcript){
 controls.append(transcript);
 const help=document.createElement('aside');help.className='interview-cv-help';help.setAttribute('aria-label','Answer from your CV');
 if(cv)help.append(cv);if(pr)help.append(pr);row.append(help);
 const style=document.createElement('style');style.textContent=`.interview-recording-row{align-items:start;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.interview-cv-help{min-width:0;padding:16px;background:#fffdfa}.interview-cv-help .dc-cv{margin:0 0 14px;padding:16px}.interview-cv-help .dc-pr{margin:0;padding:16px}.interview-recording-controls>.transcript{border-top:1px solid #d6dfeb;padding:16px}.interview-recording-controls #transcript{min-height:160px;max-height:260px}.dc-answer-example{margin-top:16px;border-top:1px solid #ddd7cf;padding-top:12px}.dc-answer-example summary{cursor:pointer;font-weight:700}.dc-answer-example p{font-size:14px;line-height:1.65}body[data-desk-mode=test] .interview-cv-help{display:none}body[data-desk-mode=test] .interview-recording-row{grid-template-columns:1fr}@media(max-width:700px){.interview-recording-row{grid-template-columns:1fr}.interview-cv-help{border-top:1px solid #ddd7cf}}`;
 document.head.append(style);
}
