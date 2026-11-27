import {parseCv} from './cv-fault-framework.mjs';
import {displayJobRole} from './strict-ats-readiness.mjs';
import {questionsForRoute} from './question-banks.mjs';
export function assessmentInterview(cv,teaser,unlocked=false,id=''){
 if(!teaser)return null;
 const role=displayJobRole(teaser.role||''),[job,employer]=role.split(' · '),source=String(teaser.text||teaser.original||'');
 const question=employer?`At ${employer}, how did you use analysis to make a recommendation?`:'Tell me about a time you used analysis to make a recommendation.';
 const situation=employer?`I worked as ${job} at ${employer}.`:`My example is: “${source}”`;
 const relevant=parseCv(cv).lines.filter(l=>l.role===teaser.role&&['experience','internship','positions'].includes(l.section));
 const outcome=relevant.find(l=>/\b(?:resulted|reduced|saved|increased|selected|approved|adjusted|ranked|improved)\b|\bso (?:that|the|we|they)\b/i.test(l.text));
 return {question,situation,sourceRole:role,...(unlocked?{beats:[situation,source+(source.endsWith('.')?'':'.')+' [What did you personally check, compare or decide?]',outcome?.text||'[What changed as a result, or what feedback did you receive?]'],practiceUrl:'/interview.html?trial=1&ready=1'+(/^[a-f0-9]{48}$/.test(id)?'&assessmentId='+id:'')}:{})};
}
export function assessmentTestReview(input={},unlocked=false){
 if(input.quiz?.skipped||input.answers?.skipped)return {skipped:true};
 let bank;try{bank=questionsForRoute(input.profile?.targetSector||input.profile?.targetDivision||'General Finance');}catch{return null;}
 const wrong=[];for(const section of ['numerical','commercial'])for(const [index,q]of bank[section].entries()){const selected=input.answers?.[section]?.[index];if(Number.isInteger(selected)&&q.options[selected]!==undefined&&selected!==q.answer)wrong.push({q,selected,section});}
 const mistake=wrong.find(m=>m.section==='numerical'&&!m.q.table)||wrong.find(m=>m.section==='numerical')||wrong[0];if(!mistake)return {perfect:input.quiz?.numericalCorrect===5&&input.quiz?.commercialCorrect===5,otherTopicCount:0};
 const topics=[...new Set(wrong.map(m=>m.q.topic))],other=topics.filter(t=>t!==mistake.q.topic),{q,selected,section}=mistake;
 return {question:q.question,section,selectedAnswer:q.options[selected],correctAnswer:q.options[q.answer],otherTopicCount:other.length,...(q.table?{table:q.table}:{}),...(unlocked?{explanation:q.explanation,steps:q.working?.length?q.working:[q.explanation],topics,otherTopics:other}:{})};
}
