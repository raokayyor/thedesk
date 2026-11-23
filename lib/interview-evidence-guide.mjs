// Extractive preparation: candidate facts are exact spans from authorised saved evidence.
// No model-written factual clause is accepted into a guide.
const clean=s=>String(s||'').replace(/^\s*[-•▪]\s*/,'').trim();
const split=s=>clean(s).split(/(?<=[.!?])\s+/).filter(Boolean);
const cap=(s,n)=>{const words=s.split(/\s+/);return words.length>n?words.slice(0,n).join(' ')+'…':s;};
const negative=/\b(?:no |not |didn.t |unknown|unconfirmed|not known|cannot confirm|could not confirm)\b/i;
const action=/\b(?:I |worked|trained|built|analysed|analyzed|compared|presented|researched|organised|organized|led|managed|checked|created|identified|flagged|reconciled|recommended|helped|supported|served|caught)\b/i;
const result=/\b(?:reduced|increased|saved|improved|resulted|achieved|won|raised|retained|adopted|selected|identified|flagged|found|caught|recommended|concluded|presented|resolved)\b/i;
export function evidenceSources(cvText,deep=null,previous=[]){
 const sources=[];let heading='';
 for(const raw of String(cvText||'').split(/\r?\n/)){const text=clean(raw);if(!text||/@|https?:/.test(text))continue;
  const bullet=/^\s*[-•▪]/.test(raw);if(!bullet&&text.length<150&&!action.test(text)){heading=text;continue;}
  if(text.length<25||(!bullet&&!action.test(text)))continue;
  sources.push({id:'cv-'+sources.length,source:heading||'Your CV',text,kind:'cv'});
 }
 // Unknown answers, generated questions, scoring prose and model reports are never evidence.
 if(deep?.status==='complete')for(const [key,a]of Object.entries(deep.answers||{})){if(a?.unknown||typeof a?.text!=='string'||a.text.trim().length<20)continue;sources.push({id:'deep-'+key,source:'Your confirmed follow-up answer',text:a.text.trim(),kind:'answer'});}
 for(const [i,a]of previous.entries()){if(typeof a==='string'&&a.trim().length>=20)sources.push({id:'earlier-'+i,source:'Your earlier interview answer',text:a.trim(),kind:'answer'});}
 return sources.slice(0,150);
}
export function groundedSpan(text,source){return typeof text==='string'&&text.trim()&&typeof source==='string'&&source.includes(text.trim())?text.trim():null;}
export function validateGuideFact(fact,sources){const source=sources.find(s=>s.id===fact?.sourceId);const value=source&&groundedSpan(fact.text,source.text);return value?{text:value,sourceId:source.id,gap:false}:{text:'Add the detail you can support',gap:true};}
const gap=text=>({text,gap:true});
export function guideForSource(source,sources){
 const sentences=split(source.text);const actions=sentences.filter(s=>action.test(s));
 const outcome=sentences.find(s=>result.test(s)&&!negative.test(s));
 const reflection=sentences.find(s=>/\b(?:learned|learnt|taught me|realised|realized)\b/i.test(s));
 const fact=text=>validateGuideFact({sourceId:source.id,text},sources);
 const beats=[{label:'Set the scene',...(source.source==='Your CV'||source.kind==='answer'?gap('Add where this happened and your responsibility'):factSource(source.source))},
 {label:'What you did',...(actions[0]?fact(actions[0]):fact(sentences[0]))},
 {label:'What changed',...(outcome?fact(outcome):gap('Add your result: what changed?'))},
 {label:'What it shows',...(reflection?fact(reflection):gap('Add what you learned'))}];
 function factSource(text){return {text,sourceId:source.id,gap:false,heading:true};}
 const answer=[];
 // Retain original wording rather than invent first-person details or implied causation.
 if(beats[0].gap)answer.push({...beats[0],beatIndex:0});else answer.push({...beats[0],prefix:'My example is from '});
 for(const sentence of sentences.filter(s=>!negative.test(s)).slice(0,6)){const supported=fact(sentence);const implicit=/^(?:Worked|Trained|Built|Analysed|Analyzed|Compared|Presented|Researched|Organised|Organized|Led|Managed|Checked|Created|Identified|Flagged|Reconciled|Recommended|Helped|Supported|Served|Caught)\b/.test(sentence);answer.push({...supported,...(implicit?{text:'I '+sentence.charAt(0).toLowerCase()+sentence.slice(1),evidenceQuote:sentence}:{}),action:action.test(sentence)});}
 if(!outcome)answer.push({...gap('Your result here'),beatIndex:2});
 if(!reflection)answer.push({...gap('What you learned here'),beatIndex:3});
 return {id:source.id,source:source.source,point:cap(actions[0]||sentences[0],28),coaching:'Explain your own contribution and what changed.',beats,answer,why:'Your actions come directly from your saved evidence. Fill the gaps with facts you can support.',label:'Built from your CV · nothing made up'};
}
export function buildInterviewGuide(sources,question,{locked=false}={}){
 const q=String(question||'').toLowerCase();const themes=/team|colleag|group|collaborat/.test(q)?/team|colleag|group|train|present|society/i:/lead|responsib/.test(q)?/train|led|organis|managed|captain|responsib/i:/pressure|priorit|setback/.test(q)?/alongside|hours|shift|deadline|pressure|balanc/i:/analys|valu|DCF|technical/.test(q)?/analys|valu|DCF|Excel|research|compar/i:/work|train|built|analys|present|research/i;
 const words=q.match(/[a-z]{5,}/g)||[];
 const ranked=sources.map(s=>({s,rank:(themes.test(s.text)?20:0)+words.filter(w=>s.text.toLowerCase().includes(w)).length+(s.kind==='answer'?2:0)})).sort((a,b)=>b.rank-a.rank);
 const seen=new Set();const examples=[];for(const {s,rank}of ranked){if(rank<20||seen.has(s.text))continue;seen.add(s.text);const example=guideForSource(s,sources);if(locked)delete example.answer;examples.push(example);if(examples.length===2)break;}
 return {examples,locked,label:'Built from your CV · nothing made up',tip:'Your own action, then the result. Leave unknown details as gaps.',tipName:'Kayyor Rao',tipPhoto:'/assets/kayyor-rao.jpg'};
}
export function assessAnswerBeats(transcript){
 const text=String(transcript||'');const lines=text.split(/(?<=[.!?])\s+|\n/).filter(Boolean);
 const rules=[/\b(?:at |during |when |while |my role|my task|responsible|university|project|work|team)\b/i,/\bI\s+(?:\w+\s+){0,3}(?:trained|built|analysed|analyzed|compared|checked|decided|presented|organised|organized|led|managed|created|researched|identified|recommended|helped|supported|worked|caught)\b/i,/\b(?:as a result|this led|resulted|reduced|increased|saved|improved|achieved|adopted|retained|resolved|found|identified|flagged|recommended|concluded|learned|learnt)\b/i,/\b(?:learned|learnt|taught me|showed me|realised|realized|would.*again|next time)\b/i];
 const labels=['Set the scene','What you did','What changed','What it shows'];const missing=['Add the situation and your responsibility.','Explain your personal action.','Explain the actual outcome or learning.','Say what you learned or what this shows.'];
 const beats=rules.map((r,i)=>{const quote=lines.find(s=>r.test(s)&&!(i===2&&negative.test(s)))||'';return {label:labels[i],present:!!quote,quote,note:quote?'Evidence picked up in your transcript.':missing[i]};});
 return {beats,resultGapFilled:beats[2].present,resultMessage:beats[2].present?'You said what changed':'You stopped before the result',scope:'Transcript structure check; quoted words are self-reported, not independently verified.'};
}

// This view retains scores but never presents a model-invented personal claim.
export function groundedFeedbackView(feedback,transcript){
 const review=assessAnswerBeats(transcript),missing=review.beats.filter(b=>!b.present);const quote=s=>groundedSpan(s,transcript)||'';
 const strengths=(feedback.strengths||[]).map(s=>({point:'Keep this specific evidence from your answer.',quote:quote(s.quote)})).filter(s=>s.quote);
 const fixes=(feedback.fixes||[]).map((f,i)=>({fix:missing[i]?.note||'Connect this point directly to the question and explain your reasoning.',quote:quote(f.quote)}));
 const {frameworkChecks,framework,employerPractice,...safe}=feedback;return {...safe,verdictTitle:feedback.overall>=75?'A clear answer. Now strengthen the detail.':feedback.overall>=50?'A useful starting point, with gaps to close.':'Your evidence needs to come through more clearly.',verdict:'This score reflects the answer you gave. Use the transcript checks to see what was clear and what still needs evidence.',strengths,fixes,strongerOpening:'',beatReview:review,...(feedback.followUp?{followUp:{question:review.resultGapFilled?'Why did you choose that approach, and what would you do differently?':'What changed as a result of your work?',why:'Explain your own evidence in more detail.'}}:{})};
}

export function applyConfirmedGuideGaps(guide,confirmations=[]){
 const copy=structuredClone(guide);
 for(const e of copy.examples||[])for(const [index,beat]of e.beats.entries()){
  const confirmation=confirmations.find(c=>c.sourceId===e.id&&c.index===index&&typeof c.text==='string'&&c.text.trim().length>=10);if(!confirmation)continue;
  const fact={text:confirmation.text.trim(),gap:false,confirmed:true,sourceId:'student-confirmation'};e.beats[index]={label:beat.label,...fact};
  if(e.answer)e.answer=e.answer.map(s=>s.gap&&s.beatIndex===index?{...fact,action:index===1}:s);
 }
 return copy;
}
