import {evidenceSources} from './interview-evidence-guide.mjs';
export const TRIAL_QUESTION='Tell me about a time you used analysis to make a recommendation.';
export const TRIAL_TIP="They want a fact-based recommendation you can defend if pushed. Say what you decided, why, and what happened next.";
const analysis=/\b(?:research\w*|modelled|modeled|compared|valued|analys\w*|analyz\w*|valuation|reconcil\w*)\b/i;
const unsafe=/\b(?:cannot confirm|not confirmed|no transaction|no client|did not|no .{0,50} was confirmed)\b/i;
const spoken=s=>'I '+s.replace(/^[-•]\s*/,'').replace(/^I\s+/i,'').replace(/^./,c=>c.toLowerCase());
export function analysisGuide(cv,{preferredOrg}={}){
 const all=evidenceSources(cv).filter(s=>s.kind==='cv'),rank=s=>(analysis.test(s.text)?12:0)+(/intern|work experience/i.test(s.source)?7:0)+(/flagged|recommend\w*|selected|concluded/i.test(s.text)?6:0)+Math.min(3,(s.text.match(/\d+/g)||[]).length)+(/trained|built|led|organised|created/i.test(s.text)?2:0);
 const ranked=[...all].sort((a,b)=>rank(b)-rank(a)),source=preferredOrg?ranked.find(s=>s.source.toLowerCase().includes(preferredOrg.toLowerCase()))||ranked[0]:ranked[0];if(!source)return {source:'Your experience',beats:[{label:'Situation',text:'',gaps:[{id:'scene',prompt:'Where did this happen?'}]},{label:'Actions',text:'',gaps:[{id:'recommend',prompt:'What did you recommend?'}]},{label:'Result',text:'',gaps:[{id:'result',prompt:'What happened next?'}]},{label:'Reflection',text:'',gaps:[{id:'reflection',prompt:'What did you learn?'}]}]};
 const sentences=source.text.split(/(?<=[.!?])\s+/).filter(s=>s.trim()&&!unsafe.test(s)),result=sentences.find(s=>/\b(?:reduced|increased|saved|improved|achieved|won|retained|adopted|presented|delivered)\b/i.test(s)),actions=sentences.filter(s=>s!==result).slice(0,3).map(spoken).join(' '),outcome=!!result&&/\b(?:reduced|increased|saved|improved|achieved|won|retained|adopted)\b/i.test(result),hasDecision=/flagged|recommend\w*|selected|concluded|decided/i.test(actions);
 const redcliffe=/Redcliffe Partners/i.test(source.source)&&/12 UK software companies/i.test(source.text);
 return {id:source.id,source:source.source,point:source.text,beats:[
 {label:'Situation',text:redcliffe?'During my corporate finance internship at Redcliffe Partners, I worked on a prospective acquisition screen of UK software companies.':'My example is from '+source.source.split(/\s+[—–]\s+/)[0]+'.',gaps:[]},
 {label:'Actions',text:actions,gaps:hasDecision?[]:[{id:'recommend',prompt:'What did you recommend?'}]},
 {label:'Result',text:result?spoken(result):'',gaps:outcome?[]:[{id:'result',prompt:'What happened next?',picks:['They used it in the shortlist','Feedback I got','Not known yet']}]},
 {label:'Reflection',text:'',gaps:[{id:'reflection',prompt:'What did you learn?',picks:["What I’d do again","What I’d change"]}]}
 ]};
}
