import {usableCvDetail} from './cv-detail.mjs';
export function namedCvDetails(catalog,profile={}){
 return [...new Set(catalog.filter(({quote},i)=>!/^\s*[-•]/.test(quote)&&(/^\s*[-•]/.test(catalog[i+1]?.quote||'')||/\||—|–|project|dissertation|society|club|network|coursework|university/i.test(quote))).map(({quote})=>quote.split(/\s*\|\s*|\s+[—–]\s+|,\s*|\s+\d{4}\b/)[0].trim()).filter(x=>usableCvDetail(x)&&x!==profile.name&&x!==profile.university&&!/@|^Target:|^FICTIONAL|^(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|^(?:Expected|Predicted)\b|^(?:19|20)\d\d\b|^(projects?|education|experience|skills|activities|interests|employment|work experience)$/i.test(x)))];
}
