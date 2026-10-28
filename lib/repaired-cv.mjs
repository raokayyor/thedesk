import {parsePart} from './full-cycle-contract.mjs';
export function buildRepairedCv({cvText,paid,profile={},experience=null}={}) {
  if(typeof cvText!=='string' || cvText.trim().length<100 || !paid) throw new Error('Complete CV and validated repair plan required');
  paid=parsePart(JSON.stringify(paid),'repair',cvText,experience,{allowPartial:true});
  let draft=cvText;
  const merged=[];
  const seen=new Set();
  for(const repair of paid.bulletRepair) {
    if(seen.has(repair.originalBullet)) throw new Error('Duplicate source bullet');
    seen.add(repair.originalBullet);
    draft=draft.replace(repair.originalBullet,repair.exampleBullet);
  }
  // A generic summary can borrow a detailed adjacent line. Keep the complete
  // source line once rather than dropping it on a partial word-overlap match.
  for(const repair of paid.bulletRepair) {
    if(!/^(Supported|Assisted|Helped)\b/i.test(repair.originalBullet)||/\d/.test(repair.originalBullet)||repair.originalBullet.split(/\s+/).length>20)continue;
    for(const fact of repair.factsUsed||[]) {
      if(fact===repair.originalBullet||/ — /.test(fact))continue;
      const lines=draft.split('\n'),a=lines.indexOf(repair.exampleBullet),b=lines.indexOf(fact);
      if(a<0||b<0||Math.abs(a-b)>3||lines.slice(Math.min(a,b)+1,Math.max(a,b)).some(l=>/ — |^[A-Z &]{4,}$/.test(l.trim())))continue;
      const tokens=s=>new Set(s.toLowerCase().match(/[a-z0-9]{3,}/g)||[]),A=tokens(repair.exampleBullet),B=tokens(fact);
      if(A.size&&[...A].filter(x=>B.has(x)).length/A.size>=0.5){
        lines[a]=fact;lines.splice(b,1);draft=lines.join('\n');
        merged.push({text:repair.originalBullet,reason:'Replaced the generic summary with the complete detailed source evidence, shown once.'});break;
      }
    }
  }
  // v3: remove sentences the report itself says to cut, but only exact, number-free sentences (disclaimers, generic filler).
  const removed=[];
  for(const c of paid.evidenceHierarchy?.reduceOrCut||[]) {
    for(const phrase of String(c.evidence||'').split(' / ').map(s=>s.trim()).filter(s=>s.length>12)) {
      if(/\d/.test(phrase) || !draft.includes(phrase)) continue;
      const lines=draft.split('\n');
      const idx=lines.findIndex(l=>l.includes(phrase));
      if(/ — /.test(lines[idx]) && lines[idx].trim()===phrase) continue; // never delete a role heading
      lines[idx]=lines[idx].replace(phrase,'').replace(/\s{2,}/g,' ').trim();
      draft=lines.filter((l,i)=>i!==idx||l).join('\n');
      removed.push({text:phrase,reason:c.whyReduce||''});
    }
  }
  const needsConfirm=new Map(paid.bulletRepair.map(b=>[b.exampleBullet,(b.questionsToConfirm||[]).length]));
  const sections=[];
  const headings=/^(EDUCATION|EXPERIENCE|PROJECTS|ACTIVITIES|SKILLS|QUALIFICATIONS|EMPLOYMENT|WORK HISTORY|CONTACT)$/i;
  let section={title:'Contact',items:[]}, item=null;
  const name=profile.name || draft.split('\n')[0].trim();
  for(const raw of draft.split('\n')) {
    const line=raw.trim();if(!line || line===name)continue;
    if(headings.test(line)) {
      if(section.items.length)sections.push(section);
      section={title:line.charAt(0)+line.slice(1).toLowerCase(),items:[]};item=null;continue;
    }
    const isRoleHeading=/ — /.test(line) && /(19|20)\d\d|present/i.test(line) && !/\.\s+[A-Z]/.test(line) && line.length<120;
    if(!item || isRoleHeading) {
      item={heading:line,subheading:'',bullets:[]};section.items.push(item);
    } else {
      const hits=[...needsConfirm.entries()].filter(([ex])=>ex&&line.includes(ex));
      const open=hits.reduce((s,[,n])=>s+n,0);
      item.bullets.push({text:line,confidence:open?'needs_confirmation':'ready',rewritten:hits.some(([text])=>paid.bulletRepair.some(b=>b.exampleBullet===text&&b.exampleBullet!==b.originalBullet&&b.rewriteStatus!=='needs_details')),note:open?`Answer the ${open} confirm question${open>1?'s':''} before you submit.`:'Based on the supplied CV; check it before you submit.'});
    }
  }
  if(section.items.length)sections.push(section);
  return {candidateName:name,targetRole:[profile.targetDivision,profile.targetFirm].filter(Boolean).join(' at '),
    sourceText:draft,sections,
    whatChangedAndWhy:paid.bulletRepair.filter(b=>b.exampleBullet!==b.originalBullet&&b.rewriteStatus!=='needs_details').map(b=>({change:b.cvItem,reason:b.whyThisWorks || b.currentIssue})),
    accuracyFlags:[...(paid.cvEvidenceGaps||[]),...paid.bulletRepair.flatMap(b=>(b.questionsToConfirm || []).map(question=>({item:b.cvItem,question})))],removed:[...removed,...merged],buildFirst:[]};
}
