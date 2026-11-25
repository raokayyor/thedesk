import {readFile} from 'node:fs/promises';
import {currentAccount,entitlement} from '../lib/accounts.mjs';
import {TOOL_LINKS,TOOL_FILES} from '../lib/tool-links.mjs';
import {apiFailure} from '../lib/report-store.mjs';
export default async function handler(req,res){res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');if(!['GET','HEAD'].includes(req.method))return res.status(405).end();try{
 const file=String(req.query.file||'');let key=TOOL_FILES[file];if(file==='members-only.html')key=({interviews:'interview',assessmentCentres:'assessment',applicationHelp:'application'}[req.query.feature]||req.query.feature);if(!Object.hasOwn(TOOL_LINKS,key))return res.status(404).end();if(!key)return res.status(404).end();
 const account=await currentAccount(req),member=!!account&&(await entitlement(account.id)).active;
 if(TOOL_LINKS[key].public){res.setHeader('Location',TOOL_LINKS[key].path);return res.status(303).end();}
 if(member&&file==='members-only.html'){res.setHeader('Location',TOOL_LINKS[key].full||TOOL_LINKS[key].path);return res.status(303).end();}
 if(!member&&key==='interview'&&file!=='interview-start.html'&&String(req.query.ready||'')!=='1'){const q=new URLSearchParams(Object.entries(req.query).filter(([k])=>k!=='file'));q.set('trial','1');res.setHeader('Location','/interview-start.html?'+q);return res.status(303).end();}
 if(member&&key==='practitioners'){res.setHeader('Location','/my.html#practitionerPanel');return res.status(303).end();}
 let html=await readFile(new URL('../'+(member?(file==='cv.html'?'cv-editor.html':file==='crib-sheet.html'?'ac-crib.html':file):file==='interview-start.html'?'interview-start.html':'trial-tool.html'),import.meta.url),'utf8');
 if(!member&&file==='interview-start.html')html=html.replace('<script src="/tool-preview-access.js"></script>','').replace('<body>','<body data-trial-setup="1">').replace('</body>','<script src="/interview-trial-setup.js"></script></body>');
 if(!member)html=html.replace('data-trial-engine=""','data-trial-engine="'+(key==='aptitude'&&req.query.type==='verbal'?'verbal':TOOL_LINKS[key].engine)+'"').replace('data-trial-key=""','data-trial-key="'+key+'"');
 else html=html.replace('</head>','<link rel="stylesheet" href="/trial-mode.css"></head>').replace('</body>','<script type="module" src="/trial-carryover.js"></script></body>');
 res.setHeader('Content-Type','text/html; charset=utf-8');return req.method==='HEAD'?res.end():res.send(html);
 }catch(error){return apiFailure(res,error)}}
