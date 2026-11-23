import {sql} from './report-store.mjs';
import {currentAccount,latestAssessment} from './accounts.mjs';
let ready;
export function londonDay(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function weekOf(day){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
export function dailyQuestion(day,firm,role){const index=Math.floor(Date.parse(day+'T12:00:00Z')/86400000)%7;return [
 `Give me a brief introduction and explain which experience prepares you for ${role||'your target role'}${firm?' at '+firm:''}.`,
 'Tell me about a time you helped a team achieve a goal. What was your own contribution?',
 'Tell me about a time you used evidence to make a decision. What did you conclude?',
 'Describe a time you had to explain something complex. How did you check it was understood?',
 `Why ${firm||'this employer'}, and how does your experience connect to the work you want to do?`,
 'Tell me about a time you managed competing responsibilities. What did you do and what changed?',
 'Describe a time you took responsibility for improving something. What did you personally change?'
 ][index];}
export function dailyStats(rows,today){const done=rows.filter(x=>Number.isFinite(x.best)),dates=new Set(done.map(x=>String(x.day).slice(0,10)));let d=new Date(today+'T12:00:00Z'),streak=0;if(!dates.has(today))d.setUTCDate(d.getUTCDate()-1);while(dates.has(d.toISOString().slice(0,10))){streak++;d.setUTCDate(d.getUTCDate()-1);}return {streak,best:done.length?Math.max(...done.map(x=>x.best)):null};}
export async function initDaily(){return ready??=(async()=>{await sql().query(`CREATE TABLE IF NOT EXISTS desk_interview_daily(id bigserial PRIMARY KEY,account_id text NOT NULL,day date NOT NULL,week date NOT NULL,slot integer NOT NULL,data jsonb NOT NULL,best integer,UNIQUE(account_id,day),UNIQUE(account_id,week,slot))`);})().catch(e=>{ready=null;throw e});}
export async function dailyIdentity(req){const account=await currentAccount(req);if(!account)throw Object.assign(Error('Sign in for your Question of the Day.'),{status:401});const verified=(await sql().query('SELECT verified_at FROM desk_accounts WHERE id=$1',[account.id]))[0];if(!verified?.verified_at)throw Object.assign(Error('Confirm your email to start daily practice.'),{status:403});return account;}
export async function dailyProfile(account){const row=await latestAssessment(account.id),p=row?.input?.profile||{};return {firm:p.targetFirm||'',role:p.targetDivision||p.targetSector||'',assessmentId:row?.id};}
export async function resolveDaily(req,id){if(!/^\d{1,18}$/.test(String(id)))throw Object.assign(Error('Open today’s question from My Desk.'),{status:400});const account=await dailyIdentity(req);await initDaily();const row=(await sql().query('SELECT id::text,data,day::text,best FROM desk_interview_daily WHERE id=$1 AND account_id=$2 AND day=$3',[id,account.id,londonDay()]))[0];if(!row)throw Object.assign(Error('This daily question has expired. Open today’s question from My Desk.'),{status:404});return {...row,account};}
export async function completeDaily(row,score){if(Number.isFinite(score))await sql().query('UPDATE desk_interview_daily SET best=GREATEST(COALESCE(best,0),$1) WHERE id=$2 AND account_id=$3',[Math.round(score),row.id,row.account.id]);}
