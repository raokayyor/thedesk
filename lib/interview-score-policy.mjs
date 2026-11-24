import {spokenOutcome} from './interview-story-context.mjs';
export function applyScorePolicy(feedback,input={}){
 const typed=input.inputMode==='typed'||input.seconds===0;feedback.inputMode=typed?'typed':'spoken';
 if(typed){delete feedback.scores?.delivery;feedback.dimensions=feedback.dimensions?.filter(d=>d.dimension!=='delivery');}
 if(feedback.scorePending)return feedback;const text=String(input.transcript||'');const number=/\d|\b(?:two|three|four|five|six|seven|eight|nine|ten|twelve|twenty)\b/i.test(text),action=/\b(?:prioritis\w*|prioritiz\w*|scheduled|planned|reconciled|researched|analysed|analyzed|flagged|built|created|trained|decided|compared|checked|presented|negotiated|escalated|organised|organized)\b|\b(?:told|informed|asked)\b.{0,45}\b(?:manager|supervisor|tutor)\b|\bswapped (?:my )?shifts\b/i.test(text),result=/\b(?:reduced|increased|saved|improved|resolved|achieved|completed|delivered|retained|adopted|passed|won)\b|met.{0,25}deadline/i.test(text)||!!spokenOutcome(text);
 const vague=/just tried|got through it|tried my best|always try my best/i.test(text);const values=Object.values(feedback.scores||{}).filter(Number.isFinite);if(values.length)feedback.overall=Math.round(values.reduce((a,b)=>a+b,0)/values.length);
 if(!action&&!result&&(!number||vague)){feedback.overall=Math.min(49,feedback.overall??49);for(const k of Object.keys(feedback.scores||{}))feedback.scores[k]=Math.min(49,feedback.scores[k]);feedback.band='Needs work';feedback.scoreCapReason='Add a specific personal action and what happened; general claims are not evidence.';}
 return feedback;
}
