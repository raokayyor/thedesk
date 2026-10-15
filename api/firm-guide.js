import {ownedRecord,hasAccess,apiFailure} from '../lib/report-store.mjs';
import {FIRM_GUIDES} from '../data/firm-guides.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');if(req.method!=='GET')return res.status(405).end();
 const firm=FIRM_GUIDES.find(f=>f.slug===req.query.firm);if(!firm)return res.status(404).json({error:'Guide unavailable.'});
 try{const row=await ownedRecord(req,res,req.query.id);if(!row||!await hasAccess(row))return res.status(402).json({error:'Open from your paid Full Cycle assessment.'});
 return res.json({firm:firm.name,tasks:[
 {title:'1. Choose the business, then the role',detail:'For '+firm.name+', select one actual programme from the official careers page. Record the team, location, eligibility and closing information from that listing. In two sentences, describe who the team serves and what it does. Do not borrow requirements from another location or programme.'},
 {title:'2. Build your “why this firm?” answer',detail:firm.focus+' Use this structure: a specific detail from the firm’s own material; why that interests you; a true example from your own experience; what you want to learn in the role. Check every fact and avoid claiming you spoke to someone unless you did.'},
 {title:'3. Practise a client problem',detail:firm.exercise+' Spend 10 minutes on your answer, then record a 90-second explanation. State your assumptions, the evidence you would request and one reason your first answer might be wrong.'},
 {title:'4. Connect your evidence',detail:'Choose two real examples from your CV: one showing analysis or judgement, another showing collaboration or communication. For each, state your own action, the supported result and what remains unknown. '+firm.prompt},
 {title:'5. Prepare for the confirmed stages',detail:'Read your actual assessment invitation and the current vacancy. Make a list of the stated stages, permitted tools, timing and adjustments process. Practise relevant numerical, written or interview tasks in the Test Hub and your dashboard. This guide does not assert a fixed recruitment process.'}
 ]});}catch(e){return apiFailure(res,e);}
}

