import {sql,initStore,owner} from './report-store.mjs';
import {currentAccount} from './accounts.mjs';
import {cleanTargets} from './assessment-targets.mjs';
export async function targetOwner(req,res,create=false){const account=await currentAccount(req);return account?'account:'+account.id:owner(req,res,create);}
export function targetDraftStore(query){let ready;const init=()=>ready??=query('CREATE TABLE IF NOT EXISTS desk_assessment_targets(owner_key text PRIMARY KEY, targets jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(),revision integer NOT NULL DEFAULT 0)').then(()=>query('ALTER TABLE desk_assessment_targets ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0')).catch(e=>{ready=null;throw e});return {
 async load(key){if(!key)return {...cleanTargets(),revision:0};await init();const rows=await query('SELECT targets,revision FROM desk_assessment_targets WHERE owner_key=$1',[key]);return {...cleanTargets(rows[0]?.targets),revision:rows[0]?.revision||0};},
 async save(key,value){await init();const revision=Number.isInteger(value.revision)&&value.revision>=0?value.revision:0,targets=cleanTargets(value);const rows=await query('INSERT INTO desk_assessment_targets(owner_key,targets,revision) VALUES($1,$2::jsonb,$3) ON CONFLICT(owner_key) DO UPDATE SET targets=EXCLUDED.targets,updated_at=now() WHERE desk_assessment_targets.revision=$3 RETURNING revision',[key,JSON.stringify(targets),revision]);if(!rows.length)throw Object.assign(Error('This assessment was restarted. Refresh before continuing.'),{status:409});return {...targets,revision};},
 async reset(key,browserOwner){await init();const rows=await query("INSERT INTO desk_assessment_targets(owner_key,targets,revision) VALUES($1,'{}'::jsonb,1) ON CONFLICT(owner_key) DO UPDATE SET targets='{}'::jsonb,revision=desk_assessment_targets.revision+1,updated_at=now() RETURNING revision",[key]);if(browserOwner)await query("DELETE FROM desk_assessments WHERE owner_hash=$1 AND input->>'backgroundPreparation'='true' AND paid_at IS NULL AND root_id IS NULL",[browserOwner]);return {...cleanTargets(),revision:rows[0].revision};}
 };}
let store;const drafts=()=>store??=targetDraftStore((q,a)=>sql().query(q,a));
export async function loadTargets(req,res){return drafts().load(await targetOwner(req,res));}
export async function storeTargets(req,res,value){return drafts().save(await targetOwner(req,res,true),value);}
export async function resetTargets(req,res){await initStore();return drafts().reset(await targetOwner(req,res,true),owner(req,res));}
export function withTargets(profile,targets){return targets?.route?{...profile,targetSector:targets.sector,targetDivision:targets.sector,targetFirm:targets.firms[0]||'',targetFirms:targets.firms}:profile;}
