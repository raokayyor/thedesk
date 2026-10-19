export const NEWS_SOURCES={
 'goldman-sachs':{url:'https://www.goldmansachs.com/pressroom',path:'/pressroom/'},
 'jp-morgan':{url:'https://www.jpmorganchase.com/newsroom',path:'/newsroom/(?:stories|press-releases)/'},
 'barclays':{url:'https://home.barclays/news/',path:'/news/press-releases/'},
 'hsbc':{url:'https://www.hsbc.com/news-and-views/news',path:'/news-and-views/news/'},
 'citi':{url:'https://www.citigroup.com/global/news/press-release',path:'/global/news/(?:press-release|perspectives)/'},
 'morgan-stanley':{url:'https://www.morganstanley.com/about-us-newsroom/',path:'/(?:press-releases|about-us-newsroom)/'},
 'bank-of-america':{url:'https://newsroom.bankofamerica.com/content/newsroom/press-releases',path:'/(?:content/newsroom/)?press-releases/'},
 'pwc':{url:'https://www.pwc.co.uk/press-room/press-releases.html',path:'/press-room/press-releases/'},
 'ey':{url:'https://www.ey.com/en_uk/newsroom/',path:'/en_uk/(?:newsroom|news)/\\d{4}/'},
 'rsa-intact':{url:'https://www.intactinsurance.co.uk/news/press-releases',path:'/news/(?:press-releases|company-insights|industry-insights|people-and-planet)/'},
 'legal-general':{url:'https://group.legalandgeneral.com/newsroom/press-releases',path:'/(?:newsroom|en/newsroom)/.*\\d{4}'},
 'insight-investment':{url:'https://www.insightinvestment.com/corporate/press-office/',path:'/(?:corporate/press-office/media-library/|globalassets/documents/(?:.*/)?media-library/)'},
 'blackrock':{url:'https://www.blackrock.com/corporate/newsroom/media/press-releases',path:'/corporate/(?:newsroom|investor-relations)/'}
};
export function plain(s){return String(s||'').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const x=n[0]==='x'?parseInt(n.slice(1),16):+n;return x>=0&&x<=0x10ffff?String.fromCodePoint(x):'';}).replace(/&(?:amp|quot|apos|lt|gt|nbsp|rsquo|lsquo|ndash|mdash);/g,m=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' ','&rsquo;':'’','&lsquo;':'‘','&ndash;':'–','&mdash;':'—'}[m])).replace(/\s+/g,' ').trim();}
export function parseFirmNews(html,source,now=Date.now()){
 if(typeof html!=='string'||html.length>4000000)throw Error('Invalid newsroom response');
 const base=new URL(source.url),items=[],seen=new Set();
 function add(title,link,date){title=plain(title);let url;try{url=new URL(plain(link),base);}catch{return;}const published=Date.parse(date||'');
  if(url.protocol!=='https:'||url.hostname.replace(/^www\./,'')!==base.hostname.replace(/^www\./,'')||!new RegExp(source.path).test(url.pathname)||url.pathname.replace(/\/$/,'')===base.pathname.replace(/\/$/,'')||title.length<18||title.length>230||/^(read more|learn more|view all|view press|press releases|media contact|privacy|subscribe)/i.test(title)||seen.has(url.href)||Number.isFinite(published)&&published>now)return;
  seen.add(url.href);items.push({title,url:url.href,publishedAt:Number.isFinite(published)?new Date(published).toISOString():null});
 }
 const visit=o=>{if(!o||typeof o!=='object')return;const title=o.headline||o.title||o.name,link=o.url||o.href||o.link||o.path||o.pageUrl;if(typeof title==='string'&&typeof link==='string')add(title,link,o.datePublished||o.publishDate||o.publicationDate);for(const v of Object.values(o))if(typeof v==='object')Array.isArray(v)?v.forEach(visit):visit(v);};
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(m[1]));}catch{}}
 // Read encoded data, never execute scripts from an external newsroom.
 let decoded=html;for(let i=0;i<3;i++)decoded=decoded.replace(/\\u([\da-f]{4})|\\x([\da-f]{2})/gi,(_,u,x)=>String.fromCharCode(parseInt(u||x,16))).replace(/\\(["/\\])/g,'$1');
 for(const m of decoded.matchAll(/\{[^{}]{1,12000}\}/g)){try{visit(JSON.parse(m[0]));}catch{}}
 for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const heading=m[2].match(/<h[2-5]\b[^>]*>([\s\S]*?)<\/h[2-5]>/i);let title=heading?.[1]||plain(m[2]);
  if(/^(read more|learn more|view press release|read media release)/i.test(plain(title))){const before=html.slice(Math.max(0,m.index-1500),m.index),heads=[...before.matchAll(/<h[2-5]\b[^>]*>([\s\S]*?)<\/h[2-5]>/gi)];title=heads.at(-1)?.[1]||title;}
  const articleStart=html.lastIndexOf('<article',m.index),previousEnd=html.lastIndexOf('</article>',m.index),articleEnd=html.indexOf('</article>',m.index);
  const card=articleStart>previousEnd&&m.index-articleStart<20000&&articleEnd>=m.index?html.slice(articleStart,articleEnd):m[0];
  const date=card.match(/<time\b[^>]*datetime=["']([^"']+)/i)?.[1];add(title,m[1],date);
 }
 return items.sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')).slice(0,6);
}

