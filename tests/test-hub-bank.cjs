const fs=require('node:fs'),assert=require('node:assert/strict');
const banks=['numerical','technical'].map(name=>({name,questions:JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'))}));
let checked=0;
for(const {name,questions} of banks){assert.equal(questions.length,1032);const ids=new Set();for(const q of questions){assert(!ids.has(q.id));ids.add(q.id);assert.equal(new Set(q.options).size,4);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert(q.working.length||q.concept.length);if(name==='technical')continue;
 const n=[...q.question.replaceAll(',','').matchAll(/\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));let expected;
 switch(q.topic){
 case 'Percentage change':expected=(n[1]/n[0]-1)*100;break;
 case 'Margin change in percentage points':expected=(n[3]/n[1]-n[2]/n[0])*100;break;
 case 'Compound annual growth rate':expected=Math.round((Math.pow(n[1]/n[0],1/n[2])-1)*100);break;
 case 'Enterprise value vs equity value':expected=n[0]+n[1]-n[2];break;
 case 'EV / EBITDA valuation':expected=n[0]*n[1]-n[2];break;
 case 'Currency conversion':expected=/in GBP/.test(q.question)?n[3]/n[0]:n[3]*n[0];break;
 case 'Share of total':{const region=q.question.match(/comes from (.+)\?/)[1];expected=q.table.rows.find(r=>r[0]===region)[1]/q.table.rows.reduce((a,r)=>a+r[1],0)*100;break;}
 case 'Comparing growth rates':{const sorted=[...q.table.rows].sort((a,b)=>(b[2]/b[1])-(a[2]/a[1]));assert.equal(q.options[q.answer],sorted[0][0],q.id);checked++;continue;}
 case 'Weighted average return':expected=(n[0]*n[1]+n[2]*n[3]+n[4]*n[5])/100;break;
 case 'Compound interest':expected=n[0]*Math.pow(1+n[1]/100,n[2]);break;
 case 'Break-even volume':expected=n[0]/(n[1]-n[2]);break;
 case 'Reverse percentage':expected=n[1]/(1+n[0]/100);break;
 case 'P/E ratio':expected=n[0]/n[1];break;
 case 'Equity dilution':expected=n[0]*n[1]/(n[1]+n[2]);break;
 default:throw Error('Unchecked topic '+q.topic);
 }
 const answer=q.options[q.answer].replaceAll(',',''),match=answer.match(/[-+−]?\d+(?:\.\d+)?/);assert(match,q.id);const value=Number(match[0].replace('−','-')),dp=(match[0].split('.')[1]||'').length;assert(Math.abs(expected-value)<=0.50001*Math.pow(10,-dp),q.id+' '+q.topic+': '+expected+' vs '+value);checked++;
 }}console.log(JSON.stringify({structurallyValid:2064,numericalAnswersRecalculated:checked}));
