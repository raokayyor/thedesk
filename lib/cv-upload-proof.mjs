import {randomBytes,createHash} from 'node:crypto';
import {sql,owner} from './report-store.mjs';
const digest=text=>createHash('sha256').update(text.trim()).digest('hex');
export const cleanExtraction=text=>text.length>=100&&(text.match(/\uFFFD/g)||[]).length/text.length<.01;
export function uploadProofStore(query){
 const init=()=>query(`CREATE TABLE IF NOT EXISTS desk_cv_upload_proofs (id text PRIMARY KEY, owner_hash text NOT NULL, text_hash text NOT NULL, kind text NOT NULL, readability_passed boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);
 return {async record(h,text,kind){await init();const id=randomBytes(24).toString('hex');await query('INSERT INTO desk_cv_upload_proofs(id,owner_hash,text_hash,kind,readability_passed) VALUES($1,$2,$3,$4,$5)',[id,h,digest(text),kind,['pdf','docx'].includes(kind)&&cleanExtraction(text)]);return id;},async read(h,text,id){const fallback={kind:'paste',readabilityPassed:false};if(!h||!/^[a-f0-9]{48}$/.test(id||''))return fallback;await init();const rows=await query("SELECT kind,readability_passed FROM desk_cv_upload_proofs WHERE id=$1 AND owner_hash=$2 AND text_hash=$3 AND created_at>now()-interval '7 days'",[id,h,digest(text)]);return rows[0]?{kind:rows[0].kind,readabilityPassed:rows[0].readability_passed===true}:fallback;}};
}
export const recordCvUpload=(req,res,text,kind)=>uploadProofStore(sql().query.bind(sql())).record(owner(req,res,true),text,kind);
export const verifiedCvUpload=(req,res,text,id)=>id?uploadProofStore(sql().query.bind(sql())).read(owner(req,res),text,id):Promise.resolve({kind:'paste',readabilityPassed:false});
