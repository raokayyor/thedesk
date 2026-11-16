// Recording must win over stale review/feedback flags from the previous attempt.
export function interviewPhase({recording,starting,thinking,feedback,recorded}){
 if(recording)return 'record';
 if(starting)return 'listen';
 if(thinking)return 'prepare';
 if(feedback)return 'feedback';
 return recorded?'review':'ready';
}
