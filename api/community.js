import {sql,sameOrigin,apiFailure} from '../lib/report-store.mjs';
import {principal,isPaidOwner,useQuota} from '../lib/value-accounts.mjs';
const CATEGORIES=['questions','interviews','practice'];
const clean=(v,n)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n):'';
let ready;
function init(){return ready??=sql().query(`CREATE TABLE IF NOT EXISTS desk_community_posts(id bigserial PRIMARY KEY,parent_id bigint REFERENCES desk_community_posts(id) ON DELETE CASCADE,principal text NOT NULL,nickname text NOT NULL,category text NOT NULL,title text NOT NULL DEFAULT '',body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`).catch(e=>{ready=null;throw e;});}
export default async function handler(req,res){res.setHeader('Cache-Control','private, no-store');try{
 if(!['GET','POST','DELETE'].includes(req.method))return res.status(405).end();
 if(req.method!=='GET'&&!sameOrigin(req,res))return;
 const p=await principal(req,res);if(!await isPaidOwner(p))return res.status(402).json({error:'The community is for members.',membershipRequired:true});
 await init();
 if(req.method==='GET'){
  const id=req.query?.id;if(id){if(!/^\d{1,18}$/.test(id))return res.status(400).json({error:'Invalid discussion.'});const rows=await sql().query(`SELECT id::text,parent_id::text AS "parentId",nickname,category,title,body,created_at AS "createdAt",principal=$2 AS mine FROM desk_community_posts WHERE id=$1 OR parent_id=$1 ORDER BY created_at LIMIT 100`,[id,p]);if(!rows.some(r=>r.id===id&&r.parentId===null))return res.status(404).json({error:'Discussion not found.'});return res.json({posts:rows});}
  const category=CATEGORIES.includes(req.query?.category)?req.query.category:null;
  const threads=await sql().query(`SELECT p.id::text,p.nickname,p.category,p.title,p.body,p.created_at AS "createdAt",p.principal=$1 AS mine,(SELECT count(*)::int FROM desk_community_posts r WHERE r.parent_id=p.id) AS replies FROM desk_community_posts p WHERE p.parent_id IS NULL AND ($2::text IS NULL OR p.category=$2) ORDER BY p.created_at DESC LIMIT 50`,[p,category]);return res.json({threads});
 }
 const b=req.body||{};
 if(req.method==='DELETE'){if(!/^\d{1,18}$/.test(String(b.id||'')))return res.status(400).json({error:'Invalid post.'});const rows=await sql().query('DELETE FROM desk_community_posts WHERE id=$1 AND principal=$2 RETURNING id',[b.id,p]);return rows.length?res.json({success:true}):res.status(404).json({error:'Post unavailable.'});}
 const nickname=clean(b.nickname,40),body=clean(b.body,3000),title=clean(b.title,160),parentId=b.parentId&&String(b.parentId);
 if(nickname.length<2||nickname.includes('@')||body.length<10||(!parentId&&title.length<8))return res.status(400).json({error:'Add a display name, a title of at least 8 characters and a message of at least 10 characters. Use a display name rather than an email address.'});
 let category=CATEGORIES.includes(b.category)?b.category:'questions';
 if(parentId){if(!/^\d{1,18}$/.test(parentId))return res.status(400).json({error:'Invalid discussion.'});const parent=(await sql().query('SELECT category FROM desk_community_posts WHERE id=$1 AND parent_id IS NULL',[parentId]))[0];if(!parent)return res.status(404).json({error:'Discussion not found.'});category=parent.category;}
 if(!await useQuota('community:'+p,30))return res.status(429).json({error:'You have reached today’s posting allowance. Come back tomorrow.'});
 const rows=await sql().query('INSERT INTO desk_community_posts(parent_id,principal,nickname,category,title,body) VALUES($1,$2,$3,$4,$5,$6) RETURNING id::text',[parentId||null,p,nickname,category,parentId?'':title,body]);return res.json({success:true,id:rows[0].id,threadId:parentId||rows[0].id});
}catch(e){return apiFailure(res,e);}}
