// Weeks 2–4 of the Full Cycle plan. Built by the server, not the model, so nothing is invented.
// Week 1 is the model's sevenDayActionPlan.
// Topic links point at the Test Hub banks. If the bank changes, update HUB_TOPICS.
export const HUB_TOPICS={
  'Equity dilution':{type:'numerical',topic:'Equity dilution'},
  'Percentage fall':{type:'numerical',topic:'Percentage change'},
  'Percentage growth':{type:'numerical',topic:'Percentage change'},
  'Net debt':{type:'numerical',topic:'Enterprise value vs equity value'},
  'EV / EBITDA valuation':{type:'numerical',topic:'EV / EBITDA valuation'},
  'Margin change in percentage points':{type:'numerical',topic:'Margin change in percentage points'},
  'Strategic buyer in M&A':{type:'technical',route:'investment_banking',topic:'M&A'},
  'EBITDA definition':{type:'technical',route:'investment_banking',topic:'EBITDA'},
  'Rate impact on borrowing costs':{type:'technical',route:'commercial_general',topic:'Interest rates'},
  'Credit spreads and credit risk':{type:'technical',route:'commercial_general',topic:'Credit risk'}
};
const ROUTE_KEYS={'investment banking':'investment_banking','accounting':'accounting_audit','audit':'accounting_audit','asset management':'asset_management','markets':'markets','sales & trading':'markets'};
export function hubLink(t){
  if(!t)return '/test-hub.html';
  return '/test-hub.html?type='+t.type+(t.route?'&route='+t.route:'')+'&topic='+encodeURIComponent(t.topic);
}
export function buildThirtyDayPlan({quiz={},profile={},firm=null,interviewQuestions=[]}={}){
  const missed=(quiz.missed||[]).map(m=>m.topic);
  const div=String(profile.targetDivision||profile.targetSector||'').toLowerCase();
  const route=Object.entries(ROUTE_KEYS).find(([k])=>div.includes(k))?.[1]||'commercial_general';
  const drills=missed.map(t=>({label:`Drill: ${t}`,href:hubLink(HUB_TOPICS[t])}));
  return [
    {week:'Week 2',focus:'Make your technical gaps automatic',sessions:[
      ...drills.slice(0,4).map(d=>({...d,minutes:20,detail:'One 10-question set in practice mode. Repeat until you score 9/10 twice.'})),
      {label:'Timed numerical set',href:'/test-hub.html?type=numerical',minutes:20,detail:'One mixed set in timed mode, three times this week. Note your time per question.'}
    ],deliverable:'Each gap topic at 9/10 or better, twice, in practice mode.'},
    {week:'Week 3',focus:'Interview out loud',sessions:[
      {label:'Answer your interview questions aloud',href:'#interview',minutes:45,detail:`Record yourself answering ${interviewQuestions.length||3} questions with the 90-second timer, then compare with the strong answer.`},
      {label:'Say your competency answers',href:'#competencies',minutes:40,detail:'Say your two lowest competency answers without notes. Fill in every [confirm] first.'},
      {label:'Route technical set',href:'/test-hub.html?type=technical&route='+route,minutes:30,detail:'Two 10-question sets for your route, in timed mode.'},
      ...(firm?[{label:`${firm.firm}: prepare for its process`,href:'#firm',minutes:30,detail:'Check the official vacancy and your assessment invitation against the dated process notes, then prepare for the confirmed stages.'}]:[])
    ],deliverable:'Recordings of you answering all the interview questions, and a confident answer for your two weakest competencies.'},
    {week:'Week 4',focus:'Recheck, then apply',sessions:[
      {label:'Recheck 1',href:'#submit',minutes:20,detail:'Upload your updated CV and retake the tests. See what moved.'},
      {label:'Ask your practitioner question',href:'#ask',minutes:10,detail:'Ask about whatever the recheck still shows as weak.'},
      {label:'Review your firm motivation',href:firm?'#firm':'#interview',minutes:30,detail:'Practise your answer aloud and check every firm-specific claim against its official website.'},
      {label:'Check deadlines and submit when ready',href:'/tracker.html',minutes:30,detail:'Check the live deadline on the employer’s site. Bring this forward if it falls before Week 4; do not delay a suitable application just to finish the plan.'}
    ],deliverable:'Application submitted, with one recheck left for your next application.'}
  ];
}