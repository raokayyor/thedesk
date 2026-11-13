import {readFile} from 'node:fs/promises';
import {hash,newId,sql} from './report-store.mjs';
import {linkAssessment} from './accounts.mjs';
import {saveCv} from './saved-cv.mjs';
import {initDeep} from './deep-assessment.mjs';
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
 await initDeep();
 await sql().query('INSERT INTO desk_assessments(id,owner_hash,input,result,report) VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb)',[id,ownerHash,JSON.stringify(data.input),JSON.stringify(data.result),JSON.stringify(data.report)]);
 await linkAssessment(accountId,id);
 await saveCv(ownerHash,id,data.input.cvText);
 await sql().query('INSERT INTO desk_deep_assessments(assessment_id,data) VALUES($1,$2::jsonb)',[id,JSON.stringify(data.deep)]);
 return data.input.profile;
}
