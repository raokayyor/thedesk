import {runFramework} from './cv-fault-framework.mjs';
const clean=value=>String(value||'').replace(/^\s*[-•▪*]\s*/,'').trim();
const dateLine=line=>/^(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b.*\d{4}|(?:19|20)\d{2}\b)/i.test(line);
export function universityFromCv(cv,profile={}){
 if(profile.university?.trim())return profile.university.trim();
 for(const line of String(cv||'').split(/\r?\n/)){
  const head=line.split(/\s+[—–|]\s+|,\s*(?:BSc|BA|MSc|MA|BEng|MEng)\b/)[0].trim();
  if(/^(?:LSE|UCL|KCL|SOAS|[\p{L} '&.-]+ University Business School|University of [\p{L} '&.-]+|[\p{L} '&.-]+ University|Imperial College London|London School of Economics(?: and Political Science)?)$/u.test(head))return head;
 }return '';
}
export function weakLineContext(cv,original){
 const lines=String(cv||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),index=lines.findIndex(line=>line.includes(original.trim()));
 for(let i=index-1;i>=0;i--){if(/^[-•▪*]/.test(lines[i])||dateLine(lines[i]))continue;if(/^(education|experience|work experience|projects|skills|activities|interests)$/i.test(lines[i]))break;return lines[i].split(/\s+[—–|]\s+/)[0].trim();}
 return '';
}
export function rankedWeakLines(result,cv,profile={}){const framework=result.cvFramework||runFramework(cv,{firm:profile.targetFirm||result.targetFirm||'your target firm'});return framework.allFlaggedLines.map((line,index)=>({original:line.text,issue:line.why,severity:line.severity,index,role:line.role,faults:line.faults}));}
function whyLine(line){
 const issue=String(line.issue||'Your contribution needs a clearer explanation').trim().replace(/[.!?]+$/,'');
 return issue[0].toUpperCase()+issue.slice(1)+'.';
}
export function practitionerPerspective(line,cv,flagged=true){
 if(!line)return 'No weak lines were flagged in this assessment. Be ready to explain the decisions behind your strongest examples and keep every claim supportable.';
 const context=weakLineContext(cv,line.original),text=clean(line.original);
 const question=/reconcil|audit|financial record/i.test(text)?'What did you check, what did you find, and what was your own contribution?':/DCF|valuat|model|benchmark/i.test(text)?'Which assumptions drove the work, and what conclusion could you defend?':/research|analys|compar/i.test(text)?'What did your analysis show, and how was that finding used?':/present|recommend|communicat/i.test(text)?'What recommendation did you make, why, and how did the audience respond?':/train|led|coordinat/i.test(text)?'What did you personally decide or change, and what evidence shows the effect?':'What were you personally responsible for, and what did your work achieve?';
 if(!flagged)return `Your ${context||'CV'} example gives you something concrete to discuss. Be ready to explain: ${question}`;
 return `For ${context?'your '+context+' experience':'the example “'+clean(text).split(/\s+/).slice(0,7).join(' ')+'…”'}, be ready for this question: ${question} The first improvement is to make that answer clear in the CV, using only facts you can substantiate.`;
}
export function resultTeaser(row){
 const cv=row.input.cvText||'',lines=rankedWeakLines(row.result,cv),top=lines[0],university=universityFromCv(cv,row.input.profile);
 const universityContext=null;
 const placeholder=top?Array.from({length:Math.max(8,clean(top.original).split(/\s+/).length)},(_,i)=>['Your','stronger','wording','appears','here','with','confirmed','facts'][i%8]).join(' '):'';
 const score=row.result.overallScore??row.result.cvEvidenceScore;
 const advice=row.result.readinessComplete===false?'CV review only — complete the tests for the full readiness picture.':score<65?'Developing — strengthen your evidence and test preparation before you submit.':score<75?'Borderline — address the remaining gaps before submitting.':top?'Competitive — check the flagged refinements before sending.':'Competitive — prepare to defend your examples in interview.';
 const strengthQuote=(row.result.competencies||[]).slice().sort((a,b)=>b.score-a.score).flatMap(c=>c.quotes||[]).find(quote=>cv.includes(quote)&&quote.trim().split(/\s+/).length>=4)||cv.split(/\r?\n/).find(line=>/^[-•▪*]/.test(line.trim())&&line.trim().split(/\s+/).length>=6);
 return{university,universityContext,advice,practitioner:practitionerPerspective(top||(strengthQuote?{original:strengthQuote}:null),cv,!!top),teaser:top?{original:top.original,why:whyLine(top),remainingCount:lines.length-1,placeholder}:null,lines};
}
