export function namedCvDetails(catalog,profile={}){
 return [...new Set(catalog.filter(({quote},i)=>!/^\s*[-•]/.test(quote)&&(/^\s*[-•]/.test(catalog[i+1]?.quote||'')||/\||—|–|project|dissertation|society|club|network|coursework|university/i.test(quote))).map(({quote})=>quote.split(/\s*\|\s*|\s+[—–]\s+|,\s*|\s+\d{4}\b/)[0].trim()).filter(x=>x.length>=4&&x!==profile.name&&x!==profile.university&&!/@|^Target:|^FICTIONAL|^(projects?|education|experience|skills|activities|interests|employment|work experience)$/i.test(x)))];
}
