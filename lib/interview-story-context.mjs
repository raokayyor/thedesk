import {factKind} from './story-fact-rules.mjs';
export function linkedStoryDetails(catalogue,facts,evidenceKey,questionFactIds=[]){
 return facts.flatMap(f=>{const linked=catalogue.find(e=>e.org&&f.evidence_ids?.includes(evidenceKey(e.org)));if(!linked&&!questionFactIds.includes(String(f.id)))return [];return [{text:f.answer,storyFactId:f.id,priority:3,questionScoped:questionFactIds.includes(String(f.id)),prompt:f.prompt,org:linked?.org,kind:linked?.kind,role:linked?.role,source:linked?.text||f.prompt}];});
}
export function spokenOutcome(transcript){
 const text=String(transcript||'');if(/\b(?:my )?grades? (?:were|was|are|stayed|remained) (?:fine|okay|ok|good|on track)\b/i.test(text))return {text:'I kept my grades on track.',prompt:'Add your actual grade?'};
 const sentence=text.split(/(?<=[.!?])\s+/).find(s=>/\b(?:I|my|we)\b/i.test(s)&&/\b(?:passed|achieved|improved|reduced|saved|completed|met the deadline|finished on time|kept .{0,20}on track)\b/i.test(s)&&!/not|didn.t|never/i.test(s));return sentence?{text:sentence.trim()}:null;
}
export function prioritiseStoryRewrite(rewrite,input,evidence){
 if(!rewrite?.parts)return rewrite;const behavioural=rewrite.framework==='behavioural'||rewrite.sections?.[2]?.label==='Result';
 const first=rewrite.parts.find(p=>!p.gap&&p.sources?.length),org=evidence.find(e=>first?.sources?.includes(e.id)&&e.org)?.org||rewrite.parts.find(p=>p.org)?.org;
 const finish=parts=>({...rewrite,parts,text:parts.map(p=>p.gap?'['+p.text+']':p.text).join(' '),words:parts.filter(p=>!p.gap).map(p=>p.text).join(' ').split(/\s+/).length,changes:[...new Set(parts.map(p=>p.change).filter(Boolean))].map(n=>rewrite.changes?.find(c=>c.n===n)||{n,reason:'Uses your saved story detail or the outcome you stated.'})});
 const saved=evidence.filter(e=>e.priority>=2&&(!org||e.org===org||e.questionScoped));let parts=[...rewrite.parts];
 if(!behavioural){for(const fact of saved){const kind=factKind(fact.sourcePrompt),key=kind==='firm'?'why':'action';if(kind!=='firm'&&org&&fact.org!==org&&!fact.questionScoped)continue;if(parts.some(p=>!p.gap&&p.text.toLowerCase().includes(fact.text.toLowerCase())))continue;parts=parts.filter(p=>!(p.beat===key&&(p.gap||p.sources?.includes('T'))));parts.push({beat:key,text:/^(?:I|My|We|The)\b/i.test(fact.text)?fact.text:'I '+fact.text[0].toLowerCase()+fact.text.slice(1),gap:false,sources:[fact.id],change:key==='why'?3:2,storyFactIds:fact.storyFactId?[fact.storyFactId]:[]});}const order={who:0,experience:1,action:2,why:3};parts.sort((a,b)=>(order[a.beat]??2)-(order[b.beat]??2));return finish(parts);}

 for(const [key,kind]of [['section-0','context'],['section-1','decision'],['section-2','outcome'],['section-3','reflection']]){const matches=saved.filter(e=>factKind(e.sourcePrompt)===kind);if(!matches.length)continue;const unique=[...new Map(matches.map(e=>[e.text.toLowerCase(),e])).values()];parts=parts.filter(p=>p.beat!==key);parts.push(...unique.map(e=>({beat:key,text:/^(?:I|My|We|The)\b/i.test(e.text)?e.text:'I '+e.text[0].toLowerCase()+e.text.slice(1),gap:false,sources:[e.id],change:key==='section-1'?2:3,storyFactIds:e.storyFactId?[e.storyFactId]:[]})));}
 const outcome=spokenOutcome(input.transcript);if(outcome&&!saved.some(e=>factKind(e.sourcePrompt)==='outcome')){parts=parts.filter(p=>p.beat!=='section-2');parts.push({beat:'section-2',text:outcome.text,gap:false,sources:['T'],change:3},...(outcome.prompt?[{beat:'section-2',text:outcome.prompt,gap:true,sources:[],change:null}]:[]));}
 parts.sort((a,b)=>a.beat.localeCompare(b.beat));return finish(parts);
}
