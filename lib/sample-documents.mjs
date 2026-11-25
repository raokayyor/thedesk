import savedCrib from '../samples/amelia-barclays-crib.json' with {type:'json'};
import sample from '../samples/amelia-report-v3-preview.json' with {type:'json'};
import {whyFirmFor} from '../data/why-firm.mjs';
import {AMELIA_APPLICATION_SAMPLE} from '../data/amelia-application-answer.mjs';
export const SAMPLE_LABEL='Sample · Amelia Chen, Economics, Bristol → Barclays';
const firm=whyFirmFor('Barclays'),evidence=sample.cv.sections.find(s=>s.title==='Experience').items;
export function sampleDocument(tool){
 const why={title:'Why Barclays · personalise this',text:firm.hooks[0].fact+' Explain why that business mix appeals to you, then connect it to the work you want to do.',prompts:['Why does working with UK companies in an international bank appeal to you?','Connect that reason to the investment banking work you want to do.']};
 if(tool==='crib')return structuredClone(savedCrib);
 if(tool==='firm')return {title:'Your Barclays firm pack',firm:'Barclays',label:SAMPLE_LABEL,sections:[{title:'Know the firm',items:firm.hooks.filter(h=>!h.research&&!/Know a recent/.test(h.fact)).map(h=>h.fact)},why,{title:'What Barclays is really asking',text:firm.tip},{title:'Your relevant evidence',stories:evidence.map(e=>({title:e.heading.replace(/�/g,'—'),text:e.bullets.map(b=>b.text).join(' ')}))},{title:'Prepare these questions',items:['Why Barclays rather than another bank?','Tell me about a time you used analysis to make a recommendation.','Explain a valuation assumption you tested and why it mattered.']},{title:'Avoid generic reasons',items:firm.avoid},{title:'Research before the interview',items:['Check the current role description and programme invitation.','Find a dated Barclays result or transaction relevant to your team and form your own view.']}],source:'Firm facts: The Desk’s Barclays research. Personal facts: Amelia’s sample CV.'};
 if(tool==='application')return {title:'Your Barclays application draft',firm:'Barclays',label:SAMPLE_LABEL,sections:[{title:AMELIA_APPLICATION_SAMPLE.before,parts:AMELIA_APPLICATION_SAMPLE.parts},{title:'Before you submit',text:'Your draft, not your final. Add a true personal reason, check every claim and rewrite it in your own voice. Follow the employer’s instructions on AI assistance.'}],source:AMELIA_APPLICATION_SAMPLE.note};
 return null;
}
