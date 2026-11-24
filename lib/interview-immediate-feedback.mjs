import {fallbackRewrite,toClient} from './answer-rewrite.mjs';
import {frameworkRewriteFallback} from './interview-framework-rewrite.mjs';
import {answerStructure} from './interview-frameworks.mjs';
import {applyScorePolicy} from './interview-score-policy.mjs';
export function immediateFeedback(feedback,input,evidence=[]){
 const intro=answerStructure(input).framework.key==='introduction';const raw=intro?fallbackRewrite({...input,evidence}):frameworkRewriteFallback(input,evidence);const rewrite={...toClient(raw),...(raw.sections?{sections:raw.sections,framework:raw.framework}:{})};
 rewrite.parts=rewrite.parts.map((p,i)=>({...p,...(p.gap?{id:'gap-'+i}:{}),changed:!!p.change,marker:p.change}));rewrite.annotations=(rewrite.changes||[]).map(c=>({marker:c.n,reason:c.reason}));
 return applyScorePolicy({...feedback,coachingPending:false,detailsPending:!feedback.improvement?.fixes?.length,rewrite,improvedScript:rewrite.text,improvedAnswer:rewrite.parts},input);
}
