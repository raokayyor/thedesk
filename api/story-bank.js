import {firmReason} from '../lib/why-firm.mjs';
import {whyFirmFor} from '../data/why-firm.mjs';
import {sameOrigin,sql,apiFailure} from '../lib/report-store.mjs';
import {principal,useQuota} from '../lib/value-accounts.mjs';
import {currentAccount,latestAssessment} from '../lib/accounts.mjs';
import {storyEvidenceId,storyFacts,saveStoryFact,refreshFactUses} from '../lib/story-bank.mjs';
import {applicationContext} from '../lib/application-draft-store.mjs';
import {evidenceSources,buildInterviewGuide} from '../lib/interview-evidence-guide.mjs';
import {latestCv} from '../lib/saved-cv.mjs';
import {deepFor} from '../lib/deep-assessment.mjs';
async function promptsFor(req,res,p){
 const ctx=await applicationContext(req,res),map=new Map();
 for(const programme of ctx.programmes)for(const q of programme.questions)for(const gap of ctx.build(programme,q).gaps){const item=map.get(gap.id)||{id:gap.id,prompt:gap.prompt,firm:/firm|Why /i.test(gap.prompt)?programme.firm:'',evidenceIds:gap.source?[storyEvidenceId(ctx.text,gap.source)]:[],count:0,usedIn:[]};const useKey=programme.key+':'+q.id;if(!item.usedIn.includes(useKey)){item.count++;item.usedIn.push(useKey);}map.set(gap.id,item);}
 if(ctx.row){const cv=await latestCv(ctx.row.owner_hash,ctx.row.id),deep=await deepFor(ctx.row),sources=evidenceSources(cv.text||ctx.row.input.cvText,deep);for(const question of ['Tell me about yourself.','Tell me about a time you worked in a team.','Tell me about a time you led others.','Tell me about a setback.']){const guide=buildInterviewGuide(sources,question,{firm:ctx.row.input.profile?.targetFirm||''});for(const beat of guide.examples[0]?.beats||[]){if(!beat.gap&&!beat.hasGaps)continue;const prompt=beat.text.match(/\[([^\]]+)\]/)?.[1]||beat.text,id='interview:'+prompt;if(![...map.values()].some(g=>g.prompt===prompt))map.set(id,{id,prompt,firm:/why|firm/i.test(beat.label)?ctx.row.input.profile?.targetFirm||'':'',evidenceIds:/why|firm/i.test(beat.label)?[]:[storyEvidenceId(cv.text||ctx.row.input.cvText,guide.examples[0].source)],count:1,usedIn:[question]});}}}
 return [...map.values()].sort((a,b)=>b.count-a.count).slice(0,10);
}
export default async function handler(req,res){res.setHeader('Cache-Control','private,no-store');res.setHeader('Vary','Cookie');try{
 if(!['GET','POST'].includes(req.method))return res.status(405).end();if(req.method==='POST'&&!sameOrigin(req,res))return;
 const account=await currentAccount(req);if(!account)return res.status(401).json({error:'Sign in to keep your story across devices.'});const p=await principal(req,res),facts=await storyFacts(p);
 if(req.method==='GET'){const uses=await sql().query('SELECT fact_id,surface,ref,label FROM story_uses WHERE owner=$1',[p]);const prompts=await promptsFor(req,res,p),row=await latestAssessment(account.id),cv=row?await latestCv(row.owner_hash,row.id):{text:''},sources=evidenceSources(cv.text||row?.input?.cvText||''),stories=[...new Map(sources.filter(s=>s.kind==='cv').map(s=>[s.source,{id:storyEvidenceId(cv.text||row?.input?.cvText||'',s.source),name:s.source.split(/\s+[—–]\s+/)[0],source:s.source,text:s.text}])).values()];return res.json({stories,progress:{done:Math.min(10,facts.length),total:10},facts:facts.map(f=>({...f,uses:uses.filter(u=>u.fact_id===f.id&&u.surface!=='application-gap')})),prompts,emailReady:!!(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM)});}
 if(!await useQuota('story-bank:'+p,200))return res.status(429).json({error:'Please try again tomorrow.'});const b=req.body||{};
 if(b.action==='firm'){const firm=whyFirmFor(b.firm);if(!firm)return res.status(400).json({error:'Choose a supported firm.'});const answer=firmReason(b.firm,b.selection),fact=await saveStoryFact(p,{prompt:'Why '+firm.label+'?',answer,firm:firm.label,evidenceIds:[],key:'firm:'+firm.label.toLowerCase()});return res.json({success:true,fact});}
 if(b.action==='save'){const prompts=await promptsFor(req,res,p),prompt=prompts.find(x=>x.id===b.promptId);if(!prompt)return res.status(400).json({error:'Choose one of your current story questions.'});const fact=await saveStoryFact(p,{prompt:prompt.prompt,answer:b.answer,evidenceIds:prompt.evidenceIds,firm:prompt.firm,key:'story-prompt:'+prompt.id});return res.json({success:true,fact});}
 const fact=facts.find(f=>f.id===b.id);if(!fact)return res.status(404).json({error:'This fact was not found in your story.'});
 if(b.action==='edit'){if(typeof b.answer!=='string'||b.answer.trim().length<5||b.answer.length>2000)return res.status(400).json({error:'Use 5–2,000 characters of your own true detail.'});fact.answer=b.answer.trim();await sql().query('UPDATE story_facts SET answer=$1,updated_at=now() WHERE id=$2 AND owner=$3',[fact.answer,fact.id,p]);const updated=await refreshFactUses(p,fact);return res.json({success:true,updated,message:'Updated in '+updated+' answer'+(updated===1?'':'s')});}
 if(b.action==='delete'){const updated=await refreshFactUses(p,fact,true);await sql().query('DELETE FROM story_facts WHERE id=$1 AND owner=$2',[fact.id,p]);return res.json({success:true,updated,message:'Deleted. Linked drafts now need your detail again.'});}
 return res.status(400).json({error:'Choose a supported story action.'});
 }catch(error){if(error.code==='42703')console.error('story schema mismatch',{column:error.column||String(error.message||'').match(/column ["']?([a-zA-Z_.]+)["']? does not exist/)?.[1]||'unknown',schemaMessage:String(error.message||'').slice(0,180)});if(error.status)return res.status(error.status).json({error:error.message});return apiFailure(res,error);}}
