const plain=s=>String(s||'').replace(/\[[^\]]*\]/g,'').replace(/^\s*[-•▪*]\s*/,'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}%£$€ ]/gu,' ').replace(/\s+/g,' ').trim();
export function rewriteSimilarity(a,b){
 const x=plain(a),y=plain(b);if(!x.length||!y.length)return 1;
 let previous=Array.from({length:y.length+1},(_,i)=>i);for(let i=1;i<=x.length;i++){const current=[i];for(let j=1;j<=y.length;j++)current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(x[i-1]===y[j-1]?0:1));previous=current;}
 const A=new Set(x.split(' ')),B=new Set(y.split(' ')),overlap=[...A].filter(word=>B.has(word)).length;
 return Math.max(1-previous[y.length]/Math.max(x.length,y.length),2*overlap/(A.size+B.size));
}
const numbers=text=>(String(text).match(/(?:£|\$|€)?\d[\d,.]*(?:%|x)?/g)||[]).map(s=>s.replace(/[.,]+$/,''));
const filler=new Set('a an the and or of to for from with in on at by as into through using used use my our your their its was were is are have has had i we they this that these those which while alongside during within across including resulting supporting contributed support assisted help helped'.split(' '));
const stem=word=>{if(/^(assist|support|contribut|help)/.test(word))return 'support';if(/^reconcil/.test(word))return 'reconcile';if(/^(built|build|develop)/.test(word))return 'build';if(/^prepar/.test(word))return 'prepare';if(/^(compar|benchmark)/.test(word))return 'compare';if(/^(analys|analyz)/.test(word))return 'analysis';return word.replace(/(?:ing|ed|s)$/,'');};
export function validateFreeLineRewrite(draft,original,evidence){
 if(!draft||typeof draft.line!=='string'||draft.line.length>1000||draft.line.trim().split(/\s+/).length>90)throw Error('A concise rewrite is required.');
 if(!evidence.includes(original)||!Array.isArray(draft.factsUsed)||!draft.factsUsed.length||draft.factsUsed.some(quote=>typeof quote!=='string'||!quote.trim()||!evidence.includes(quote)))throw Error('Rewrite facts must be exact source quotes.');
 if(rewriteSimilarity(original,draft.line)>=.85)throw Error('Rewrite must be materially different: similarity must be under 0.85.');
 const confirmed=draft.line.replace(/\[[^\]]*\]/g,'');for(const number of numbers(confirmed))if(!numbers(evidence).includes(number))throw Error('Rewrite introduced an unsupported number.');for(const number of numbers(original))if(!numbers(confirmed).includes(number))throw Error('Rewrite dropped a supported number.');
 const vocabulary=new Set(plain(evidence).split(' ').map(stem));for(const word of plain(confirmed).split(' '))if(!filler.has(word)&&!vocabulary.has(stem(word)))throw Error('Rewrite introduced wording not grounded in this CV entry: '+word);
 if(/\b(assisted|supported|shadowed|observed|helped)\b/i.test(original)&&!/\b(assisted|supported|shadowed|observed|helped|contributed)\b/i.test(confirmed))throw Error('Preserve the stated supporting role; do not claim sole ownership.');
 if(/\b(led|managed|owned|increased|reduced|saved|improved|won|secured)\b/i.test(confirmed)){for(const verb of confirmed.match(/\b(led|managed|owned|increased|reduced|saved|improved|won|secured)\b/gi)||[])if(!new RegExp('\\b'+verb+'\\b','i').test(evidence))throw Error('Rewrite introduced an unsupported achievement.');}
 return{line:draft.line.trim(),factsUsed:draft.factsUsed,similarity:rewriteSimilarity(original,draft.line)};
}
