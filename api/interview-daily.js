import {latestAssessment} from '../lib/accounts.mjs';
import {sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {principal,isPaidOwner,useQuota} from '../lib/value-accounts.mjs';
import {dailyIdentity,initDaily,londonDay,weekOf,dailyQuestion,dailyStats,dailyProfile} from '../lib/interview-daily.mjs';
export default async function handler(req,res){res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');try{
 if(!['GET','POST'].includes(req.method))return res.status(405).end();if(req.method==='POST'&&!sameOrigin(req,res))return;
 const account=await dailyIdentity(req),p=await principal(req,res),paid=await isPaidOwner(p);if(!paid&&!await latestAssessment(account.id))return res.status(403).json({error:'Get your free assessment first: 10 mins.'});await initDaily();const day=londonDay(),week=weekOf(day);
 const rows=await sql().query('SELECT id::text,day::text,week::text,data,best FROM desk_interview_daily WHERE account_id=$1 ORDER BY day DESC LIMIT 400',[account.id]);let today=rows.find(x=>x.day===day);
 if(req.method==='POST'&&!today){if(!await useQuota('daily-start:'+p,15))return res.status(429).json({error:'Please try again later.'});const profile=await dailyProfile(account),data={...profile,question:dailyQuestion(day,profile.firm,profile.role),kind:'competency'};
 // Unique weekly slots make the three free starts atomic, including concurrent requests.
 for(let slot=1;slot<=(paid?7:3)&&!today;slot++){today=(await sql().query('INSERT INTO desk_interview_daily(account_id,day,week,slot,data) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT DO NOTHING RETURNING id::text,day::text,week::text,data,best',[account.id,day,week,slot,JSON.stringify(data)]))[0];if(!today)today=(await sql().query('SELECT id::text,day::text,week::text,data,best FROM desk_interview_daily WHERE account_id=$1 AND day=$2',[account.id,day]))[0];}
 if(!today)return res.status(402).json({error:'Your three free daily questions are used for this week. Membership opens daily practice.',upgrade:true});}
 const profile=today?.data||await dailyProfile(account),used=rows.filter(x=>x.week===week).length;return res.json({success:true,paid,day,firm:profile.firm,question:today?.data.question||dailyQuestion(day,profile.firm,profile.role),dailyId:today?.id||null,left:paid?null:Math.max(0,3-used-(today&&!rows.some(x=>x.id===today.id)?1:0)),...dailyStats(today&&!rows.some(x=>x.id===today.id)?[today,...rows]:rows,day)});
 }catch(error){if(error.status)return res.status(error.status).json({error:error.message});return apiFailure(res,error)}}
