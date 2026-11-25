import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {TRIAL_QUESTION} from '../lib/trial-analysis-guide.mjs';
const root=new URL('../',import.meta.url);
const files=['lib/interview-quick-score.mjs','lib/interview-score-policy.mjs','lib/interview-frameworks.mjs','lib/interview-story-context.mjs'];
const scorerHash=createHash('sha256').update((await Promise.all(files.map(f=>readFile(new URL(f,root),'utf8')))).join('\n')).digest('hex');
const target=new URL('samples/amelia-interview-showcase.json',root);
if(process.argv.includes('--check')){const saved=JSON.parse(await readFile(target,'utf8'));if(saved.scorerHash!==scorerHash)throw Error('Amelia showcase scores are stale. Run node scripts/build-amelia-showcase.mjs against the deployed scorer.');console.log('Showcase matches current scorer');process.exit(0);}
const before='At Redcliffe Partners I supported the team with research on software companies. I looked at the information and helped put it in a spreadsheet. We discussed which companies looked good. I just tried to help the team make a recommendation and got through it.';
const base=process.env.SHOWCASE_BASE_URL||'https://thedesk.vercel.app';let cookie='';
async function request(body){const response=await fetch(base+'/api/free-tasters'+(body?'':'?tool=interview'),{method:body?'POST':'GET',headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({tool:'interview',action:'win',inputMode:'typed',...body})}:{})});const cookies=response.headers.getSetCookie();if(cookies.length)cookie=cookies.map(c=>c.split(';')[0]).join('; ');const data=await response.json();if(!response.ok)throw Error('Live scorer failed: '+response.status+' '+(data.error||''));return data;}
const ctx=await request();if(!ctx.sample||ctx.question!==TRIAL_QUESTION)throw Error('Expected anonymous Amelia analysis trial');
const weak=await request({text:before,attemptId:'showcase-'+scorerHash+'-before'});if(!Number.isFinite(weak.win?.score)||weak.win.before!==before||!weak.win.after)throw Error('Missing scored weak answer and real rewrite');
const after=weak.win.after;const strong=await request({text:after,attemptId:'showcase-'+scorerHash+'-rewrite'});if(!Number.isFinite(strong.win?.score)||strong.win.before!==after)throw Error('Missing rewrite score');
const evidencePart=(weak.win.parts||[]).find(p=>!p.gap&&/12 UK software companies/.test(p.text)&&/flagged 4/.test(p.text));const sentences=evidencePart?.text.split(/(?<=[.!?])\s+/)||[];const fixedLine=sentences.filter(s=>/12 UK software companies|flagged 4/.test(s)).join(' ');
if(!fixedLine||!/12|4/.test(fixedLine))throw Error('Rewrite has no numerical CV evidence');
const results=[{text:before,score:weak.win.score,scores:weak.win.scores,line:'At Redcliffe Partners I supported the team with research on software companies.'},{text:after,score:strong.win.score,scores:strong.win.scores,line:fixedLine}];
await writeFile(target,JSON.stringify({question:TRIAL_QUESTION,firm:'Barclays',sample:'Amelia Chen',scoredAt:new Date().toISOString(),scorerHash,source:'Production /api/free-tasters: weak submission and its returned rewrite, both scored by quickInterviewScore / applyScorePolicy; typed answers',rewrite:weak.win, before:results[0],after:results[1]},null,2)+'\n');console.log('Real weak / rewritten scores:',results.map(r=>r.score).join(' -> '));
