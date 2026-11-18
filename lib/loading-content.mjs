import {LOADING_INSIGHTS} from '../data/loading-insights.mjs';
import {TESTIMONIALS} from '../data/testimonials.mjs';
export function loadingDeck(member=null,random=Math.random){
 const seen=new Set(),quotes=TESTIMONIALS.filter(q=>{if(seen.has(q.quote))return false;seen.add(q.quote);return true}).map((q,i)=>({id:'quote-'+i,kind:'quote',title:'From preparation to an offer',text:q.quote,source:[q.name,q.uni,q.outcome].filter(Boolean).join(' · '),audience:'all'}));
 const valid=[...LOADING_INSIGHTS,...quotes].filter(x=>x.audience==='all'||(member===true&&x.audience==='member')||(member===false&&x.audience==='free'));
 const pools={};for(const item of valid)(pools[item.kind]??=[]).push(item);
 for(const pool of Object.values(pools))for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 const deck=[],order=['tip','stat','tip','quote','tip','offer'];while(Object.values(pools).some(p=>p.length))for(const kind of order){if(pools[kind]?.length)deck.push(pools[kind].pop())}return deck;
}
