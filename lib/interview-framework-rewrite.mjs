import {answerStructure} from './interview-frameworks.mjs';
import {buildInterviewGuide} from './interview-evidence-guide.mjs';
import {checkAnswerBeats} from './interview-beat-checks.mjs';
import {CV_DISCLAIMER,WEAK_FILLER} from './answer-rewrite.mjs';
export function rewriteSections(input){return answerStructure(input).sections.map((section,i)=>({key:'section-'+i,label:section.label,instruction:section.instruction}));}
export function frameworkRewriteFallback(input,evidence){
 const sections=rewriteSections(input),framework=answerStructure(input).framework,groups=new Map();
 for(const e of evidence){if(!e.org||e.org==='Your confirmed answer'||CV_DISCLAIMER.test(e.text))continue;const g=groups.get(e.org)||{id:e.id,source:e.org+' — '+(e.role||'Project'),text:'',kind:'cv',ids:[],confirmedTexts:[]};g.text+=(g.text?' ':'')+e.text;g.ids.push(e.id);groups.set(e.org,g);}
 const named=[...groups.values()].filter(g=>input.transcript.toLowerCase().includes(g.source.split(' — ')[0].toLowerCase()));let sources=named.length?named:[...groups.values()];
 if(named.length===1){named[0].ids.push('T');named[0].text+=' '+input.transcript;named[0].confirmedTexts=String(input.transcript).split(/(?<=[.!?])\s+/).filter(t=>!CV_DISCLAIMER.test(t)&&!WEAK_FILLER.test(t));}
 const personal=['behavioural','cv','motivation'].includes(framework.key),guide=personal?buildInterviewGuide(sources,input.question,{kind:input.kind,firm:input.firm,role:input.role}):null,checks=checkAnswerBeats(input.transcript,input).beats;
 const example=guide?.examples[0],parts=sections.map((section,i)=>{const beat=example?.beats[i],check=checks[i];const value=beat&&!beat.gap?beat.text:!personal&&check?.present?check.quote:null;const ids=beat?sources.find(s=>s.id===example.id)?.ids||[]:['T'];return {beat:section.key,text:value||(/result|outcome/i.test(section.label)?'Add your actual result':/reflect|learn/i.test(section.label)?'Add what you learned':section.instruction.slice(0,40)),gap:!value,sources:value?ids:[],change:value?Math.min(3,i+1):null};});
 const changes=parts.filter(p=>p.change).map(p=>({n:p.change,reason:'Use your own evidence for '+sections.find(s=>s.key===p.beat).label.toLowerCase()+'.'})).filter((p,i,a)=>a.findIndex(x=>x.n===p.n)===i);
 return {ok:true,parts,changes,words:parts.filter(p=>!p.gap).map(p=>p.text).join(' ').split(/\s+/).length,source:'fallback',sections,framework:framework.key};
}
export function frameworkPrompt(base,input){const sections=rewriteSections(input);return base.replace(/^- Reuse their own introduction sentence.*$/m,'').replace(/^- Use beats:.*$/m,'- Use exactly these four question-specific sections: '+sections.map(s=>s.key+' = '+s.label+' ('+s.instruction+')').join('; ')).replace(/^- For a banking introduction.*$/m,'- Answer this actual question. Do not add an introduction or why-firm ending unless the question calls for it.').replace(/^- Merge hours into the activity:.*$/m,'- Keep the context with this one example. Never add a different CV experience simply to fill space.').replace(/^- At most THREE sentences.*$/m,'- Use one relevant example, with a short section for each beat.');}
