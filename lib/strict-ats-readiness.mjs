import {parseCv} from './cv-fault-framework.mjs';
import {routeTerms} from './ats-readiness.mjs';
export const STRICT_ATS_VERSION='five-checks-v1';
export function displayJobRole(role=''){
 const clean=String(role).replace(/\([^)]*\)|\[[^\]]*\]/g,'').replace(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:19|20)\d{2}.*$/i,'').replace(/\b(?:19|20)\d{2}.*$/,'').replace(/[\s,|·—–-]+$/,'').trim();
 const parts=clean.split(/\s*[·,|—–]\s*/).filter(Boolean),job=/\b(?:intern|analyst|assistant|associate|manager|consultant|trainee|clerk)\b/i;
 if(parts.length<2)return clean;
 return job.test(parts[1])&&!job.test(parts[0])?`${parts[1]} · ${parts[0]}`:`${parts[0]} · ${parts[1]}`;
}
export function strictAtsReadiness(cvText='',profile={},upload={}){
 const cv=parseCv(cvText),experience=cv.lines.filter(l=>['experience','internship'].includes(l.section)),claims=cv.lines.filter(l=>['experience','internship','positions'].includes(l.section));
 const norm=t=>String(t).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const terms=routeTerms(profile),keyword=experience.some(l=>terms.some(t=>(' '+norm(l.text)+' ').includes(' '+norm(t)+' ')));
 const quantified=claims.filter(l=>/\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand)\b/i.test(l.text.replace(/\b(?:19|20)\d{2}\b/g,'').replace(/\b[12][:.][12]\b/g,''))).length>=3;
 const headings=/^\s*(?:education|academic background)\s*$/im.test(cvText)&&/^\s*(?:work experience|experience|professional experience|employment|internships?)\s*$/im.test(cvText)&&/^\s*(?:technical skills|skills(?: and interests)?)\s*$/im.test(cvText);
 const roles=[...new Set(experience.map(l=>l.role).filter(Boolean))],raw=String(cvText).split(/\r?\n/);
 const dates=roles.map(r=>{const at=raw.findIndex(l=>l.trim()===r);return [r,...raw.slice(at+1,at+3).filter(l=>!/^\s*[-•]/.test(l))].join(' ');});
 const style=t=>/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i.test(t)?'month':/\b\d{1,2}[/.-]\d{4}/.test(t)?'numeric':'year';
 const consistent=roles.length>0&&roles.every((r,i)=>displayJobRole(r).includes(' · ')&&/\b(?:19|20)\d{2}\b/.test(dates[i]))&&new Set(dates.map(style)).size===1;
 const checks=[{id:'readability',passed:['pdf','docx'].includes(upload?.kind)&&upload?.readabilityPassed===true},{id:'experienceTerms',passed:keyword},{id:'threeQuantifiedLines',passed:quantified},{id:'standardHeadings',passed:headings},{id:'consistentDates',passed:consistent}];
 const passed=checks.filter(c=>c.passed).length;
 return {version:STRICT_ATS_VERSION,level:passed===5?'Strong':passed===4?'Medium':'Low',passed,checks,methodology:'Five checks: verified file extraction, route terms in experience, three quantified lines, standard headings, consistent role dates. Pasted text fails file readability. Extraction does not verify original visual layout or predict an employer decision.'};
}
