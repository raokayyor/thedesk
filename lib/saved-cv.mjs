import {sql} from './report-store.mjs';
let ready;
export function initCvStore(){return ready??=sql().query(`CREATE TABLE IF NOT EXISTS desk_saved_cvs (owner_hash text PRIMARY KEY, assessment_id text NOT NULL, cv_text text NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp())`).catch(e=>{ready=null;throw e})}
export async function latestCv(ownerHash){
 await initCvStore();
 const rows=await sql().query(`SELECT cv_text AS text,updated_at AS "updatedAt",'saved' AS source FROM desk_saved_cvs WHERE owner_hash=$1 UNION ALL SELECT input->>'cvText' AS text,created_at AS "updatedAt",'upload' AS source FROM desk_assessments WHERE owner_hash=$1 AND length(trim(COALESCE(input->>'cvText','')))>0 ORDER BY "updatedAt" DESC LIMIT 1`,[ownerHash]);
 return rows[0]||{text:'',source:null,updatedAt:null};
}
export async function saveCv(ownerHash,assessmentId,text){
 await initCvStore();
 return (await sql().query(`INSERT INTO desk_saved_cvs(owner_hash,assessment_id,cv_text) VALUES($1,$2,$3) ON CONFLICT(owner_hash) DO UPDATE SET assessment_id=EXCLUDED.assessment_id,cv_text=EXCLUDED.cv_text,updated_at=clock_timestamp() RETURNING cv_text AS text,updated_at AS "updatedAt",'saved' AS source`,[ownerHash,assessmentId,text]))[0];
}
