// A faithful fallback for well-explored examples. Never manufacture connective claims.
export function confirmedDraft(name,experience){
 if(!experience?.completedAt||!experience.confirmed)return null;
 const keys=name==='Analytical ability'?['ownership','scope','method','finding','outcome','learning']:name==='Resilience'?['ownership','challenge','outcome','learning']:null;
 if(!keys)return null;
 const example=experience.examples?.find(e=>name==='Analytical ability'?e.answers?.method?.status==='answered'&&e.answers?.finding?.status==='answered':e.answers?.challenge?.status==='answered'&&e.answers?.learning?.status==='answered');
 if(!example)return null;const index=experience.examples.indexOf(example);
 const selected=keys.filter(k=>example.answers[k]?.status==='answered'&&example.answers[k].text);
 const text=selected.map(k=>{const a=example.answers[k];return (k==='scope'&&a.numberBasis==='estimate'?'Approximate estimate: ':'')+a.text.trim();}).join(' ');
 if(text.split(/\s+/).length>230)return null;
 return {text,sourceIds:selected.map(k=>`C${index+1}_${k}`)};
}
export function hasUnsupportedSpecificClaim(text,evidence){
 const source=String(evidence).toLowerCase();
 return [/\bbefore (?:the )?close\b/i,/\b(?:cleared|clear|got through) (?:the )?backlog\b/i,/\bI (?:am actively working|have been working)\b/i].some(pattern=>pattern.test(text)&&!pattern.test(source));
}
