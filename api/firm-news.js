import {explainNews} from '../lib/news-explainers.mjs';
import {NEWS_SOURCES,parseFirmNews} from '../lib/firm-news.mjs';
export const maxDuration=120;
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).end();const source=Object.hasOwn(NEWS_SOURCES,req.query.firm)?NEWS_SOURCES[req.query.firm]:null;if(!source)return res.status(404).json({error:'News source unavailable.'});
 try{let url=source.url,response;for(let i=0;i<4;i++){response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(7000),headers:{Accept:'text/html,application/rss+xml','User-Agent':'TheDesk-GuideNews/1.0'}});if(response.status>=300&&response.status<400){const next=new URL(response.headers.get('location'),url);if(next.protocol!=='https:'||next.hostname.replace(/^www\./,'')!==new URL(source.url).hostname.replace(/^www\./,''))throw Error('Unsupported redirect');url=next.href;continue;}break;}
 if(!response?.ok||+(response.headers.get('content-length')||0)>4000000)throw Error('Newsroom unavailable');const items=parseFirmNews(await response.text(),source);res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=3600');return res.json({sourceUrl:source.url,checkedAt:new Date().toISOString(),items:await explainNews(items,source.url),live:items.length>0});
 }catch{return res.status(503).json({error:'Could not load official headlines. Open the firm newsroom for the latest news.',sourceUrl:source.url,items:[]});}}

