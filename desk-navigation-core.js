(function(root){
 if(typeof document!=='undefined')import('/lib/tool-links.mjs');
 const groups=[
  {id:'desk',label:'Desk',icon:'desk',items:[]},
  {id:'practise',label:'Practise',icon:'prac',items:[['interview','Interview coach','Your CV, your firm, on camera','cam'],['tests','Numerical & commercial tests','Build your knowledge with fresh questions','calc'],['aptitude','Reasoning & judgement tests','Choose your firm and practise its formats','calc'],['assessment','Assessment centre hub','Prepare for the whole day','group'],['group','Group exercise','Discuss a case with three AI candidates','group'],['case','Case study','Read, recommend and present','case'],['inbox','Inbox exercise','Prioritise messages and explain your decisions','mail'],['crib','Crib sheet','Your one-page brief for the day','sheet']]},
  {id:'cv',label:'CV',icon:'sheet',items:[['report','Your CV & assessment','Your evidence, rewrites and preparation plan','sheet']]},
  {id:'community',label:'Community',icon:'comm',items:[['forum','Ask & answer','Prepare together and share questions','comm'],['trading','Trading league · Coming soon','Coming soon','calc'],['cup','Society Cup · Coming soon','Coming soon','group'],['events','Live sessions','Practitioner Q&As and firm-focused events','cam']]},
  {id:'more',label:'More',icon:'more',items:[['tracker','Application tracker','Your shortlist, stages and deadlines','apps'],['application','Applications','Your tracked firms, drafted from your CV','sheet'],['firms','Firm packs','Research the firm and its process','case'],['library','Library','DCF, technicals, tests and interview guides','sheet'],['news','News','Develop your commercial awareness','case'],['answers','Saved answers','Keep your best drafts together','sheet'],['story','Story bank','Your personal facts, reused across answers','sheet'],['account','Account','Your profile, membership and sign-in','comm']]}
 ];
 function href(key,d={}){return root.DeskToolLinks?.toolHref(key,d)||'/my.html';}

 function groupFor(path){if(/firm-interview-guides|library/.test(path))return 'more';if(/group-exercise|case-study|inbox-exercise|ac-crib|assessment-centre/.test(path))return 'practise';if(/interview|tests/.test(path))return 'practise';if(/application|tracker/.test(path))return 'more';if(/report|fullcycle|result-|deep-assessment/.test(path))return 'cv';if(/community|trading|events|challenge/.test(path))return 'community';if(/report|fullcycle|result-|news|saved-answers|deep-assessment/.test(path))return 'more';return 'desk';}
 root.DeskNavigationCore={groups,href,groupFor,memberOnly:key=>['case','inbox','library','answers','story','tests','news'].includes(key)};
})(globalThis);
