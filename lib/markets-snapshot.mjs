import {sql} from './report-store.mjs';
import {rankNews,publicNews,archivedNews} from './news-library.mjs';
import {fetchEmployerNews} from './interview-news.mjs';
const roles={'Banking':'ibd','Accounting & audit':'audit','Consulting & advisory':'deals','Asset & wealth management':'asset','Insurance':'risk','Markets & trading':'markets','Risk & compliance':'risk','Technology & data':'risk'};
const firms={'Deutsche Bank':'db','Bank of America':'bofa','Goldman Sachs':'gs','J.P. Morgan':'jpm','Barclays':'barclays','UBS':'ubs','EY':'ey','PwC':'pwc'};
export const EXPLAIN={
 ai:'AI can help a business do more with the same staff, but spending money on it does not guarantee higher profits. Ask what it will earn or save, and how long that will take.',
 energy:'Energy is a cost for many companies. Higher prices can squeeze profits unless the company can charge customers more. Producers and customers can feel the same price change very differently.',
 geopolitics:'Changes in trade rules or political risk can make it harder to move goods, raise money or plan a deal. Ask which customer, supplier or source of funding is exposed.',
 deals:'A deal needs a business reason as well as a price. Ask what the buyer gains, how it will pay, and what could go wrong when the businesses are brought together.',
 markets:'Interest rates affect the cost of borrowing and what investors will pay for future profits. The useful question is who benefits, who pays more, and whether that is already reflected in prices.',
 reporting:'Reliable numbers help people make decisions. A reporting or regulatory change can mean extra checks, different disclosures or more work for the finance team. Ask what needs to change in practice.',
 payments:'A profitable company can still struggle if cash arrives too late. Lending and payment changes matter because they affect when money comes in, what borrowing costs and how much cash is available.',
 investment:'Investors are choosing between returns, risk and access to their money. A new fund or a change in flows does not automatically mean a good investment. Ask why it fits the client.',
 tax:'Tax changes can alter what a business keeps after costs and where it chooses to invest. Check who the rule applies to and when it starts before drawing a conclusion.',
 results:'Revenue is what a business sells; profit is what remains after costs. Look at both. Ask whether a change comes from prices, volumes, costs or a one-off item.'};
export function weekOf(now=new Date()){const d=new Date(now);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
export function selectStories(items,prefs,now=Date.now()){
 const selected=[],seen=new Set(),pools=[],chosenRoles=[...new Set((prefs.sectors||[]).map(s=>roles[s]).filter(Boolean))];
 if(!chosenRoles.length)chosenRoles.push('ibd');
 const keys=(prefs.organisations||[]).map(x=>firms[x]).filter(Boolean);
 for(const firm of keys.length?keys:['general'])for(const role of chosenRoles){
 pools.push(rankNews(items,{firm,role,now,limit:12}).sort((a,b)=>Number(b.scope==='firm')-Number(a.scope==='firm')).map(item=>({...item,relevance:firm!=='general'&&item.scope==='firm'?'From a firm you follow':'Wider context for your chosen sector'})));
 }
 for(let index=0;index<12;index++)for(const pool of pools){const item=pool[index];if(!item)continue;
  if(seen.has(item.url)||!item.publishedAt||now-Date.parse(item.publishedAt)>21*86400000)continue;
  seen.add(item.url);selected.push({...item,meaning:EXPLAIN[item.topic],question:item.discussionQuestions?.[1]});
 }return selected.slice(0,4);
}
let ready;export function initSnapshot(){return ready??=sql().query(`CREATE TABLE IF NOT EXISTS desk_market_editions(account_id text NOT NULL,week date NOT NULL,data jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(account_id,week))`).catch(e=>{ready=null;throw e;});}
export async function preferencesFor(accountId){
 const rows=await sql().query("SELECT data FROM desk_value_items WHERE principal=$1 AND kind='preferences' ORDER BY id DESC LIMIT 1",['account:'+accountId]);
 if(rows[0])return rows[0].data;
 const profile=(await sql().query('SELECT data FROM desk_account_profiles WHERE account_id=$1',[accountId]))[0]?.data||{};
 return{sectors:profile.sectors?.length?profile.sectors:['Banking'],organisations:profile.targetFirm?[profile.targetFirm]:[]};
}
export async function editionFor(accountId){await initSnapshot();const week=weekOf(),prefs=await preferencesFor(accountId),preferenceKey=JSON.stringify([(prefs.sectors||[]).slice().sort(),(prefs.organisations||[]).slice().sort()]),stored=(await sql().query('SELECT data FROM desk_market_editions WHERE account_id=$1 AND week=$2',[accountId,week]))[0]?.data;if(stored?.preferenceKey===preferenceKey)return stored;
 const keys=[...new Set((prefs.organisations||[]).map(x=>firms[x]).filter(Boolean))].slice(0,5);
 const [publicItems,archive,...employer]=await Promise.all([publicNews(),archivedNews(),...keys.map(key=>fetchEmployerNews(key).catch(()=>({items:[]})))]);
 const stories=selectStories([...publicItems,...archive,...employer.flatMap(x=>x.items||[])],prefs);
 const data={week,preferenceKey,preparedAt:new Date().toISOString(),sectors:prefs.sectors||[],firms:prefs.organisations||[],stories};
 if(stories.length){const rows=await sql().query("INSERT INTO desk_market_editions(account_id,week,data) VALUES($1,$2,$3::jsonb) ON CONFLICT(account_id,week) DO UPDATE SET data=CASE WHEN desk_market_editions.data->>'preferenceKey'=EXCLUDED.data->>'preferenceKey' THEN desk_market_editions.data ELSE EXCLUDED.data END RETURNING data",[accountId,week,JSON.stringify(data)]);return rows[0].data;}return data;
}
