import {SJT,VERBAL,FREE,FIRM_NOTES} from './aptitude-practice-data.mjs';
import {REASONING} from './reasoning-practice-data.mjs';
export function practiceItems(type,member){const all=REASONING[type]?.items||(type==='sjt'?SJT.items:type==='verbal'?VERBAL.passages.flatMap(p=>p.statements.map(s=>({...s,passage:{topic:p.topic,text:p.text}}))):null);if(!all)throw Error('Choose a valid test.');return member?all:all.slice(0,FREE[type]||4);}
export function publicPractice(member){
 const sjt=practiceItems('sjt',member).map(({best,worst,why,...q})=>q),ids=new Set(practiceItems('verbal',member).map(q=>q.id));
 return {member,FREE:{...FREE,inductive:4,deductive:4},FIRM_NOTES,REASONING:Object.fromEntries(Object.entries(REASONING).map(([k,t])=>[k,{title:t.title,minutes:t.minutes,fullCount:t.items.length,items:practiceItems(k,member).map(({answer,why,...q})=>q)}])),SJT:{...SJT,fullCount:SJT.items.length,items:sjt},VERBAL:{...VERBAL,fullCount:VERBAL.passages.reduce((n,p)=>n+p.statements.length,0),passages:VERBAL.passages.map(p=>({...p,statements:p.statements.filter(s=>ids.has(s.id)).map(({answer,why,...s})=>s)})).filter(p=>p.statements.length)}};
}
export function markPractice(type,answers,member){
 const items=practiceItems(type,member);if(!Array.isArray(answers)||answers.length!==items.length)throw Error('Send one answer per question.');let score=0;
 items.forEach((q,i)=>{const a=answers[i];if(type==='sjt'){if(!a||!['most','least'].every(k=>a[k]===null||Number.isInteger(a[k])&&a[k]>=0&&a[k]<4)||a.most!==null&&a.most===a.least)throw Error('Choose different most and least effective actions.');score+=Number(a.most===q.best)+Number(a.least===q.worst);}else{if(a!==null&&(REASONING[type]?(!Number.isInteger(a)||a<0||a>=q.options.length):!['T','F','C'].includes(a)))throw Error('Choose a valid answer.');score+=Number(a===q.answer);}});
 const total=items.length*(type==='sjt'?2:1);return {score,total,percent:Math.round(score/total*100),review:items};
}
