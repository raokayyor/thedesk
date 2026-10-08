export function competencyOrder(route=''){
 const r=route.toLowerCase();
 if(/account|audit/.test(r))return ['Analytical ability','Technical readiness','Communication','Teamwork','Commercial awareness','Resilience','Leadership'];
 if(/sales|trading|markets/.test(r))return ['Commercial awareness','Analytical ability','Technical readiness','Resilience','Communication','Teamwork','Leadership'];
 if(/consult/.test(r))return ['Analytical ability','Communication','Teamwork','Leadership','Commercial awareness','Resilience','Technical readiness'];
 return ['Analytical ability','Technical readiness','Commercial awareness','Communication','Teamwork','Leadership','Resilience'];
}
export function competencyStatuses(competencies,route){
 const order=competencyOrder(route),lowest=[...competencies].sort((a,b)=>a.score-b.score||order.indexOf(a.name)-order.indexOf(b.name))[0];
 return new Map(competencies.map(c=>[c.name,c===lowest?'Biggest evidence gap':c.score>=70?'Strong evidence':c.score>=55?'Build on this':'Priority area']));
}
export const BANNED_STUDENT_TEXT=/\bcriteri(?:on|a)\b|scored above identifiable task level|assessors?\b|cannot be assessed|preventing assessment|unable to judge|evidence level|identifiable task level/i;
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
function named(text,detail,cv){
 const d=norm(detail),prose=norm(text),source=norm(cv);
 if(/^(projects?|education|experience|skills|activities|interests|employment|work experience)$/.test(d))return false;
 if(d.length<4||!source.includes(d)||/^(your |the |a |an )/.test(d))return false;
 if(prose.includes(d)&&(!/^[a-z ]+$/.test(detail)||d.split(' ').length>=3))return true;
 // Models sometimes cite the full heading, including the role and dates, while
 // student prose uses its employer/project name. Validate the named prefix itself.
 const prefix=d.split(/\s+[—–-]\s+|,\s*|\s+\d{4}\b/)[0].trim();
 return prefix!==d&&prefix.split(' ').length>=2&&/[A-Z]/.test(String(detail))&&source.includes(prefix)&&prose.includes(prefix);
}
export function validateStudentContent(a,cv){
 const errors=[];
 if(!named(a.deskSummary,a.summaryDetail,cv))errors.push('Summary must name a specific exact CV detail using summaryDetail.');
 if(!Array.isArray(a.priorities)||a.priorities.length!==3)errors.push('Exactly three priorities required.');
 for(const [i,p] of (a.priorities||[]).entries()){
  if(!named(p.description,p.detail,cv))errors.push(`Priority ${i+1} description is generic or its named detail is absent from the CV.`);
  if(!Array.isArray(p.competencies)||!p.competencies.length)errors.push(`Priority ${i+1} must identify the affected competencies.`);
  const severe=/no (?:\w+\s+){0,3}(method|finding|analysis|conclusion)|(?:method|finding|conclusion)[\s\S]{0,45}(?:missing|absent|unstated|unclear)|(?:missing|absent|unstated)[\s\S]{0,45}(?:method|finding|conclusion)/i.test(p.description);
  if(severe)for(const c of a.competencies||[])if(((p.competencies||[]).includes(c.name)||(c.name==='Analytical ability'&&/analys|valuat|benchmark|project|method|finding/i.test(p.title+' '+p.description)))&&c.score>=70)errors.push(`${c.name} cannot be strong while priority ${i+1} identifies missing methods or findings.`);
 }
 if((a.competencies||[]).filter(c=>named(c.reason,c.detail,cv)).length<4)errors.push('At least four competency reasons must name exact CV details.');
 for(const c of a.competencies||[])if(c.score>=70&&/no (?:\w+\s+){0,2}(method|finding|output)|(?:method|finding)[\s\S]{0,30}(missing|absent|unstated)/i.test(c.reason))errors.push(`${c.name} score contradicts its reason.`);
 const texts=[['deskSummary',a.deskSummary],...(a.priorities||[]).flatMap((p,i)=>[[`Priority ${i+1} title`,p.title],[`Priority ${i+1} description`,p.description]]),...(a.competencies||[]).flatMap(c=>[[`${c.name} reason`,c.reason],[`${c.name} nextStep`,c.nextStep]]),['CV issue',a.cvPreview?.issue],['CV placeholder',a.cvPreview?.structure]];
 for(const [field,text] of texts){const match=String(text||'').match(BANNED_STUDENT_TEXT);if(match)errors.push(`${field}: remove rubric phrase "${match[0]}"; explain the gap directly in you language.`);}
 if(!a.cvPreview?.structure?.includes('[')||/\[Your action\].*\[analysis or task\]/i.test(a.cvPreview.structure||''))errors.push('Build the placeholder from the selected bullet, preserving its task.');
 const limit=(s,n)=>String(s||'').trim().split(/\s+/).length<=n;
 const checkLength=(text,max,field)=>{if(!limit(text,max))errors.push(`${field} exceeds ${max} words; shorten it while retaining its named CV detail.`);};
 checkLength(a.deskSummary,65,'deskSummary');
 (a.priorities||[]).forEach((p,i)=>{checkLength(p.title,10,`Priority ${i+1} title`);checkLength(p.description,24,`Priority ${i+1} description`);});
 (a.competencies||[]).forEach(c=>checkLength(c.reason,24,`${c.name} reason`));
 const sample=(a.competencies||[]).find(c=>c.name==='Analytical ability');
 if(sample)checkLength(sample.nextStep,24,'Analytical ability sample');
 checkLength(a.cvPreview?.structure,48,'CV placeholder');
 return errors;
}
