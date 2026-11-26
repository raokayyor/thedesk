import {SCORING_VERSION,calculateScores} from './assessment-scoring.mjs';
import {validateStudentContent} from './result-rules.mjs';
// Only the server-graded test contribution changes. CV evidence is revalidated.
export function preparedAssessment(row,cvText,profile,ats,quiz,cvFingerprint){
 if(!row||row.input?.cvFingerprint!==cvFingerprint||row.input?.cvText!==cvText||Object.keys(row.input?.profile||{}).length!==Object.keys(profile).length||Object.entries(profile).some(([key,value])=>JSON.stringify(row.input?.profile?.[key])!==JSON.stringify(value))||row.result?.scoringVersion!==SCORING_VERSION)return null;
 if(validateStudentContent(row.result,cvText).length)return null;
 try{return calculateScores(row.result,ats,quiz,cvText)}catch{return null}
}
