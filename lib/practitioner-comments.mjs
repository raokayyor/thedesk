// Editorial guidance selected by the framework score, not a personal human review.
export const COMMENT_RANGES=[
 {min:0,max:19,comments:[
  'Use this as a starting point. Build a clear account of your experience and work through the test fundamentals.',
  'The overall foundations need work. Start with the largest gap in the breakdown and make one concrete improvement at a time.',
  'There is substantial preparation ahead. Make your experience understandable first, then practise the skills the short tests exposed.',
  'A low starting score gives you a clear brief: strengthen the evidence you can substantiate and establish the test basics.',
  'Focus on the foundations before polishing language. The detailed assessment will show which parts currently contribute least.'
 ]},
 {min:20,max:29,comments:[
  'You have a starting point, but the overall case needs strengthening. Prioritise evidence and preparation over more impressive wording.',
  'The application needs a clearer foundation. Use the breakdown to separate a CV evidence gap from a test preparation gap.',
  'There is work to do before this becomes a convincing application. Start with specific actions you can explain and support.',
  'Your next improvement should be concrete: clarify a real example or master a test concept, then check what changed.',
  'Treat the score as a preparation brief. Stronger claims need stronger evidence; test gaps need deliberate practice.'
 ]},
 {min:30,max:39,comments:[
  'Some building blocks are present. The next step is to make the overall application more convincing through evidence and preparation.',
  'There is something to build on here. Concentrate on the weakest component and make your contribution easier to understand.',
  'Useful experience can be hidden by vague explanations. Check the CV findings alongside your test results before choosing your next step.',
  'The foundations are emerging. Work on the gaps the assessment identifies, using real examples and repeatable test practice.',
  'A recruiter needs a clear reason to keep reading. Strengthen your evidence and address the test gaps that remain.'
 ]},
 {min:40,max:49,comments:[
  'There is material to work with. Make the strongest evidence easy to find and address the weaker parts of the breakdown.',
  'You have a base for an application. The next improvement should make your capability clearer, rather than simply make the wording longer.',
  'The overall picture is still developing. Use the detailed feedback to decide whether evidence or test preparation needs attention first.',
  'The aim now is a more convincing application. Keep the facts, explain your contribution and close the test gaps shown below.',
  'There are useful building blocks here. Work on the most important gap before spending time making the application sound more polished.'
 ]},
 {min:50,max:59,comments:[
  'You have a workable base. Target the weaker component and make the strongest parts of your application easier to defend.',
  'There is a credible starting point here. A few specific improvements will be more useful than rewriting every line.',
  'Your application has something to build on. The task is to turn the remaining gaps into clear, evidence-backed improvements.',
  'Focus your next effort carefully. Use the CV findings and test marks together to choose the change that matters most.',
  'The next step is to make your case more convincing. Strengthen the weaker areas without losing the facts already working for you.'
 ]},
 {min:60,max:64,comments:[
  'You are close to the next framework band. Work on the specific gaps rather than making broad, cosmetic changes.',
  'The application is taking shape. Concentrate on the details you need to explain clearly and the test topics still costing marks.',
  'There is a useful platform here. A targeted improvement is more valuable now than a completely different version of your application.',
  'You are approaching the next readiness band. Use the detailed assessment to choose a real improvement you can substantiate.',
  'The next step is greater consistency across your application. Keep the strong evidence and address the weaker component directly.'
 ]},
 {min:65,max:69,comments:[
  'Borderline means parts of the application are working, while the overall preparation still needs attention. Focus on the weaker component.',
  'You have reached the borderline band. The priority is to make the whole application more consistent, with evidence you can defend.',
  'There is a stronger foundation here. Use the remaining gaps to guide preparation rather than assume the application is finished.',
  'Your overall readiness is improving. Concentrate on the gap that would make the clearest difference to the application you actually submit.',
  'The application is moving in the right direction. Tighten the weaker areas and prepare to explain your examples under follow-up questions.'
 ]},
 {min:70,max:74,comments:[
  'You are close to the competitive framework band. Focus on the remaining evidence and test gaps, then check your readiness again.',
  'There is a solid platform here. The final improvements should make your evidence more convincing and your preparation more consistent.',
  'You are nearing the next band. Avoid adding claims you cannot support; make the strongest case from the evidence you have.',
  'This is a useful position to build from. Concentrate on precision and the questions your examples are likely to invite.',
  'The remaining work should be targeted. Strengthen the weaker component while keeping your application specific, factual and easy to follow.'
 ]},
 {min:75,max:89,comments:[
  'Competitive in this framework means a strong overall base. Keep the evidence precise and prepare to defend it in conversation.',
  'There is strong readiness here. Make sure the application you submit is accurate, role-relevant and consistent with what you can explain.',
  'The overall application is in a stronger position. Your next task is to turn that preparation into clear, credible conversations.',
  'You have a strong platform. Keep testing the assumptions behind your examples and prepare for the follow-up questions they invite.',
  'This is a competitive framework score. Preserve the substance, tailor the application carefully and keep your preparation current.'
 ]},
 {min:90,max:100,comments:[
  'This is a very strong framework result. Focus on precision, role-specific preparation and explaining the judgement behind your examples.',
  'Your overall readiness is strong. Keep the application truthful and specific, and prepare to discuss your evidence in depth.',
  'You have a very strong platform here. The next challenge is to communicate the reasoning behind your work clearly and confidently.',
  'At this level, concentrate on the details: accurate claims, thoughtful role research and clear answers to probing follow-up questions.',
  'This result shows very strong readiness within the framework. Preserve that standard in the application and in how you explain your work.'
 ]}
];
export function practitionerComment(entry,id=''){
 const goal='Our aim is to help you build a clear, convincing CV and application that makes an employer want to meet you.';
 if(entry.max!==100||entry.tests?.skipped)return{comment:'This is a CV-only assessment. Complete the short tests when you are ready to build the full readiness picture.',meaning:'Numerical and commercial ability have not been assessed.',reason:'The score reflects the CV evidence assessed so far.',goal};
 const score=Math.max(0,Math.min(100,Math.round(Number(entry.score)||0))),range=COMMENT_RANGES.find(r=>score>=r.min&&score<=r.max);
 let hash=0;for(const c of String(id||score))hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
 const meaning=score<65?'Developing: there is still work to do on overall readiness.':score<75?'Borderline: a stronger base, with gaps still to address.':'Competitive: strong readiness within this framework.';
 const b=entry.scoreBreakdown;let reason='Your score combines CV evidence, numerical reasoning and commercial understanding.';
 if(b&&Number.isFinite(b.cv)&&Number.isFinite(b.tests)){
  const gap=b.cv/65-b.tests/35;
  reason=`CV evidence: ${b.cv}/65. Short tests: ${b.tests}/35. `+(gap<-.05?'CV evidence is the weaker component proportionally.':gap>.05?'Test performance is the weaker component proportionally.':'Both components contribute at a similar level.');
 }
 return{comment:range.comments[hash%range.comments.length],meaning,reason,goal};
}
