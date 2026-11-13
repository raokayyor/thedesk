export function prepTasks(plan={}) {
 return [...(plan.sevenDayActionPlan||[]).map((x,i)=>({id:'d'+i,title:x.focus||'Preparation task',detail:x.action||x.task||''})),...(plan.finalSubmissionChecklist||[]).map((x,i)=>({id:'c'+i,title:typeof x==='string'?x:x.item||x.check||x.title||'Submission check',detail:''}))];
}
export function prepProgress(plan,raw={}) {
 const tasks=prepTasks(plan),done=Object.fromEntries(tasks.filter(x=>raw.done?.[x.id]===true).map(x=>[x.id,true])),remaining=tasks.filter(x=>!done[x.id]);
 return {done,total:tasks.length,completed:Object.keys(done).length,next:remaining[0]?.title||'Plan complete',remaining};
}
