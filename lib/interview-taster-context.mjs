import {readFile} from 'node:fs/promises';
import {conversionFacts} from './result-conversion.mjs';
import {tasterQuestion} from './taster-question.mjs';
export const sampleFreeStudent=readFile(new URL('../samples/amelia-report-v3-preview.json',import.meta.url),'utf8').then(JSON.parse);
export function interviewTasterContext(profile,result,cvText,{sample=false,assessmentId,practiceCompetency}={}){
 const facts=conversionFacts(result,{},cvText),weakest=facts.competencies.find(c=>c.name===practiceCompetency)||[...facts.competencies].sort((a,b)=>a.score-b.score)[0]||{name:'Analytical ability',score:0};
 const competency=(result.competencies||[]).find(c=>c.name===weakest.name);
 const quotes=[...(competency?.quotes||[]),...(result.competencies||[]).flatMap(c=>c.quotes||[])].filter(q=>typeof q==='string'&&cvText.includes(q));
 const shortQuotes=quotes.map(q=>{const sentences=q.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[q];const relevant=weakest.name==='Leadership'?sentences.find(t=>/train|led|organis|managed|responsib/i.test(t)):weakest.name==='Teamwork'?sentences.find(t=>/team|colleague|seminar|present|collaborat/i.test(t)):weakest.name==='Resilience'?sentences.find(t=>/hours|alongside|difficult|pressure/i.test(t)):null;return (relevant||sentences[0]).trim();}).filter(q=>cvText.includes(q));
 const evidence=[...new Set(shortQuotes)].slice(0,3).map(quote=>({quote,why:'Use the part you personally did. Explain your decision and what happened; do not claim an outcome the CV does not support.'}));
 return {success:true,publicTrial:true,sample,assessmentId,profile,cv:{text:cvText},student:{cvText},weakest:weakest.name,paperScore:weakest.score,question:tasterQuestion(weakest.name),evidence,tip:weakest.name==='Teamwork'?'Choose one situation where you worked towards a shared goal. Explain your own contribution, how you worked with other people, and what the team achieved. Be clear about what you did rather than saying only “we”.':weakest.name==='Leadership'?'Small is fine. Explain the moment you took responsibility, what you decided, and what happened because of it. Training someone can work; attending a society talk does not show you leading.':'Choose one real example. Tell me what made it difficult, what you personally decided, and what changed or what you learned. A clear, honest result matters more than an impressive claim.'};
}
export async function resolveInterviewTaster(req,res){
 // Free tools demonstrate one consistent sample. Never substitute a signed-in student's CV.
 const s=await sampleFreeStudent;return interviewTasterContext(s.profile,s.result,s.originalCvText,{sample:true,practiceCompetency:'Teamwork'});
}
