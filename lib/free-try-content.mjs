import {evidenceSources,buildInterviewGuide} from './interview-evidence-guide.mjs';
import {whyFirmDraft} from './why-firm.mjs';
import {WHY_FIRM,whyFirmFor} from '../data/why-firm.mjs';
import {publicPractice,markPractice} from './aptitude-practice.mjs';
import {SCENARIOS} from './assessment-centre.mjs';

export const FREE_TOOLS={interview:'Interview',application:'Why this firm',cv:'CV line',sjt:'SJT',verbal:'Verbal',group:'Group',firm:'Firm pack',crib:'Crib sheet'};
export const freeToolUrl=key=>'/free-try.html?tool='+key;
export const LEADERSHIP_QUESTION='Tell me about a time you led others. What did you decide and how did they respond?';
export const BALANCING_QUESTION='Tell me about a time you managed competing responsibilities. What did you do and what changed?';
const clean=s=>String(s||'').trim();
const sentence=s=>{s=clean(s).replace(/^[-•]\s*/,'');return s? s[0].toUpperCase()+s.slice(1).replace(/[;,:]$/,'')+(/[.!?]$/.test(s)?'':'.'):'';};
export function freeTryContext(ctx,tool){
 const sources=evidenceSources(ctx.cv),firm=ctx.sample?'General':ctx.profile?.targetFirm||'General';
 const question=ctx.question||LEADERSHIP_QUESTION;
 const guide=buildInterviewGuide(sources,question,{kind:'competency',firm,role:ctx.profile?.targetSector||''});
 const cvLine=ctx.row.result?.weakLines?.[0]?.original||ctx.row.result?.cvPreview?.original||sources.find(s=>s.kind==='cv')?.text||'';
 const pack=whyFirmFor(firm),practice=['sjt','verbal'].includes(tool)?publicPractice(false):null;
 return {tool,title:FREE_TOOLS[tool],sample:ctx.sample,firm,question,guide:guide.examples[0],cvLine,
  firms:tool==='application'?Object.entries(WHY_FIRM).map(([key,p])=>({key,label:p.label})):undefined,
  quiz:tool==='sjt'?practice.SJT.items:tool==='verbal'?practice.VERBAL.passages.flatMap(p=>p.statements.map(s=>({...s,passage:p.text}))):undefined,
  content:tool==='firm'?{title:pack?.label||'General interview preparation',lines:pack?pack.hooks.filter(h=>!h.research).slice(0,2).map(h=>h.fact):['Know what your target team does and who its clients are.','Connect one example from your own CV to the role.'],tip:pack?.tip||'They want to know why this work fits you. Use a real example.',source:pack?.source}:tool==='group'?{title:SCENARIOS.harbour.title,brief:SCENARIOS.harbour.brief,options:SCENARIOS.harbour.options}:undefined};
}
export function quizWin(tool,answers){
 const marked=markPractice(tool,answers,false),items=marked.review;
 const right=items.filter((q,i)=>tool==='sjt'?answers[i]?.most===q.best&&answers[i]?.least===q.worst:answers[i]===q.answer).length;
 const miss=items.findIndex((q,i)=>tool==='sjt'?answers[i]?.most!==q.best||answers[i]?.least!==q.worst:answers[i]!==q.answer);
 const index=miss<0?0:miss,q=items[index];
 return {title:FREE_TOOLS[tool],tag:right+'/5 · '+(miss<0?'Keep this approach':'Here’s one to revisit'),before:tool==='sjt'?q.options[answers[index]?.most]||'No most-effective action chosen':({T:'True',F:'False',C:'Cannot say'})[answers[index]]||'No answer',after:tool==='sjt'?q.options[q.best]:({T:'True',F:'False',C:'Cannot say'})[q.answer],note:tool==='sjt'?q.why[q.best]:q.why,question:q.scenario||q.text||q.statement,score:right,total:5,review:marked};
}
export function contentWin(ctx,tool,input={}){
 const c=freeTryContext(ctx,tool),sources=evidenceSources(ctx.cv);
 if(tool==='application'){
  const firm=input.firm||c.firm,pack=whyFirmFor(firm);if(!pack)throw Object.assign(Error('Choose one firm.'),{status:400});
  const draft=whyFirmDraft({firm,sources,reason:clean(input.text).slice(0,700)});
  return {title:'Why '+pack.label,tag:'Generic → Specific',before:'I want to work at '+pack.label+' because of its reputation.',parts:draft.parts,after:draft.text,hook:draft.parts[0].text,note:'Your draft, not your final. Check the personal reason is true before using it.',firm:pack.label};
 }
 if(tool==='cv'){
  const original=clean(input.text||c.cvLine);if(original.length<15||original.length>1600)throw Object.assign(Error('Add one CV line (15–1,600 characters).'),{status:400});
  const detail=clean(input.detail).slice(0,1000);
  let line=original.replace(/^[-•]\s*/,'').replace(/^I\s+/i,'').replace(/^responsible for\s+/i,'').replace(/^helped (?:with|to)\s+/i,'Contributed to ').replace(/^worked on\s+/i,'Contributed to ');
  return {title:'Your CV line, fixed',tag:detail?'Task → Evidence':'Clearer wording',before:original,after:sentence(line)+(detail?' '+sentence(detail):''),note:detail?'Built only from your line and the detail you added. Check it is accurate.':'Wording cleaned. Add a real result when you have one; no achievement has been invented.'};
 }
 if(tool==='group')return {title:'Your group opening',tag:'Opinion → Structured contribution',before:clean(input.text)||'I think option B is best.',after:'I’d compare the options on return, timing and risk. Drive-thrus cost £25m, leaving £15m of the £40m budget. But planning is uncertain for a third of the sites, so I’d test that risk before deciding.',note:'Worked example from the fictional case, not a claim about your experience. Invite another view before the group decides.'};
 if(tool==='firm')return {title:c.content.title,tag:'Your firm preparation',before:'Why this firm?',after:c.content.lines.join(' '),note:c.content.tip,source:c.content.source};
 if(tool==='crib'){
  const guide=buildInterviewGuide(sources,'Give me a brief introduction and explain which experience is most relevant to this role.',{kind:'cv',firm:c.firm,role:ctx.profile?.targetSector||'finance'}).examples[0];
  return {title:'Your pocket crib sheet',tag:'CV → Interview prompts',before:'Tell me about yourself.',parts:guide.beats.map(b=>({text:b.text,gap:b.gap,label:b.label})),after:guide.beats.map(b=>b.gap?'['+b.text+']':b.text).join(' '),note:'Built from your CV. Fill amber gaps with facts you can support; say it in your own words.'};
 }
 throw Object.assign(Error('Choose a free tool.'),{status:400});
}
