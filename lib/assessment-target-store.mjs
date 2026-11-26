import {sql,initStore,owner} from './report-store.mjs';
import {currentAccount} from './accounts.mjs';
import {cleanTargets} from './assessment-targets.mjs';
let ready;
export async function targetOwner(req,res,create=false){const account=await currentAccount(req);return account?'account:'+account.id:owner(req,res,create);}
async function init(){return ready??=initStore().then(()=>sql().query('CREATE TABLE IF NOT EXISTS desk_assessment_targets(owner_key text PRIMARY KEY, targets jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())')).catch(e=>{ready=null;throw e});}
export async function loadTargets(req,res){const key=await targetOwner(req,res);if(!key)return cleanTargets();await init();const rows=await sql().query('SELECT targets FROM desk_assessment_targets WHERE owner_key=$1',[key]);return cleanTargets(rows[0]?.targets);}
export async function storeTargets(req,res,value){const key=await targetOwner(req,res,true);await init();const targets=cleanTargets(value);await sql().query('INSERT INTO desk_assessment_targets(owner_key,targets) VALUES($1,$2::jsonb) ON CONFLICT(owner_key) DO UPDATE SET targets=EXCLUDED.targets,updated_at=now()',[key,JSON.stringify(targets)]);return targets;}
export function withTargets(profile,targets){return targets?.route?{...profile,targetSector:targets.sector,targetDivision:targets.sector,targetFirm:targets.firms[0]||'',targetFirms:targets.firms}:profile;}
