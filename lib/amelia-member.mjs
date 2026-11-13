import {readFile} from 'node:fs/promises';
import {hash,newId,sql} from './report-store.mjs';
import {linkAssessment} from './accounts.mjs';
import {saveCv} from './saved-cv.mjs';
import {initDeep,deepQuestions} from './deep-assessment.mjs';
import {evaluateDeep} from './deep-evaluation.mjs';
import {parsePart} from './full-cycle-contract.mjs';

// Imported member workspace, isolated from any account owning the public email.
export function ameliaMemberData(fixture){
 const f=structuredClone(fixture),profile={...f.profile},paid=f.paid;
 let cvText=f.cv.sourceText;
 for(const b of paid.bulletRepair)cvText=cvText.replace(b.exampleBullet,b.originalBullet);
 cvText=cvText.replace('amelia@example.com','ameliachen@gmail.com');
 // Older fixture metadata cites an earlier wording; retain only source quotes.
 for(const b of paid.bulletRepair)b.factsUsed=b.factsUsed.filter(q=>cvText.includes(q));
 const repairKeys=['evidenceHierarchy','bulletRepair','competencyRepair','interviewRiskMap','atsReadiness'];
 const planKeys=['sevenDayActionPlan','finalSubmissionChecklist','recheckRecommendation','workedAnswers','weeksTwoToFour'];
 const pick=keys=>Object.fromEntries(keys.filter(k=>paid[k]!==undefined).map(k=>[k,paid[k]]));
 const report={verdict:Object.fromEntries(Object.entries(paid).filter(([k])=>!repairKeys.includes(k)&&!planKeys.includes(k))),repair:pick(repairKeys),plan:pick(planKeys)};
 for(const part of ['verdict','repair','plan'])report[part]=parsePart(JSON.stringify(report[part]),part,cvText);
 const b=f.result.breakdown;
 const deep={status:'complete',answers:{},testChoice:'carry',cvHash:hash(cvText),completedAt:new Date().toISOString(),evaluation:{score:Math.round((b.application+b.competency)/55*100),application:b.application,competency:b.competency,competencies:f.result.competencies,applicationCriteria:f.result.applicationCriteria,summary:f.result.deskSummary,scope:'CV and competency evidence only; numerical, commercial and ATS scores are excluded.',version:'deep-evidence-v1'}};
 return {input:{profile,cvText,quiz:{...f.quiz,workedAnswers:paid.workedAnswers||[]}},result:f.result,report,deep};
}

export async function seedAmeliaMember(accountId,ownerHash){
 const fixture=JSON.parse(await readFile(new URL('../samples/amelia-report-v3-preview.json',import.meta.url),'utf8'));
 const data=ameliaMemberData(fixture),id=newId();
 await completeAmeliaBaseline(data);
 await initDeep();
 await sql().query('INSERT INTO desk_assessments(id,owner_hash,input,result,report) VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb)',[id,ownerHash,JSON.stringify(data.input),JSON.stringify(data.result),JSON.stringify(data.report)]);
 await linkAssessment(accountId,id);
 await saveCv(ownerHash,id,data.input.cvText);
 await sql().query('INSERT INTO desk_deep_assessments(assessment_id,data) VALUES($1,$2::jsonb)',[id,JSON.stringify(data.deep)]);
 return data.input.profile;
}

// A single reproducible, real rubric run on Amelia's existing factual evidence.
export function ameliaFollowups(data){
 const row={input:data.input,result:data.result};
 const answers=Object.fromEntries(deepQuestions(row).map(q=>{
  if(q.id==='motivation')return [q.id,{unknown:false,text:'My corporate finance internship and university DCF project are the experiences I want to build on in investment banking.'}];
  const source=q.source;
  const text=/software|acquisition|recurring|associate/i.test(source)?'I researched 12 UK software companies, recorded business descriptions, revenue and EBITDA in Excel, and flagged four whose recurring-revenue models matched the acquisition brief. I presented the comparison and selection reasons to an associate. I have not confirmed any later transaction outcome.':/LVMH|DCF|valuation|growth assumptions/i.test(source)?'I built a DCF and trading-comparables valuation using public annual-report data, compared three luxury-sector peers, and tested revenue growth assumptions of 3%, 5% and 7%. I presented the sensitivity to a four-person seminar team.':/Pho|colleagues|till|payment|customer|12 hours/i.test(source)?'I worked 12 hours per week alongside university, trained three colleagues on ordering and till procedures, and escalated a duplicate payment to the shift lead during a busy service. The escalation supported the correction process.':null;
  return [q.id,text?{unknown:false,text}:{unknown:true,text:''}];
 }));
 return {answers,testChoice:'carry'};
}
async function completeAmeliaBaseline(data){
 const confirmed=ameliaFollowups(data),key=hash(JSON.stringify({cv:data.input.cvText,...confirmed,version:'amelia-deep-v2',model:process.env.ASSESSMENT_MODEL||'claude-sonnet-4-6'}));
 await sql().query("CREATE TABLE IF NOT EXISTS desk_member_baselines(key text PRIMARY KEY,data jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now())");
 let saved=(await sql().query('SELECT data FROM desk_member_baselines WHERE key=$1',[key]))[0]?.data;
 if(!saved){const evaluation=await evaluateDeep({input:data.input,result:data.result},confirmed);saved={...confirmed,evaluation,completedAt:new Date().toISOString()};await sql().query('INSERT INTO desk_member_baselines(key,data) VALUES($1,$2::jsonb) ON CONFLICT DO NOTHING',[key,JSON.stringify(saved)]);}
 Object.assign(data.deep,saved,{status:'complete',baselineVersion:2});
}
