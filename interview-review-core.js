(() => {
 function reviewTranscript(text,question,role='the role'){
  const sentences=String(text).trim().split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(Boolean);
  const points=[];
  const team=sentences.find(s=>/\b(we|our team|the team)\b/i.test(s)&&! /\bI\s+(analysed|analyzed|led|built|checked|decided|presented|researched|recommended|compared|tested|created)\b/i.test(s));
  const vague=sentences.find(s=>/\b(helped|assisted|supported|involved|various|a lot|really good|valuable experience)\b/i.test(s));
  const action=sentences.find(s=>/\bI\s+(analysed|analyzed|led|built|checked|decided|presented|researched|recommended|compared|tested|created)\b/i.test(s));
  if(team&&!action)points.push({quote:team,comment:'This describes the team. Explain the part you personally owned.',suggestion:'“My responsibility was [your specific task]. I [the action you actually took], and [what happened next].”'});
  if(vague&&vague!==team)points.push({quote:vague,comment:'Make the activity concrete: what did you do, using what information or method?',suggestion:'“I [specific action] using [tool, source or method], which showed [your actual finding].”'});
  if(action)points.push({quote:action,comment:'Keep this personal action. Follow it with the finding, decision or outcome you can support.',suggestion:'“That led to [the actual finding or outcome]. I checked it by [what you really did to verify it].”'});
  if(!points.length)points.push({quote:sentences[0]||'',comment:'Give this point a concrete example, then explain your reasoning and conclusion.',suggestion:'“One example is [a real situation]. My part was [your responsibility]. The main thing I learned was [your actual learning].”'});
  let starters;
  if(['technical','case','news'].includes(question.kind))starters=['“The key issue is [your explanation in plain English].”','“My starting assumption is [assumption]. If that changes, [how your conclusion changes].”','“For this role, that matters because [specific task or client impact].”'];
  else if(question.kind==='motivation')starters=['“I’m interested in this work because [a specific part of the role], which connects to [your real experience].”','“One researched reason for choosing this firm is [a fact you have checked].”','“The experience I would bring is [your evidence], and I would need to develop [an honest learning need].”'];
  else starters=['“My specific responsibility was [your own task], rather than the whole team’s work.”','“I chose [your actual approach] because [your reasoning].”','“The outcome was [what changed or what you learned]. That is relevant to '+role+' because [your connection].”'];
  return {star:globalThis.DeskInterviewSTAR?.analyse(text,question)||null,points:points.slice(0,3),starters,note:'Sentence starters, not finished answers. Replace every bracket with details you can support. Use a number only when it is accurate; a clear qualitative outcome is also useful.'};
 }
 globalThis.DeskInterviewReview={reviewTranscript};
})();
