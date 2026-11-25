// The single URL catalogue. Browser links are convenience; tool-entry checks entitlement again.
export const TOOL_LINKS={
 interview:{path:'/interview.html',full:'/interview-start.html',engine:'interview'},
 tests:{path:'/tests.html',engine:'tests'},aptitude:{path:'/practice-tests.html',engine:'sjt'},
 application:{path:'/applications.html',engine:'application'},cv:{path:'/cv.html',full:'/cv-editor.html',engine:'cv'},
 assessment:{path:'/assessment-centre.html',engine:'group'},group:{path:'/group-exercise.html',engine:'group'},
 case:{path:'/case-study.html',engine:'case'},inbox:{path:'/inbox-exercise.html',engine:'inbox'},
 crib:{path:'/ac-crib.html',engine:'crib'},firms:{path:'/firm-interview-guides.html',engine:'firm'},
 answers:{path:'/saved-answers.html',engine:'answers'},story:{path:'/your-story.html',engine:'story'},
 library:{path:'/library.html',engine:'library'},practitioners:{path:'/practitioners.html',full:'/my.html#practitionerPanel',engine:'practitioners'},
 tracker:{path:'/tracker.html',public:true},forum:{path:'/community.html',public:true},events:{path:'/events.html',public:true},
 news:{path:'/news.html',public:true},trading:{path:'/trading.html',public:true},cup:{path:'/trading.html#society-cup',public:true},
 account:{path:'/desk-section.html?view=account',public:true},desk:{path:'/my.html',public:true}
};
export function toolHref(key,tier={},query={}){
 if(key==='report'&&!tier.member)return '/assessment-start.html?from=cv';
 if(key==='report')return /^\/(?:fullcycle|deep-assessment|result-final-design)\.html\?id=[a-f0-9]{48}(?:#[\w-]+)?$/.test(tier.report?.url||'')?tier.report.url:'/assessment-start.html';
 const t=TOOL_LINKS[key];if(!t)return '/my.html';
 const url=new URL(key==='interview'?(query.ready||query.review||query.build?t.path:t.full):tier.member?t.full||t.path:t.path,'https://desk.invalid');
 if(!t.public&&!tier.member){url.searchParams.set('trial','1');if(tier.explore)url.searchParams.set('explore','1');}
 for(const [k,v]of Object.entries(query))if(v!=null&&v!=='')url.searchParams.set(k,String(v));
 return url.pathname+url.search+url.hash;
}
export const TOOL_FILES=Object.fromEntries(Object.entries(TOOL_LINKS).filter(([,t])=>!t.public).flatMap(([key,t])=>[t.path,t.full].filter(p=>p&&p.endsWith('.html')).map(p=>[p.slice(1),key])));
TOOL_FILES['interview-start.html']='interview';TOOL_FILES['cv-editor.html']='cv';TOOL_FILES['application-help.html']='application';TOOL_FILES['ac-start.html']='assessment';TOOL_FILES['crib-sheet.html']='crib';
const shared={TOOL_LINKS,TOOL_FILES,toolHref};globalThis.DeskToolLinks=shared;
if(typeof document!=='undefined')document.dispatchEvent(new Event('desk:linksready'));
