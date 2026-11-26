import {createHash} from 'node:crypto';
import {SCORING_VERSION,calculateScores} from './assessment-scoring.mjs';
import {sql} from './report-store.mjs';
const canonical=cv=>String(cv||'').replace(/\r\n/g,'\n').trim();
export function scoreCacheKey(cvText,bankId,answers,base=false){const a=answers?.skipped?{skipped:true}:{skipped:false,numerical:answers?.numerical,commercial:answers?.commercial};return createHash('sha256').update(JSON.stringify({version:SCORING_VERSION,bank:bankId,cv:canonical(cvText),answers:base?'cv-evidence':a})).digest('hex');}
export function numericMarks(result,cvText){
 if(result.applicationCriteria?.length!==6||result.competencies?.length!==7||!Number.isFinite(result.atsReadiness?.score))return null;
 const cv=canonical(cvText),positions=quotes=>(quotes||[]).map(quote=>{const start=cv.indexOf(quote);if(start<0)throw Error('Cached score evidence must occur in this CV.');return [start,quote.length]});
 return {criteria:result.applicationCriteria.map(c=>({name:c.name,points:c.points,sources:positions(c.quotes)})),competencies:result.competencies.map(c=>({name:c.name,score:c.score,sources:positions(c.quotes)})),ats:result.atsReadiness.score};
}
export function resultWithMarks(result,marks,cvText,quiz){
 const cv=canonical(cvText),quotes=sources=>sources.map(([start,length])=>{if(!Number.isInteger(start)||!Number.isInteger(length)||start<0||length<1||start+length>cv.length)throw Error('Invalid cached score evidence.');return cv.slice(start,start+length)});
 const analysis={...result,applicationCriteria:marks.criteria.map(c=>({...((result.applicationCriteria||[]).find(x=>x.name===c.name)||{}),name:c.name,points:c.points,quotes:quotes(c.sources)})),competencies:marks.competencies.map(c=>({...((result.competencies||[]).find(x=>x.name===c.name)||{}),name:c.name,score:c.score,quotes:quotes(c.sources),reason:(result.competencies||[]).find(x=>x.name===c.name)?.reason||'Supporting CV evidence is recorded below.',nextStep:''}))};
 return {...calculateScores(analysis,{...(result.atsReadiness||{}),score:marks.ats},quiz,cvText),stableMarksVersion:SCORING_VERSION};
}
export function createStableScoreCache(query){
 let ready;const init=()=>ready??=query('CREATE TABLE IF NOT EXISTS desk_assessment_score_cache (cache_key text PRIMARY KEY, marks jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now())',[]).catch(error=>{ready=null;throw error});
 async function choose(key,marks){return (await query('INSERT INTO desk_assessment_score_cache(cache_key,marks) VALUES($1,$2::jsonb) ON CONFLICT(cache_key) DO UPDATE SET marks=desk_assessment_score_cache.marks RETURNING marks',[key,JSON.stringify(marks)]))[0].marks;}
 return {
  async freeze(result,cvText,bankId,answers,quiz){
   const baseKey=scoreCacheKey(cvText,bankId,null,true),resultKey=scoreCacheKey(cvText,bankId,answers||(quiz?.skipped?{skipped:true}:{numerical:[quiz?.numericalCorrect],commercial:[quiz?.commercialCorrect]}));
   if(result.stableCvKey===baseKey&&result.stableResultKey===resultKey)return result;
   const candidate=numericMarks(result,cvText);
   await init();let base=(await query('SELECT marks FROM desk_assessment_score_cache WHERE cache_key=$1',[baseKey]))[0]?.marks;
   if(!base){if(!candidate)return result;try{resultWithMarks(result,candidate,cvText,quiz)}catch{return result}base=await choose(baseKey,candidate);}
   const marks=await choose(resultKey,base);
   return {...resultWithMarks(result,marks,cvText,quiz),stableCvKey:baseKey,stableResultKey:resultKey};
  },
  async read(cvText,bankId,ats,quiz){
   await init();const key=scoreCacheKey(cvText,bankId,null,true),cached=(await query('SELECT marks FROM desk_assessment_score_cache WHERE cache_key=$1',[key]))[0];if(!cached)return null;
   const seeded=resultWithMarks({deskSummary:'',weakLines:[],priorities:[],atsReadiness:ats},cached.marks,cvText,quiz);
   const best=[...seeded.competencies].sort((a,b)=>b.score-a.score).find(c=>c.quotes.length);
   seeded.deskSummary=best?'Your CV already describes: '+best.quotes[0]:'';return {...seeded,stableCvKey:key};
  }
 };
}
export const stableScoreCache=createStableScoreCache((query,args)=>sql().query(query,args));
