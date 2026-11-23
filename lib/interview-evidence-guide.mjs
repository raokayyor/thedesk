import {polishFeedback} from './interview-polish.mjs';
import {chooseFramework,answerStructure} from './interview-frameworks.mjs';
// Extractive preparation: candidate facts are exact spans from authorised saved evidence.
// No model-written factual clause is accepted into a guide.
const clean=s=>String(s||'').replace(/^\s*[-•▪]\s*/,'').trim();
const split=s=>clean(s).split(/(?<=[.!?;])\s+|,\s+(?=(?:which |and |this )?(?:reduced|increased|saved|improved|resulted|achieved|retained|adopted|resolved)\b)/i).filter(Boolean);
const sameEvidence=(a,b)=>{const normal=s=>String(s||'').toLowerCase().replace(/\b(?:i|my|the|a|an|and|was|were|it|this|that)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();const x=normal(a),y=normal(b);return !!x&&!!y&&(x===y||x.includes(y)||y.includes(x));};
const cap=(s,n)=>{const words=s.split(/\s+/);return words.length>n?words.slice(0,n).join(' ')+'…':s;};
const negative=/\b(?:no |not |didn.t |unknown|unconfirmed|not known|cannot confirm|could not confirm)\b/i;
const action=/\b(?:worked|trained|built|analysed|analyzed|compared|presented|researched|organised|organized|led|managed|checked|created|identified|flagged|reconciled|recorded|recommended|helped|supported|served|caught)\b/i;
const result=/\b(?:reduced|increased|saved|improved|resulted|achieved|won|raised|retained|adopted|selected|identified|flagged|found|caught|recommended|concluded|presented|resolved)\b/i;
export function evidenceSources(cvText,deep=null,previous=[],questionSources={}){
 const sources=[];let heading='',education='';
 for(const raw of String(cvText||'').split(/\r?\n/)){const text=clean(raw);if(!text||/@|https?:/.test(text))continue;
  if(!education&&/\b(?:BSc|BA|MSc|studying|student|predicted)\b/i.test(text)&&/finance|economics|university|degree|2:1/i.test(text))education=text;
  const bullet=/^\s*[-•▪]/.test(raw);if(!bullet&&text.length<150&&!action.test(text)){heading=text;continue;}
  if(text.length<25||(!bullet&&!action.test(text)))continue;
  sources.push({id:'cv-'+sources.length,source:heading||'Your CV',text,kind:'cv'});
 }
 // Unknown answers, generated questions, scoring prose and model reports are never evidence.
 if(deep?.status==='complete')for(const [key,a]of Object.entries(deep.answers||{})){if(a?.unknown||typeof a?.text!=='string'||a.text.trim().length<20)continue;const linked=clean(questionSources[key]);const original=linked&&sources.find(s=>s.kind==='cv'&&(s.originalText||s.text)===linked);if(original){original.originalText??=original.text;original.confirmedTexts??=[];original.confirmedTexts.push(a.text.trim());original.text+='\n'+a.text.trim();}else sources.push({id:'deep-'+key,source:'Your confirmed follow-up answer',text:a.text.trim(),kind:'answer'});}
 for(const [i,a]of previous.entries()){if(typeof a==='string'&&a.trim().length>=20)sources.push({id:'earlier-'+i,source:'Your earlier interview answer',text:a.trim(),kind:'answer'});}
 if(education)sources.push({id:'education',source:'Your studies',text:education,kind:'context'});return sources.slice(0,150);
}
export function groundedSpan(text,source){return typeof text==='string'&&text.trim()&&typeof source==='string'&&source.includes(text.trim())?text.trim():null;}
export function validateGuideFact(fact,sources){const source=sources.find(s=>s.id===fact?.sourceId);const value=source&&groundedSpan(fact.text,source.text);return value?{text:value,sourceId:source.id,gap:false}:{text:'Add the detail you can support',gap:true};}
const gap=text=>({text,gap:true});
export function guideForSource(source,sources,question='',options={}){
 const original=split(source.originalText||source.text),confirmed=(source.confirmedTexts||[]).flatMap(split);const sentences=[...confirmed,...original];const actions=sentences.filter(s=>action.test(s)&&!negative.test(s));
 const preferred=/team|colleag|group|lead/i.test(question)?actions.find(s=>/train|team|colleag|led|organis|present/i.test(s)):null;const firstAction=preferred||actions[0];
 const outcome=sentences.find(s=>!sameEvidence(s,firstAction)&&result.test(s)&&!negative.test(s)&&!/^\s*(?:I )?(?:presented|recommended|identified|flagged)\b/i.test(s));
 const reflection=sentences.find(s=>/\b(?:learned|learnt|taught me|realised|realized)\b/i.test(s));
 const fact=text=>validateGuideFact({sourceId:source.id,text},sources);
 const beats=[{label:'Set the scene',...(source.source==='Your CV'||source.kind==='answer'?gap('Add where this happened and your responsibility'):factSource(source.source))},
 {label:'What you did',...(firstAction?fact(firstAction):fact(sentences[0]))},
 {label:'What changed',...(outcome?fact(outcome):gap('Add your result: what changed?'))},
 {label:'What it shows',...(reflection?fact(reflection):gap('Add what you learned'))}];
 function factSource(text){return {text,sourceId:source.id,gap:false,heading:true};}
 const answer=[];
 // Retain original wording rather than invent first-person details or implied causation.
 if(beats[0].gap)answer.push({...beats[0],beatIndex:0});else answer.push({...beats[0],prefix:'My example is from '});
 const candidates=confirmed.some(s=>action.test(s)&&!negative.test(s))?confirmed:original;const seen=new Set();const normal=s=>s.toLowerCase().replace(/^i\s+/,'').replace(/[^a-z0-9]+/g,' ').trim();const chosen=[...candidates.filter(s=>!negative.test(s)).slice(0,4),outcome,reflection].filter(Boolean).filter(s=>{const key=normal(s);if(seen.has(key))return false;seen.add(key);return true;});for(const sentence of chosen){const supported=fact(sentence);const implicit=/^(?:Worked|Trained|Built|Analysed|Analyzed|Compared|Presented|Researched|Organised|Organized|Led|Managed|Checked|Created|Identified|Flagged|Reconciled|Recommended|Helped|Supported|Served|Caught)\b/.test(sentence);answer.push({...supported,...(implicit?{text:'I '+sentence.charAt(0).toLowerCase()+sentence.slice(1),evidenceQuote:sentence}:{}),action:action.test(sentence)});}
 if(!outcome)answer.push({...gap('Your result here'),beatIndex:2});
 if(!reflection)answer.push({...gap('What you learned here'),beatIndex:3});
 const framework=chooseFramework({question,kind:options.kind});
 if(framework.key==='introduction'){
 const education=sources.find(s=>s.id==='education');
 const motivation=sources.flatMap(s=>split(s.text).map(text=>({text,sourceId:s.id}))).find(s=>/\b(?:I want|I am interested|I enjoy|I chose|my motivation)\b/i.test(s.text));
 beats.splice(0,4,{label:'Where you are now',...(education?validateGuideFact({sourceId:education.id,text:education.text},sources):gap('Add your course, university and current year'))},{label:'Relevant experience',...factSource(source.source)},{label:'Your contribution',...(firstAction?fact(firstAction):gap('Explain what you personally did'))},{label:'Why this next step',...(motivation?validateGuideFact(motivation,sources):gap('Add why this work interests you'))});
 answer.splice(0,answer.length,...beats.map((b,i)=>({...b,beatIndex:i,action:i===2})));
 }else if(framework.key!=='behavioural'&&framework.key!=='cv'){
 const prompts=framework.criteria.map(c=>({label:c.label,...gap(c.prompt)}));
 while(prompts.length<4)prompts.push({label:'Support your answer',...gap('Add a relevant detail you can support')});
 beats.splice(0,4,...prompts.slice(0,4));answer.splice(0,answer.length,...beats.map((b,i)=>({...b,beatIndex:i})));
 }
 const plan=answerStructure({question,kind:options.kind}).sections;beats.forEach((b,i)=>{b.instruction=plan[i].instruction;b.label=plan[i].label;});
 return {framework:framework.label,id:source.id,source:source.source,point:cap(firstAction||sentences[0],28),coaching:'Explain your own contribution and what changed.',beats,answer,why:'Your actions come directly from your saved evidence. Fill the gaps with facts you can support.',label:'Built from your CV · nothing made up'};
}
export function buildInterviewGuide(sources,question,{locked=false,kind='',followUpOf=null}={}){
 const q=String(followUpOf?.question||question||'').toLowerCase();const themes=/team|colleag|group|collaborat/.test(q)?/team|colleag|group|train|present|society/i:/lead|responsib/.test(q)?/train|led|organis|managed|captain|responsib/i:/pressure|priorit|setback/.test(q)?/alongside|hours|shift|deadline|pressure|balanc/i:/analys|valu|DCF|technical/.test(q)?/analys|valu|DCF|Excel|research|compar/i:/work|train|built|analys|present|research/i;
 const words=q.match(/[a-z]{5,}/g)||[];
 const ranked=sources.filter(s=>s.kind!=='context').map(s=>({s,rank:(themes.test(s.text)?20:0)+words.filter(w=>s.text.toLowerCase().includes(w)).length+(s.kind==='answer'?2:0)})).sort((a,b)=>b.rank-a.rank);
 const seen=new Set();const examples=[];for(const {s,rank}of ranked){if(rank<20||seen.has(s.text)||(followUpOf?.sourceId&&s.id!==followUpOf.sourceId))continue;seen.add(s.text);const example=guideForSource(s,sources,followUpOf?.question||question,{kind});if(followUpOf){const prior=sources.find(x=>x.kind==='answer'&&x.text===followUpOf.answer);const lines=[...split(s.text).map(text=>({text,sourceId:s.id})),...(prior?split(prior.text).map(text=>({text,sourceId:prior.id})):[])];const reasoning=/why|approach|choose|different/i.test(question);const steps=!reasoning&&!/what changed|outcome|result|what followed/i.test(question)?[['Answer the follow-up',/assum|depends|because|risk|check|reason/i,'Answer this directly: '+question],['Add a supporting detail',/example|figure|feedback|\d/i,'Use a new supporting detail from the same example'],['Explain the connection',/because|means|therefore|so that/i,'Explain why that detail supports your answer'],['State the limit or next check',/limit|uncertain|check|next time|learned/i,'Acknowledge what is unknown or what you would check']]:reasoning?[['Your decision',/decided|chose|selected|approach/i,'Which choice did you make?'],['Why you chose it',/because|reason|so that|in order/i,'Explain your actual reason for that choice'],['What followed',/reduced|increased|resulted|adopted|retained|resolved/i,'Add what happened after that choice'],['What you would change',/learned|learnt|next time|differently/i,'What would you keep or do differently?']]:[['The outcome',/reduced|increased|resulted|adopted|retained|resolved/i,'What actually changed after your work?'],['Evidence for it',/confirmed|feedback|asked me|told me|approved/i,'How do you know? Give the feedback or observable change'],['Why it mattered',/because|meant|enabled|allowed/i,'Explain why that outcome mattered'],['What you learned',/learned|learnt|next time/i,'What did that teach you?']];const used=new Set();example.beats=steps.map(([label,rule,prompt])=>{const item=lines.find(x=>rule.test(x.text)&&!negative.test(x.text)&&!used.has(x.text));if(item)used.add(item.text);return{label,...(item?validateGuideFact(item,sources):gap(prompt))}});example.answer=example.beats.map((b,i)=>({...b,beatIndex:i}));example.coaching='Answer the specific follow-up using the same example. Do not restart the whole story.';}if(locked)delete example.answer;examples.push(example);if(examples.length===2)break;}
 if(!examples.length){const plan=answerStructure({question,kind,followUpOf}),beats=plan.sections.map(s=>({...s,...gap(s.instruction)}));examples.push({id:'template',source:'Your own evidence',point:'Use the answer plan for this question',coaching:'No matching CV detail yet. Fill the gaps with facts you can support.',framework:plan.framework.label,templateOnly:true,beats,...(!locked?{answer:beats.map((b,i)=>({...b,beatIndex:i}))}:{}),why:'Answer the question directly and support each section with your own evidence.'});}
 examples.forEach(e=>{if(followUpOf){e.framework='Answer the follow-up directly';e.beats.forEach(b=>b.instruction='Add this detail to the same example; do not repeat your whole answer.');}});
 return {examples,locked,label:'Built from your CV · nothing made up',tip:followUpOf?'Answer the challenge directly. Add one new detail.':chooseFramework({question,kind}).key==='introduction'?'Lead with relevant experience, then explain why this role.':'Use this question’s structure. Keep each point specific.',tipName:'Kayyor Rao',tipPhoto:'/assets/kayyor-rao.jpg'};
}
export function assessAnswerBeats(transcript,context={}){
 const text=String(transcript||'');const lines=split(text);const framework=chooseFramework(context);
 const rules=[/\b(?:at |during |when |while |my role|my task|responsible|university|project|work|team)\b/i,/\bI\s+(?:\w+\s+){0,3}(?:trained|built|analysed|analyzed|compared|checked|decided|presented|organised|organized|led|managed|created|researched|identified|recommended|helped|supported|worked|caught)\b/i,/\b(?:as a result|this led|resulted|reduced|increased|saved|improved|achieved|adopted|retained|resolved|found|identified|flagged|recommended|concluded)\b/i,/\b(?:learned|learnt|taught me|showed me|realised|realized|would.*again|next time)\b/i];
 if(framework.key==='introduction')rules.splice(0,4,/university|studying|student|degree|BSc|Economics|Finance/i,/internship|intern|project|experience|worked/i,/\bI\b.*(?:research|compar|built|analys|flag|present|train)/i,/interested|motiv|want|because|drawn|appeal/i);
 const typeRules={technical:[/\b(?:is|means|defined|answer|would)\b/i,/because|calculate|discount|multiply|divide|step|cash flow/i,/example|project|model|valuation|suppose/i,/assum|limit|sensitiv|check|depends/i],motivation:[/interested|enjoy|want|motivat|drawn/i,/project|intern|worked|experience/i,/firm|Goldman|Barclays|research|advisory/i,/contribut|develop|learn|fit|bring/i],commercial:[/recent|announc|market|deal|rate|event/i,/because|impact|client|business|means/i,/think|view|believe|expect/i,/risk|uncertain|watch|if|however/i],reasoning:[/assum|estimate|calculate|given/i,/first|step|multiply|divide|method/i,/\d|equals|therefore/i,/check|units|roughly|reasonable/i],judgement:[/first|would|clarify/i,/risk|client|colleague|confidential/i,/escalat|manager|policy|check/i,/follow|confirm|resolved|document/i],case:[/objective|client|problem|constraint/i,/compar|option|evidence|assum/i,/recommend|because|choose/i,/risk|next|check|missing/i],followup:[/\bI\b|because|result|would/i,/example|figure|\d|feedback|observ/i,/because|reason|so that/i,/learn|limit|unknown|next|clarif/i]};if(typeRules[framework.key])rules.splice(0,4,...typeRules[framework.key]);
 const labels=answerStructure(context).sections.map(s=>s.label);const missing=['Add the situation and your responsibility.','Explain your personal action.','Explain the actual outcome or learning.','Say what you learned or what this shows.'];if(framework.key!=='behavioural')missing.splice(0,4,...answerStructure(context).sections.map(s=>s.instruction));
 const usedQuotes=new Set();const beats=rules.map((r,i)=>{const quote=lines.find(s=>r.test(s)&&!(i===2&&negative.test(s))&&!(framework.key!=='introduction'&&i===2&&usedQuotes.has(s)))||'';if(quote)usedQuotes.add(quote);return {label:labels[i],present:!!quote,quote,note:quote?'Evidence picked up in your transcript.':missing[i]};});
 return {beats,resultGapFilled:beats[2].present,resultMessage:framework.key!=='behavioural'&&framework.key!=='cv'?`${beats.filter(b=>b.present).length} of 4 answer sections supported in your transcript`:beats[2].present?'You said what changed':'You stopped before the result',scope:'Transcript structure check; quoted words are self-reported, not independently verified.'};
}

// This view retains scores but never presents a model-invented personal claim.
export function groundedFeedbackView(feedback,transcript,context={}){
 const review=assessAnswerBeats(transcript,context),missing=review.beats.filter(b=>!b.present);const quote=s=>groundedSpan(s,transcript)||'';
 const strengths=(feedback.strengths||[]).map(s=>({point:'Keep this specific evidence from your answer.',quote:quote(s.quote)})).filter(s=>s.quote);
 const fixes=(feedback.fixes||[]).map((f,i)=>({fix:missing[i]?.note||'Connect this point directly to the question and explain your reasoning.',quote:quote(f.quote)}));
 const nextQuestion={technical:'Which assumptions does your explanation depend on, and how would you check them?',motivation:'Which experience best supports that motivation, and why?',commercial:'What evidence would change your view?',reasoning:'How would you check whether your result is reasonable?',judgement:'What would you do if that first step did not resolve the issue?',case:'What is the main risk in your recommendation, and how would you check it?'}[chooseFramework(context).key];
 const {frameworkChecks,framework,employerPractice,dimensionCoaching,answerEdits,...safe}=feedback;const polished=polishFeedback(feedback,transcript,context);return {...safe,...polished,verdictTitle:feedback.overall>=75?'A clear answer. Now strengthen the detail.':feedback.overall>=50?'A useful starting point, with gaps to close.':'Your evidence needs to come through more clearly.',verdict:'This score reflects the answer you gave. Use the transcript checks to see what was clear and what still needs evidence.',strengths,fixes:polished.dimensions.map(d=>({title:d.dimension,fix:d.action,why:d.why,quote:d.quote})),strongerOpening:'',beatReview:review,...(feedback.followUp?{followUp:{question:nextQuestion|| (chooseFramework(context).key==='introduction'?'Which part of that experience most influenced your interest in this role, and why?':review.resultGapFilled?'Why did you choose that approach, and what would you do differently?':'What changed as a result of your work?'),why:'Explain your own evidence in more detail.'}}:{})};
}

export function applyConfirmedGuideGaps(guide,confirmations=[]){
 const copy=structuredClone(guide);
 for(const e of copy.examples||[])for(const [index,beat]of e.beats.entries()){
  const confirmation=confirmations.find(c=>c.sourceId===e.id&&c.index===index&&typeof c.text==='string'&&c.text.trim().length>=10);if(!confirmation)continue;if(index===2&&/^(?:What changed|Result|Outcome)$/.test(beat.label)&&sameEvidence(confirmation.text,e.beats[1]?.text))continue;
  const fact={text:confirmation.text.trim(),gap:false,confirmed:true,sourceId:'student-confirmation'};e.beats[index]={label:beat.label,...fact};
  if(e.answer)e.answer=e.answer.map(s=>s.gap&&s.beatIndex===index?{...fact,action:index===1}:s);
 }
 return copy;
}
