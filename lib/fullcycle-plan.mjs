export function fullCyclePlan(result={}){
 const score=Number(result.overallScore||0),stage=score<50?'foundations':score<75?'repair':'refine';
 const b=result.breakdown||{},w=result.weights||{},ratio=k=>Number(w[k])>0?Number(b[k]||0)/Number(w[k]):1;
 const gaps=['application','numerical','technical','competency','ats'].sort((a,c)=>ratio(a)-ratio(c));
 const source=String(result.cvPreview?.source||'your existing experience').replace(/,\s*\d{4}.*$/,'');
 const titles={foundations:'Build from where you are.',repair:'Strengthen the gaps holding your application back.',refine:'Sharpen your application. Prepare to defend it.'};
 const knowledge=ratio('numerical')<.7||ratio('technical')<.7;
 const first=ratio('numerical')<.7&&ratio('technical')<.7?'Learn core numerical and commercial concepts, with practice.':knowledge?(ratio('numerical')<=ratio('technical')?'Learn core numerical concepts, with practice.':'Build your commercial and technical knowledge for your chosen route.'):'Refine your strongest examples for the roles you want.';
 const second=stage==='refine'&&!knowledge?'Prepare for interview questions drawn from your CV.':'Develop clearer CV evidence from '+source+'.';
 return {stage,title:titles[stage],focus:gaps[0],gaps,items:[first,second,'Track your progress with two readiness rechecks.'],intro:stage==='foundations'?'Build your evidence and knowledge step by step before applying.':stage==='repair'?'Work on the specific evidence and knowledge gaps in your result.':'Refine a strong application and prepare to explain your decisions, methods and conclusions.'};
}
