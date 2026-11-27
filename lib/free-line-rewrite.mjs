const plain=s=>String(s||'').replace(/\[[^\]]*\]/g,'').replace(/^\s*[-•▪*]\s*/,'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}%£$€ ]/gu,' ').replace(/\s+/g,' ').trim();
export function rewriteSimilarity(a,b){
 const x=plain(a),y=plain(b);if(!x.length||!y.length)return 1;
 let previous=Array.from({length:y.length+1},(_,i)=>i);for(let i=1;i<=x.length;i++){const current=[i];for(let j=1;j<=y.length;j++)current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(x[i-1]===y[j-1]?0:1));previous=current;}
 const A=new Set(x.split(' ')),B=new Set(y.split(' ')),overlap=[...A].filter(word=>B.has(word)).length;
 return Math.max(1-previous[y.length]/Math.max(x.length,y.length),2*overlap/(A.size+B.size));
}
const numbers=text=>(String(text).match(/(?:£|\$|€)?\d[\d,.]*(?:%|x)?/g)||[]).map(s=>s.replace(/[.,]+$/,''));
export function validateFreeLineRewrite(draft,original,evidence){
 if(!draft||typeof draft.line!=='string'||draft.line.length>1000||draft.line.trim().split(/\s+/).length>90)throw Error('A concise rewrite is required.');
 if((draft.line.match(/\[[^\]]*\]/g)||[]).length>2)throw Error('Use at most two amber gaps.');
 if(!evidence.includes(original)||!Array.isArray(draft.factsUsed)||!draft.factsUsed.length||draft.factsUsed.some(quote=>typeof quote!=='string'||!quote.trim()||!evidence.includes(quote)))throw Error('Rewrite facts must be exact source quotes.');
 if(rewriteSimilarity(original,draft.line)>=.85)throw Error('Rewrite must be materially different: similarity must be under 0.85.');
 const confirmed=draft.line.replace(/\[[^\]]*\]/g,'');for(const number of numbers(confirmed))if(!numbers(evidence).includes(number))throw Error('Rewrite introduced an unsupported number.');for(const number of numbers(original))if(!numbers(confirmed).includes(number))throw Error('Rewrite dropped a supported number.');
 for(const tool of confirmed.match(/\b(?:Excel|PowerPoint|Python|SQL|Bloomberg|DCF|SPSS|Stata|Tableau|VBA)\b/gi)||[])if(!new RegExp('\\b'+tool+'\\b','i').test(evidence))throw Error('Rewrite introduced an unsupported tool or method.');
 for(const tool of original.match(/\b(?:Excel|PowerPoint|Python|SQL|Bloomberg|DCF|SPSS|Stata|Tableau|VBA)\b/gi)||[])if(!new RegExp('\\b'+tool+'\\b','i').test(confirmed))throw Error('Rewrite dropped a supported tool or method.');
 if(/\b(assisted|supported|shadowed|observed|helped)\b/i.test(original)&&!/\b(assisted|supported|shadowed|observed|helped|contributed)\b/i.test(confirmed))throw Error('Preserve the stated supporting role; do not claim sole ownership.');
 if(/\b(led|managed|owned|increased|reduced|saved|improved|won|secured)\b/i.test(confirmed)){for(const verb of confirmed.match(/\b(led|managed|owned|increased|reduced|saved|improved|won|secured)\b/gi)||[])if(!new RegExp('\\b'+verb+'\\b','i').test(evidence))throw Error('Rewrite introduced an unsupported achievement.');}
 return{line:draft.line.trim(),factsUsed:draft.factsUsed,similarity:rewriteSimilarity(original,draft.line)};
}

// A short supporting-task fragment cannot support invented achievements. Use a
// fixed, explicitly incomplete scaffold for this narrow grammatical form.
export function shortSupportingRewrite(original,evidence){
 if(String(original).trim().split(/\s+/).length>5)return null;
 const match=String(original).trim().match(/^(?:helped|assisted) with ([\p{L}][\p{L} &'’-]*?)[.!]?$/iu);
 if(!match||match[1].split(/\s+/).length>3)return null;
 try{return {...validateFreeLineRewrite({line:'Contributed to '+match[1]+' by [what you personally did], with [scope and confirmed outcome, if any].',factsUsed:[original]},original,evidence),needsFacts:true,method:'supporting-task-scaffold-v1'};}catch{return null;}
}

// A list of software plus soft claims supplies no action or achievement. Keep
// only the listed software as confirmed wording and ask for evidence in gaps.
export function listedSkillRewrite(original,evidence){
 const source=String(original).trim();
 if(!/^Microsoft Office(?:\s*[,;]\s*(?:hard[ -]?working|team player)){1,2}[.!]?$/i.test(source))return null;
 try{return {...validateFreeLineRewrite({line:'Microsoft Office: [a specific task and what you personally did], with [scope and confirmed outcome, if any].',factsUsed:[original]},original,evidence),needsFacts:true,method:'listed-software-scaffold-v1'};}catch{return null;}
}
