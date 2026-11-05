import {NEWS_SOURCES,fetchEmployerNews} from '../lib/interview-news.mjs';
import {publicNews,rankNews,archiveNews,archivedNews} from '../lib/news-library.mjs';
const cache=new Map(),pending=new Map();
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).end();
 const firm=req.query?.firm||'general',role=req.query?.role||'ibd';
 if((firm!=='general'&&!Object.hasOwn(NEWS_SOURCES,firm))||!['ibd','markets','corporate','asset','audit','deals','tax','risk'].includes(role))return res.status(400).json({error:'Choose a supported employer and role.'});
 const key=firm+':'+role,cached=cache.get(key);if(cached&&Date.now()-cached.at<900000){res.setHeader('Cache-Control','public, s-maxage=900');return res.json(cached.value)}
 if(!pending.has(key))pending.set(key,(async()=>{
  const [employer,publicItems,archive]=await Promise.all([firm==='general'?{items:[],sourceUrl:null}:fetchEmployerNews(firm),publicNews(),archivedNews()]);
  const items=rankNews([...employer.items,...publicItems,...archive],{firm,role});let archiveSaved=true;try{await archiveNews(items)}catch{archiveSaved=false}
  const value={firm,role,checkedAt:new Date().toISOString(),items,status:items.length?'available':'unavailable',sourceUrl:employer.sourceUrl,archiveSaved};cache.set(key,{at:Date.now(),value});return value;
 })().finally(()=>pending.delete(key)));
 try{const value=await pending.get(key);res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=1800');return res.json(value)}catch{return res.status(503).json({error:'News is temporarily unavailable.',items:[]})}
}
