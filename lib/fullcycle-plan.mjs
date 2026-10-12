export function fullCyclePlan(result={}) {
 const score=Number(result.overallScore||0);
 const stage=score<50?'foundations':score<65?'strengthen':score<75?'close-gaps':'refine';
 const b=result.breakdown||{},w={application:30,ats:10,competency:25,numerical:15,technical:20,...result.weights};
 const ratio=k=>Math.max(0,Math.min(1,Number(b[k]||0)/Number(w[k]||1)));
 const gaps=['application','numerical','technical','competency','ats'].sort((a,c)=>ratio(a)-ratio(c));
 const source=String(result.cvPreview?.source||'your existing experience').replace(/,\s*\d{4}.*$/,'');
 const titles={foundations:'Build your foundations.',strengthen:'Strengthen your application.', 'close-gaps':'Close the remaining gaps.',refine:'Refine your application. Prepare to defend it.'};
 const intros={foundations:'Build evidence from your existing experience and learn the numerical and commercial foundations before applying.',strengthen:'Make your contribution clearer and work on the preparation gaps holding your application back.', 'close-gaps':'Focus on the remaining weaknesses, then recheck your application before submitting.',refine:'Refine your strongest evidence and practise explaining your methods, decisions and conclusions in interview.'};
 const actions={
 application:'Develop clearer CV evidence from '+source+'.',
 competency:'Build specific examples of your contribution, decisions and outcomes.',
 ats:'Tailor your CV language and readable sections to your chosen role.',
 numerical:'Practise the numerical topics you missed, then test yourself under time pressure.',
 technical:'Build your commercial and technical knowledge for your chosen route.'
 };
 const work=gaps.filter(k=>ratio(k)<.8).slice(0,2);
 const items=work.map(k=>actions[k]);
 if(items.length<2)items.push(stage==='refine'?'Prepare for interview questions drawn from your CV.':'Strengthen your examples for the roles you want.');
 if(items.length<2)items.push('Practise explaining your methods, decisions and conclusions.');
 items.push('Track your progress with two readiness rechecks.');
 const paths={foundations:['Starting point','Build foundations','Recheck readiness'],strengthen:['Strengthen evidence','Prepare for tests','Recheck readiness'],'close-gaps':['Close priority gaps','Check your application','Recheck readiness'],refine:['Refine evidence','Practise interviews','Recheck readiness']};
 return {stage,title:titles[stage],intro:intros[stage],focus:gaps[0],gaps,items,path:paths[stage]};
}
