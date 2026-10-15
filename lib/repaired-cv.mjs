import {parsePart} from './full-cycle-contract.mjs';
export function buildRepairedCv({cvText,paid,profile={}}={}) {
  if(typeof cvText!=='string' || cvText.trim().length<100 || !paid) throw new Error('Complete CV and validated repair plan required');
  paid=parsePart(JSON.stringify(paid),'repair',cvText);
  let draft=cvText;
  const seen=new Set();
  for(const repair of paid.bulletRepair) {
    if(seen.has(repair.originalBullet)) throw new Error('Duplicate source bullet');
    seen.add(repair.originalBullet);
    draft=draft.replace(repair.originalBullet,repair.exampleBullet);
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
      item.bullets.push({text:line,confidence:open?'needs_confirmation':'ready',rewritten:hits.length>0,note:open?`Answer the ${open} confirm question${open>1?'s':''} before you submit.`:'Based on the supplied CV; check it before you submit.'});
    }
  }
  if(section.items.length)sections.push(section);
  return {candidateName:name,targetRole:[profile.targetDivision,profile.targetFirm].filter(Boolean).join(' at '),
    sourceText:draft,sections,
    whatChangedAndWhy:paid.bulletRepair.map(b=>({change:b.cvItem,reason:b.whyThisWorks || b.currentIssue})),
    accuracyFlags:paid.bulletRepair.flatMap(b=>(b.questionsToConfirm || []).map(question=>({item:b.cvItem,question}))),removed,buildFirst:[]};
}

