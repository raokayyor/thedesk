import {answerStructure} from './interview-frameworks.mjs';
import {rewriteSections,frameworkRewriteFallback,frameworkPrompt,unsupportedFrameworkClaims} from './interview-framework-rewrite.mjs';
import {getEvidenceCatalog} from './full-cycle-contract.mjs';
import {REWRITE_SYSTEM,REWRITE_SCHEMA,rewritePrompt,validateRewrite,fallbackRewrite,toClient,WEAK_FILLER} from './answer-rewrite.mjs';

// Preserve assessment catalogue IDs. Split multiline CV paragraphs into independently
// citable sentences; sub-IDs retain the parent catalogue ID for diagnostics.
export function rewriteEvidence(cv,confirmed=[]){
 const evidence=[];let kind='',org='',role='';
 for(const item of getEvidenceCatalog(String(cv||''))){
  const line=item.quote.trim();if(!line||/@|https?:/.test(line))continue;
  if(/^(EDUCATION|EXPERIENCE|PROJECTS|ACTIVITIES|SKILLS)$/i.test(line)){kind={EDUCATION:'education',EXPERIENCE:'experience',PROJECTS:'project',ACTIVITIES:'activity',SKILLS:''}[line.toUpperCase()];org='';role='';continue;}
  if(!kind)continue;
  if(kind==='education'){evidence.push({id:item.id,kind,text:line});continue;}
  const heading=line.match(/^(.+?)\s+[—–-]\s+(.+)$/);
  if(heading){org=heading[1];role=heading[2].split(',')[0];if(kind==='experience'&&/part.time|team member/i.test(role))kind='activity';continue;}
  if(!org)continue;
  const lines=line.split(/(?<=[.!?])\s+/).filter(Boolean);
  lines.forEach((text,i)=>evidence.push({id:item.id+(lines.length>1?'.'+(i+1):''),catalogueId:item.id,kind,org,role,text}));
 }
 confirmed.forEach((item,i)=>{const text=typeof item==='string'?item:item?.text;if(typeof text!=='string'||!text.trim())return;const linked=item?.source&&evidence.find(e=>item.source.includes(e.text));evidence.push({id:item?.storyFactId?'story-'+item.storyFactId:'C'+(i+1),...(item?.storyFactId?{storyFactId:item.storyFactId}:{}),kind:linked?.kind||'activity',text,org:linked?.org||'Your confirmed answer',...(linked?.role?{role:linked.role}:{})});});
 return evidence;
}

export function rewriteWeakPhrases(feedback){
 return [...new Set([...(feedback.dimensions||[]).filter(d=>d.score<70).map(d=>d.quote),...(feedback.improvement?.fixes||[]).map(f=>f.quote)].filter(s=>typeof s==='string'&&s.trim().length>5))];
}

export async function generateAnswerRewrite(input,evidence,feedback,{client,model}){
 const plan=answerStructure(input),introQuestion=plan.framework.key==='introduction',sections=introQuestion?null:rewriteSections(input),schema=introQuestion?REWRITE_SCHEMA:structuredClone(REWRITE_SCHEMA);if(sections)schema.properties.parts.items.properties.beat.enum=sections.map(s=>s.key);const prompt=rewritePrompt(input,evidence),preparedPrompt=introQuestion?prompt:frameworkPrompt(prompt,input);const weakPhrases=rewriteWeakPhrases(feedback);let raw;
 try{const response=await client.messages.create({model,temperature:0,max_tokens:1800,system:REWRITE_SYSTEM,tools:[{name:'submit_rewrite',description:'Rewrite the answer using cited evidence',input_schema:schema}],tool_choice:{type:'tool',name:'submit_rewrite'},messages:[{role:'user',content:preparedPrompt+'\nDo not retain sentences containing these weak phrases from the feedback: '+JSON.stringify(weakPhrases)+'\nNever end on generic interest or reputation filler. Deduplicate gaps; maximum two.'}]});raw=response.content.find(c=>c.type==='tool_use'&&c.name==='submit_rewrite')?.input;}catch(error){console.info('desk rewrite provider failure',JSON.stringify({reason:error?.name||'provider_error',status:error?.status||null}));}
 let rw=validateRewrite(raw,{...input,evidence,weakPhrases,structuredSections:!introQuestion});if(!introQuestion&&rw.words>=35&&!rw.diagnostics?.some(d=>/unsupported/.test(d.reason)))rw.ok=true;
 // A long paraphrase of weak speech is not a fix. Where CV evidence exists,
 // require an actual CV action rather than accepting generic transcript padding.
 const intro=/introduction|introduce|walk.*cv/i.test(input.question),cvAction=evidence.some(e=>e.kind==='experience'&&/researched|flagged|analysed|reconciled|built/i.test(e.text));
 const spoken=rw.parts.filter(p=>!p.gap).map(p=>p.text).join(' '),numberedActions=evidence.filter(e=>e.kind==='experience'&&/^(?:Researched|Flagged)\s+\d+/i.test(e.text)).slice(0,2);
 const numberNormal=s=>s.toLowerCase().replace(/\btwelve\b/g,'12').replace(/\bfour\b/g,'4');
 const omittedAction=numberedActions.some(e=>!numberNormal(spoken).includes(e.text.match(/\d+/)[0]));
 const unrelatedProject=intro&&cvAction&&evidence.some(e=>e.kind==='project'&&e.org&&spoken.includes(e.org.split(' ')[0])&&!input.transcript.includes(e.org.split(' ')[0]));
 if(!introQuestion){const claims=unsupportedFrameworkClaims(rw.parts,input,evidence);if(claims.length){rw.ok=false;rw.failure='unsupported_personal_claim';rw.diagnostics=[...(rw.diagnostics||[]),...claims];}}
 const validation=rw;
 if(!rw.ok||(intro&&cvAction&&(omittedAction||unrelatedProject||!rw.parts.some(p=>!p.gap&&evidence.some(e=>e.org&&p.text.includes(e.org)))))||rw.parts.some(p=>!p.gap&&WEAK_FILLER.test(p.text)))rw=introQuestion?fallbackRewrite({...input,evidence,weakPhrases}):frameworkRewriteFallback(input,evidence);
 console.info('desk rewrite validation',JSON.stringify({source:rw.source,ok:validation.ok,words:rw.words,failure:validation.failure||null,issues:(validation.diagnostics||[]).map(d=>({...d,...(d.token?{token:String(d.token).slice(0,40)}:{})}))}));
 const result=rewriteClient(rw);if(sections){result.sections=sections;result.framework=plan.framework.key;}result.parts=result.parts.map(p=>{const facts=evidence.filter(e=>e.storyFactId&&p.sources?.includes(e.id));return facts.length?{...p,storyFactIds:facts.map(f=>f.storyFactId)}:p;});return result;
}

export function rewriteClient(rw){
 const client=toClient(rw),annotations=client.changes.map(c=>({marker:c.n,reason:c.reason,dimension:c.n===1?'structure':c.n===2?'evidence':'relevance',text:client.parts.find(p=>p.change===c.n)?.text||''}));
 return {...client,parts:client.parts.map((p,i)=>({...p,id:p.gap?'gap-'+i:undefined,changed:!!p.change,marker:p.change||undefined})),annotations,wordCount:client.words,target:'60–90 seconds',note:'Read it aloud, fill the gaps and make it sound like you.',label:'Your answer, fixed',scoreNote:'80+ is the practice target, not a new score.',sourceLabel:'Built from your transcript and relevant CV evidence · nothing made up'};
}
