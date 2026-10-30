export const NEWS_SOURCES={
 db:{url:'https://www.db.com/api/sitemap/www.db.com/rss/1?newscount=30',newsroom:'https://www.db.com/media/',domain:'db.com'},
 bofa:{url:'https://newsroom.bankofamerica.com/content/newsroom/press-releases',newsroom:'https://newsroom.bankofamerica.com/content/newsroom/press-releases',domain:'bankofamerica.com'},
 gs:{url:'https://www.goldmansachs.com/pressroom',newsroom:'https://www.goldmansachs.com/pressroom',domain:'goldmansachs.com'},
 jpm:{url:'https://www.jpmorganchase.com/newsroom/press-releases',newsroom:'https://www.jpmorganchase.com/newsroom',domain:'jpmorganchase.com'},
 barclays:{url:'https://home.barclays/news/press-releases/',newsroom:'https://home.barclays/news/',domain:'barclays'},
 ubs:{url:'https://www.ubs.com/global/en/media/news.html',newsroom:'https://www.ubs.com/global/en/media.html',domain:'ubs.com'},
 ey:{url:'https://www.ey.com/en_uk/newsroom',newsroom:'https://www.ey.com/en_uk/newsroom',domain:'ey.com'},
 pwc:{url:'https://www.pwc.co.uk/press-room/press-releases.html',newsroom:'https://www.pwc.co.uk/press-room.html',domain:'pwc.co.uk'}
};
export function cleanText(value){return String(value||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>{const cp=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):''}).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();}
export function validNewsUrl(value,firmKey){const source=NEWS_SOURCES[firmKey];if(!source)return null;try{const url=new URL(value,source.url);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&(url.hostname===source.domain||url.hostname.endsWith('.'+source.domain))?url.href:null}catch{return null}}
export function parseEmployerNews(text,firmKey,now=Date.now()){
 const source=NEWS_SOURCES[firmKey];if(!source||typeof text!=='string'||text.length>2500000)return[];
 const items=[],seen=new Set();
 function add(title,url,published){title=cleanText(title);url=validNewsUrl(cleanText(url),firmKey);if(!url||title.length<20||title.length>230||seen.has(url)||/\.pdf(?:[?#]|$)/i.test(url))return;const date=published?Date.parse(published):NaN;if(Number.isFinite(date)&&(date>now||now-date>183*86400000))return;seen.add(url);items.push({title,url,publishedAt:Number.isFinite(date)?new Date(date).toISOString():null})}
 for(const item of text.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){const tag=name=>item[1].match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i'))?.[1]||'';add(tag('title'),tag('link'),cleanText(tag('pubDate')))}
 if(!items.length){
  for(const match of text.matchAll(/<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)){
   const url=validNewsUrl(match[2],firmKey);if(!url)continue;const path=new URL(url).pathname;
   if(!/(?:press-releases?\/|newsroom\/(?:press-releases|news|stories)\/|news\/press-releases\/|newsroom\/20\d{2}\/|news\/20\d{2}\/|display-page-ndp)/i.test(path))continue;
   if(path===new URL(source.url).pathname||/\/(?:archive|contacts?|subscriptions?)\/?$/i.test(path))continue;
   const inner=match[4],heading=inner.match(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i)?.[1];
   const title=heading||((match[1]+match[3]).match(/(?:aria-label|title)=["']([^"']+)["']/i)?.[1])||inner;
   const date=inner.match(/datetime=["']([^"']+)["']/i)?.[1]||path.match(/(20\d{2})[/-](0[1-9]|1[0-2])[/-]([0-2]\d|3[01])/)?.[0]?.replaceAll('/','-');
   add(title,url,date);
  }
 }
 return items.sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')).slice(0,6);
}
export async function fetchEmployerNews(firmKey,{fetcher=fetch,now=Date.now()}={}){
 const source=NEWS_SOURCES[firmKey];if(!source)return{items:[],status:'unsupported',sourceUrl:null};
 try{let url=source.url,response;for(let i=0;i<3;i++){response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Accept:'application/rss+xml, application/xml, text/html','User-Agent':'TheDeskInterviewPreparation/1.0'}});if(response.status>=300&&response.status<400){const next=validNewsUrl(response.headers.get('location'),firmKey);if(!next)throw Error('Invalid redirect');url=next;continue}break}
 if(!response?.ok||Number(response.headers.get('content-length'))>2500000)throw Error('News unavailable');
 const items=parseEmployerNews(await response.text(),firmKey,now);return{items,status:items.length?'available':'unavailable',sourceUrl:source.newsroom};
 }catch{return{items:[],status:'unavailable',sourceUrl:source.newsroom}}
}
