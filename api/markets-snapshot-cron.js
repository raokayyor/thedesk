import {timingSafeEqual} from 'node:crypto';
import {sql,apiFailure} from '../lib/report-store.mjs';
import {emailReady,sendEmail,emailLayout,escHtml as esc} from '../lib/email.mjs';
import {isPaidOwner} from '../lib/value-accounts.mjs';
import {editionFor,weekOf} from '../lib/markets-snapshot.mjs';
export const maxDuration=300;
export default async function handler(req,res){
 const expected=process.env.CRON_SECRET||'',actual=String(req.headers.authorization||'').replace(/^Bearer /,'');
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return res.status(401).end();
 if(req.method!=='GET')return res.status(405).end();
 if(process.env.VERCEL_ENV!=='production'||!emailReady())return res.json({sent:0,disabled:true});
 try{
 await sql().query(`CREATE TABLE IF NOT EXISTS desk_market_deliveries(email text NOT NULL,week date NOT NULL,sent_at timestamptz,lease_until timestamptz,PRIMARY KEY(email,week))`);
 const week=weekOf(),origin=process.env.APP_ORIGIN||'https://thedesk.vercel.app';
 const subscribers=await sql().query(`SELECT s.email,s.unsubscribe_token,a.id AS account_id FROM desk_briefing_subscribers s JOIN desk_accounts a ON lower(a.email)=s.email LEFT JOIN desk_market_deliveries d ON d.email=s.email AND d.week=$1 WHERE s.topic='markets-weekly' AND d.sent_at IS NULL AND (d.lease_until IS NULL OR d.lease_until<now()) ORDER BY s.created_at LIMIT 20`,[week]);
 let sent=0;
 for(const s of subscribers){
  if(!await isPaidOwner('account:'+s.account_id))continue;
  const claim=await sql().query(`INSERT INTO desk_market_deliveries(email,week,lease_until) VALUES($1,$2,now()+interval '10 minutes') ON CONFLICT(email,week) DO UPDATE SET lease_until=EXCLUDED.lease_until WHERE desk_market_deliveries.sent_at IS NULL AND desk_market_deliveries.lease_until<now() RETURNING email`,[s.email,week]);if(!claim.length)continue;
  try{const edition=await editionFor(s.account_id);if(!edition.stories.length)continue;
   const consent=await sql().query("SELECT 1 FROM desk_briefing_subscribers WHERE email=$1 AND topic='markets-weekly' AND unsubscribe_token=$2",[s.email,s.unsubscribe_token]);if(!consent.length)continue;
   const unsubscribe=origin+'/db-briefing-unsubscribe.html?token='+s.unsubscribe_token;
   const inner='<h1>Markets Snapshot</h1><p>Week of '+esc(week)+' · '+esc([...edition.firms,...edition.sectors].join(' · '))+'</p>'+edition.stories.map(x=>'<h2>'+esc(x.title)+'</h2><p>'+esc(x.publisher)+' · '+esc(x.publishedAt.slice(0,10))+'</p>'+(x.summary?'<p>'+esc(x.summary)+'</p>':'')+'<h3>What this means</h3><p>'+esc(x.meaning)+'</p><p><strong>A point to think through:</strong> '+esc(x.question)+'</p><p><a href="'+esc(x.url)+'">Read the source</a></p>').join('<hr>')+'<p><a href="'+origin+'/markets-snapshot.html">Read your briefing on The Desk</a></p>';
   await sendEmail({to:s.email,subject:'Your Markets Snapshot · '+week,html:emailLayout(inner,'You asked for Markets Snapshot. Learning context, not investment advice. <a href="'+unsubscribe+'">Unsubscribe</a>'),text:'Markets Snapshot · '+week+'\n\n'+edition.stories.map(x=>x.title+'\nWhat this means: '+x.meaning+'\n'+x.url).join('\n\n')+'\n\nUnsubscribe: '+unsubscribe,idempotencyKey:'markets:'+s.account_id+':'+week});
   await sql().query('UPDATE desk_market_deliveries SET sent_at=now() WHERE email=$1 AND week=$2',[s.email,week]);sent++;
  }catch{console.error('Markets Snapshot delivery failed');}
 }
 return res.json({sent});
 }catch(e){return apiFailure(res,e);}
}
