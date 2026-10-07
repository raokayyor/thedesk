import {neon} from '@neondatabase/serverless';
import {randomBytes,createHash} from 'node:crypto';
export const sql=()=>neon(process.env.DATABASE_URL);
let initialized;
export function initStore(){return initialized??=sql().query(`CREATE TABLE IF NOT EXISTS desk_assessments (
 id text PRIMARY KEY, owner_hash text NOT NULL, input jsonb NOT NULL, result jsonb NOT NULL,
 report jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 paid_at timestamptz, stripe_session text UNIQUE, stripe_intent text, refunded_at timestamptz,
 root_id text, rechecks_used integer NOT NULL DEFAULT 0,
 generation_lease jsonb NOT NULL DEFAULT '{}'
)`).catch(e=>{initialized=null;throw e;});}
export const newId=()=>randomBytes(24).toString('hex');
export const hash=x=>createHash('sha256').update(x).digest('hex');
export async function reserveAssessmentAttempt(req){
 await sql().query('CREATE TABLE IF NOT EXISTS desk_rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL)');
 const address=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 const rows=await sql().query("INSERT INTO desk_rate_limits(key,window_start,attempts) VALUES($1,date_trunc('hour',now()),1) ON CONFLICT(key) DO UPDATE SET window_start=EXCLUDED.window_start,attempts=CASE WHEN desk_rate_limits.window_start=EXCLUDED.window_start THEN desk_rate_limits.attempts+1 ELSE 1 END WHERE desk_rate_limits.window_start<>EXCLUDED.window_start OR desk_rate_limits.attempts<10 RETURNING attempts",[hash(address)]);
 return rows.length>0;
}
export function owner(req,res,create=false){
 let token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('desk_owner='))?.slice(11);
 if(!/^[a-f0-9]{64}$/.test(token||'')){if(!create)return null;token=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`desk_owner=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.VERCEL?'; Secure':''}`);}
 return hash(token);
}
export async function ownedRecord(req,res,id){
 await initStore();const h=owner(req,res);if(!h||!/^[a-f0-9]{48}$/.test(id||''))return null;
 return (await sql().query('SELECT * FROM desk_assessments WHERE id=$1 AND owner_hash=$2',[id,h]))[0]||null;
}
export async function hasAccess(record){
 if(record?.paid_at)return true;
 if(!record?.root_id)return false;
 const root=(await sql().query('SELECT paid_at FROM desk_assessments WHERE id=$1 AND owner_hash=$2',[record.root_id,record.owner_hash]))[0];
 return !!root?.paid_at;
}
export function sameOrigin(req,res){
 res.setHeader('Cache-Control','no-store');
 const expected=new URL(process.env.APP_ORIGIN||`https://${req.headers.host}`).origin;
 if(req.headers.origin!==expected){res.status(403).json({success:false,error:'Open this form on The Desk to continue.'});return false;}return true;
}
export function apiFailure(res,e){const safeReasons=['Incomplete assessment','Missing assessment','Invalid preview','Incomplete competency assessment','Invalid competency evidence','Evidence required for scored competency','Incomplete application assessment','Invalid application evidence','Recheck unavailable'];console.error('desk request failed',JSON.stringify({type:e?.name||'Error',reason:safeReasons.includes(e?.message)?e.message:undefined,status:e?.status,code:/^[A-Z0-9_]{1,30}$/.test(e?.code||'')?e.code:undefined}));return res.status(503).json({success:false,error:'The service could not complete this request. Please retry.'});}