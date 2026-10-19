export const EXPERIENCE_VERSION='experience-interview-v1';
export const EXPERIENCE_FIELDS=['ownership','scope','method','finding','outcome','challenge','learning','correction'];
export const BACKGROUND_FIELDS=['education','modules','enjoyed_modules','activities','interests','motivation'];
export const BACKGROUND_QUESTIONS={modules:'List the actual modules you think are relevant to your chosen role. For each, give its name, one topic, tool or assignment you can explain, and any mark you choose to confirm. Do not guess what an employer requires.',enjoyed_modules:'Which modules did you enjoy most, and why? What topic, discussion or assignment drew you in? Tell us what you liked doing, even when it is not obviously connected to finance.',education:'Which modules, projects or pieces of university work could you explain in depth? What did you personally learn or produce, and what marks or feedback can you actually confirm?',activities:'Tell us about sport, societies, volunteering, part-time work or other responsibilities. What did you do regularly, what responsibility did you have, and what happened? Participation is different from leadership.',interests:'What do you spend time doing, reading, building or following outside your course? Give a specific example you could discuss naturally. It does not have to sound like a finance interest.',motivation:'Why are you exploring this role or sector? What experience, task, topic or conversation actually interested you? What are you still unsure about?'};
export const FIELD_LABELS={ownership:'Your own contribution',scope:'Scale and quantities',method:'How you did it',finding:'What you found or produced',outcome:'What happened next',challenge:'A difficulty or decision',learning:'What you learnt',correction:'Anything to correct in the CV?'};
const states=new Set(['answered','unknown','not_recorded','not_applicable']);
export function cvPoints(cvText){
 const all=String(cvText).split('\n').filter(x=>x.trim()).map((quote,i)=>({id:'E'+(i+1),quote}));let section='',heading='';const points=[];
 for(const x of all){const line=x.quote.trim();if(/^[A-Z &/]{4,}$/.test(line)&&line.length<65){section=line;heading='';continue;}
  if(/ — | – |\s-\s/.test(line)&&line.length<155&&!/\.(?:\s|$)/.test(line)){heading=line;continue;}
  if(!/EXPERIENCE|EMPLOYMENT|WORK|PROJECT|ACTIVIT|VOLUNT|LEADERSHIP|RESEARCH/i.test(section))continue;
  if(line.length>=40&&!/^(email|phone|tel|https?:|linkedin)/i.test(line))points.push({...x,heading:heading||section});
 }
 // Unusual CV layouts still expose exact source lines, never invented experience headings.
 return (points.length?points:all.filter(x=>x.quote.length>=55&&!/@|https?:\/\//i.test(x.quote))).slice(0,80);
}
export function recruiterQuestions(point){
 const q=point.quote,training=/train|coach|mentor/i.test(q),analysis=/analys|research|compar|model|reconcil|test|calculat|map/i.test(q);
 return {
  ownership:training?'Who asked you to train or support others? What did you personally explain or demonstrate, and what was already in place?':'What did you personally do on this task? Separate your actions from your team’s work and your supervisor’s decisions.',
  scope:training?'How many people did you work with, over what period, and how much time did you spend? Only give figures you can explain.':'What was the scale: how many items, records, companies, people or hours? What period does the number cover, and where does it come from?',
  method:analysis?'Talk me through your steps, tools and assumptions. Why did you choose that approach, and how did you check it?':'Walk me through what you actually did, in order. Which tools, instructions or checks did you use?',
  finding:analysis?'What did the analysis actually show? State the finding or output, including any limitations; a calculation or correction can be an outcome.':'What did you produce, identify or change? Describe something observable rather than saying it was successful.',
  outcome:'Who saw or used your work, and what happened afterwards? What can you personally confirm, and what do you not know?',
  challenge:'Was there a real difficulty, disagreement or decision? What happened and how did you respond? If there was none, say so.',
  learning:'What did you actually learn or do differently afterwards? Use your own view; you do not need a dramatic lesson.',
  correction:'Is any wording, date, quantity or responsibility in the quoted CV point inaccurate or overstated? State the correction, or choose not applicable.'
 };
}
export function defaultInterview(cvText,result={}){
 const points=cvPoints(cvText),preferred=result.cvPreview?.original;
 const ordered=[...points.filter(p=>p.quote===preferred),...points.filter(p=>p.quote!==preferred)];const seen=new Set(),selected=[];
 for(const p of ordered){if(seen.has(p.heading))continue;seen.add(p.heading);selected.push(p);if(selected.length===3)break;}
 for(const p of ordered)if(selected.length<3&&!selected.includes(p))selected.push(p);
 return {version:EXPERIENCE_VERSION,points:points.map(p=>({...p,critique:/\b(supported|helped|assisted)\b/i.test(p.quote)?'This describes support. Let’s establish your own actions, the scope of the work and what your contribution produced.':/\d/.test(p.quote)?'You already give a quantity. Let’s check its basis and distinguish your own work, the finding and the wider outcome.':'Let’s unpack this point into your own actions, the method, the scale and an outcome you can defend.',questions:recruiterQuestions(p)})),selectedIds:selected.map(p=>p.id),preparedBy:'question-framework'};
}
export function applyInterviewQuestions(base,generated){
 if(!Array.isArray(generated)||generated.length>5)throw Error('Invalid interview questions');const seen=new Set();
 for(const item of generated){const p=base.points.find(p=>p.id===item.sourceId);if(!p||seen.has(p.id))throw Error('Unknown CV point');seen.add(p.id);
  if(typeof item.critique!=='string'||item.critique.length>450||!item.critique.trim())throw Error('Invalid critique');
  if(/\d/.test(p.quote)&&/no (?:numbers|quantit|figures)|(?:numbers|quantit|figures) (?:are |is )?missing/i.test(item.critique))continue;
  if(!item.questions||EXPERIENCE_FIELDS.some(k=>typeof item.questions[k]!=='string'||item.questions[k].length<15||item.questions[k].length>450))throw Error('Invalid recruiter question');
  // Generated copy can only ask about the real quoted point. It never supplies a candidate answer.
  p.critique=item.critique;p.questions=Object.fromEntries(EXPERIENCE_FIELDS.map(k=>[k,item.questions[k]]));
 }
 if(seen.size)base.selectedIds=[...seen];base.preparedBy='claude';return base;
}
export function validateExperience(raw,cvText,{complete=false,probe=null}={}){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.examples)||raw.examples.length>5)throw Error('Choose up to five CV points.');
 const points=cvPoints(cvText),seen=new Set();let total=0;
 const examples=raw.examples.map(x=>{const point=points.find(p=>p.id===x.sourceId);if(!point||seen.has(point.id))throw Error('Choose a valid, distinct CV point.');seen.add(point.id);
  const answers={};for(const k of EXPERIENCE_FIELDS){const a=x.answers?.[k]||{status:'unknown',text:''};if(!states.has(a.status)||typeof a.text!=='string'||a.text.length>1800)throw Error('Each response must be at most 1,800 characters.');
   const text=a.status==='answered'?a.text.trim():'';if(complete&&a.status==='answered'&&!text)throw Error('Add an answer or choose a not-sure option.');total+=text.length;
   if(k==='scope'&&a.status==='answered'&&!['exact','estimate','not_recorded'].includes(a.numberBasis))throw Error('Tell us whether your quantities are exact, estimated or not recorded.');
   if(k==='scope'&&text&&/\d/.test(text)&&a.numberBasis==='not_recorded')throw Error('Label the numbers you gave as exact or estimated, or choose no figure recorded.');
   answers[k]={status:text?'answered':a.status==='answered'?'unknown':a.status,text,...(k==='scope'&&text?{numberBasis:a.numberBasis}:{})};
  }return {sourceId:point.id,sourceQuote:point.quote,heading:point.heading,answers};});
 const background={};for(const k of BACKGROUND_FIELDS){const a=raw.background?.[k]||{status:'unknown',text:''};if(!states.has(a.status)||typeof a.text!=='string'||a.text.length>1800)throw Error('Keep each background answer within 1,800 characters.');const text=a.status==='answered'?a.text.trim():'';if(complete&&a.status==='answered'&&!text)throw Error('Add an answer or choose a not-sure option.');background[k]={status:text?'answered':a.status==='answered'?'unknown':a.status,text};total+=text.length;}
 const followUps=[];if(raw.followUps!==undefined&&!Array.isArray(raw.followUps))throw Error('Invalid follow-up answers.');if((raw.followUps||[]).length>5)throw Error('Too many follow-up answers.');const used=new Set();for(const a of raw.followUps||[]){const q=probe?.items?.find(q=>q.id===a.id);if(!q||used.has(a.id)||!states.has(a.status)||typeof a.text!=='string'||a.text.length>1800)throw Error('Reload the follow-up questions before answering.');used.add(a.id);const text=a.status==='answered'?a.text.trim():'';if(complete&&a.status==='answered'&&!text)throw Error('Add a follow-up answer or choose a not-sure option.');followUps.push({id:q.id,sourceId:q.sourceId,question:q.question,status:text?'answered':a.status==='answered'?'unknown':a.status,text});total+=text.length;}
 if(total>20000)throw Error('Keep your additional experience details within 20,000 characters.');
 if(complete&&raw.confirmed!==true)throw Error('Confirm these details describe your own experience.');
 return {version:EXPERIENCE_VERSION,examples,background,followUps,confirmed:complete,skipped:examples.length===0&&!Object.values(background).some(a=>a.text)};
}
export function confirmedEvidence(experience){
 if(!experience?.completedAt||experience.confirmed!==true)return [];
 const cv=(experience.examples||[]).flatMap((x,i)=>EXPERIENCE_FIELDS.filter(k=>x.answers?.[k]?.status==='answered'&&x.answers[k].text).map(k=>({id:`C${i+1}_${k}`,quote:(k==='scope'&&x.answers[k].numberBasis==='estimate'?'Approximate estimate: ':'')+x.answers[k].text,origin:'student-confirmed',sourceId:x.sourceId,sourceQuote:x.sourceQuote,heading:x.heading,dimension:k})));
 const background=BACKGROUND_FIELDS.filter(k=>experience.background?.[k]?.status==='answered'&&experience.background[k].text).map(k=>({id:'B_'+k,quote:experience.background[k].text,origin:'student-confirmed',sourceId:null,sourceQuote:null,heading:k,dimension:k}));
 const followUps=(experience.followUps||[]).filter(a=>a.status==='answered'&&a.text).map(a=>({id:'F_'+a.id,quote:a.text,origin:'student-confirmed',sourceId:a.sourceId,sourceQuote:experience.examples.find(x=>x.sourceId===a.sourceId)?.sourceQuote||null,heading:'Follow-up detail',dimension:'followup',question:a.question}));
 return [...cv,...background,...followUps];
}
export function primaryExperience(experience){return {examples:experience.examples,background:experience.background};}
export function experienceEvidenceText(cvText,experience){return cvText+'\n'+confirmedEvidence(experience).map(x=>x.quote).join('\n');}
export function experienceRequired(row){return !row.input?.experience?.completedAt&&!Object.keys(row.report||{}).length;}

