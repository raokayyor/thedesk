// Credit only an explicit statement that work was balanced with study.
export function workStudyEvidence(cvText=''){
 return String(cvText).split(/\r?\n/).find(line=>/\b(work(?:ed|ing)?|part[- ]time|employment|shifts?)\b/i.test(line)&&/\b(alongside|while|balanc\w*)\b/i.test(line)&&/\b(university|degree|stud(?:y|ies|ying)|full[- ]time education)\b/i.test(line)&&/\b(hours?|weekly|weeks?|per week|shifts?|20\d{2}|since)\b/i.test(line))||null;
}
export function resilienceEvidenceError(competencies,cvText){
 const resilience=competencies?.find(c=>c.name==='Resilience');
 return resilience?.score===0&&workStudyEvidence(cvText)?'Resilience: the CV explicitly describes ongoing work alongside study. Credit that balancing of commitments with a supporting quote; do not infer setbacks or exceptional outcomes.':null;
}
