import {parsePart} from './full-cycle-contract.mjs';
export function buildRepairedCv({cvText,paid,profile={}}={}) {
  if(typeof cvText!=='string' || cvText.trim().length<100 || !paid) throw new Error('Complete CV and validated repair plan required');
  parsePart(JSON.stringify(paid),'repair',cvText);
  let draft=cvText;
  const seen=new Set();
  for(const repair of paid.bulletRepair) {
    if(seen.has(repair.originalBullet)) throw new Error('Duplicate source bullet');
    seen.add(repair.originalBullet);
    draft=draft.replace(repair.originalBullet,repair.exampleBullet);
  }
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
    if(!item || / — /.test(line)) {
      item={heading:line,subheading:'',bullets:[]};section.items.push(item);
    } else item.bullets.push({text:line,confidence:'ready',note:'Based on the supplied CV; verify before submitting.'});
  }
  if(section.items.length)sections.push(section);
  return {candidateName:name,targetRole:[profile.targetDivision,profile.targetFirm].filter(Boolean).join(' at '),
    sourceText:draft,sections,
    whatChangedAndWhy:paid.bulletRepair.map(b=>({change:b.cvItem,reason:b.whyThisWorks || b.currentIssue})),
    accuracyFlags:paid.bulletRepair.flatMap(b=>(b.questionsToConfirm || []).map(question=>({item:b.cvItem,question}))),buildFirst:[]};
}