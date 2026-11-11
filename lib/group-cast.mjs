// Stable within a round, different across new rounds. Client sends only a numeric seed.
const styles=[
 'Strong analyst: uses a relevant calculation, tests assumptions and admits uncertainty. Keep it conversational, not a perfect model answer.',
 'Confident but superficial: makes a plausible recommendation with a weak reason. Can overlook one trade-off and respond defensively, then reconsider when challenged.',
 'Quiet but insightful: gives a short, useful observation and becomes more specific when invited.',
 'Enthusiastic but distracted: favours a customer or brand angle, sometimes misses a financial implication, and can be brought back to the task.',
 'Cautious sceptic: sees downside risks readily but sometimes overweights them and needs prompting to choose.',
 'Pragmatic collaborator: builds on another person, offers a workable compromise, but may settle too early without testing an assumption.',
 'Quick with numbers but imperfect: can misinterpret a supplied metric as an opinion or calculation error; make the underlying case facts explicit so others can challenge it. Never invent new case facts.'
];
export function roundCast(seed,options){
 let state=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:0;
 const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 return Object.fromEntries(['dominic','priya','sam'].map(name=>[name,{style:styles[Math.floor(rng()*styles.length)],preference:Math.floor(rng()*Math.max(1,options)),opening:Math.floor(rng()*3)}]));
}
