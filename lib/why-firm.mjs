import {cleanSpokenExcerpt} from './interview-polish.mjs';
import {whyFirmFor,GENERIC_AVOID} from '../data/why-firm.mjs';
export const WHY_FIRM_COPY_APPROVED=true; // Approved by Rao on 24 November 2026.
const negative=/cannot confirm|not confirmed|did not|no transaction|no client|no .*was confirmed/i;
export function ownProof(sources=[]) {
 return sources.filter(s=>s?.text).flatMap(s=>s.text.split(/(?<=[.!?])\s+|\n/).map(text=>({...s,text}))).filter(s=>!negative.test(s.text)&&/researched|analysed|analyzed|built|trained|flagged|presented|organised|reconciled|led|created/i.test(s.text)&&s.text.length>20)
 .sort((a,b)=>((/\d/.test(b.text)?3:0)+(/flagged|researched|analysed|reconciled/.test(b.text)?4:0))-((/\d/.test(a.text)?3:0)+(/flagged|researched|analysed|reconciled/.test(a.text)?4:0)))[0]||null;
}
export function whyFirmDraft({firm,hookIndex=0,sources=[],reason=''}) {
 const pack=whyFirmFor(firm);if(!pack)return null;
 const hook=pack.hooks[hookIndex];if(!hook)return null;const proof=ownProof(sources);
 const parts=[hook.research?{gap:true,text:'Add a dated firm detail you have checked.'}:{text:hook.fact,firmFact:true,hookIndex},
 reason.trim()?{text:reason.trim(),studentAnswer:true}:{gap:true,text:'Why does this matter to you?'},
 proof?{text:cleanSpokenExcerpt(proof.text),sourceId:proof.id,sourceQuote:proof.text,source:proof.source}:{gap:true,text:'Add one genuine example from your CV.'}];
 return {firm:pack.label,hookIndex,parts,text:parts.map(p=>p.gap?'['+p.text+']':p.text).join(' '),proof};
}
export function whyFirmAvoidFix(transcript,firm) {
 const pack=whyFirmFor(firm);if(!pack)return null;
 const text=String(transcript||'').toLowerCase().replace(/[’‘]/g,"'");
 const phrase=[...pack.avoid,...GENERIC_AVOID,'a great bank','strong reputation','always been interested'].find(p=>text.includes(p.toLowerCase().replace(/[’‘]/g,"'")));
 return phrase?{title:'Make your reason specific to '+pack.label,quote:phrase,action:'You said “'+phrase+'”. That fits many firms. '+pack.angle,firm:pack.label}:null;
}

export function firmReason(firm,selection) {
 const pack=whyFirmFor(firm),hook=pack?.hooks[selection?.hookIndex];
 if(!hook||!Number.isInteger(selection.hookIndex)||typeof selection.reason!=='string'||selection.reason.trim().length<10||selection.reason.length>700)throw Error('Choose a firm angle and add your own reason (10–700 characters).');
 return (hook.research?'':hook.fact+' ')+selection.reason.trim();
}
