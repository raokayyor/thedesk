const normal=s=>String(s||'').toLowerCase().replace(/[’]/g,"'");
export function evidenceForDetail(cv,detail){
 const lines=String(cv||'').split(/\r?\n/),needle=normal(detail).split(/\s+[—–]\s+|,\s*\d{4}/)[0].trim();
 if(!needle)return '';
 const at=lines.findIndex(l=>normal(l).includes(needle));if(at<0)return '';
 const out=[lines[at]];
 for(let i=at+1;i<lines.length;i++){const l=lines[i].trim();if(!l)continue;if(!/^[-•]/.test(l))break;out.push(l);}
 return out.join('\n');
}
export function validateEvidenceFairness(a,cv){
 const errors=[],finding=/\b(found|identified|isolated|concluded|revealed|determined)\b/i,action=/\b(led|coached|trained|delegated|negotiated|reassigned|coordinated)\b/i;
 const missingFinding=/\b(no|missing|absent|omits?|without|unstated)\b[^.!?;]{0,35}\b(findings?|results?|outputs?)\b|\b(findings?|results?|outputs?)\b[^.!?;]{0,25}\b(missing|absent|unstated)\b/i;
 const missingPersonal=/\b(no|without|missing|absent)\b[^.!?;]{0,35}\b(personal|individual|specific)\b[^.!?;]{0,25}\b(actions?|decisions?|contributions?)\b|\b(individual|personal) (?:leadership|contribution|decisions?|teamwork)[^.!?;]{0,35}\b(absent|invisible|unseen|indistinguishable|not distinguished|not described|not visible)\b/i;
 const fields=[...(a.priorities||[]).map((p,i)=>({field:'Priority '+(i+1),text:p.description,source:evidenceForDetail(cv,p.detail)})),...(a.competencies||[]).map(c=>({field:c.name+' reason',text:c.reason,source:(c.quotes||[]).join('\n')+'\n'+evidenceForDetail(cv,c.detail)})),{field:'CV issue',text:a.cvPreview?.issue,source:a.cvPreview?.original||''}];
 for(const f of fields){if(/\b(reconcil\w*|cut-off|pivot tables?|dcf|comparable-company|regression|event study)\b/i.test(f.source)&&/\b(no|missing|absent|omits?|without|unstated)\b[^.!?;]{0,55}\bmethods?\b|\bmethods?\b[^.!?;]{0,55}\b(missing|absent|unstated)\b/i.test(f.text))errors.push(f.field+': the cited entry already names an analytical method. Credit it; request explanation as a refinement rather than claim it is absent.');if(finding.test(f.source)&&missingFinding.test(f.text))errors.push(f.field+': the cited CV entry already states a finding/output. Acknowledge it; identify only a distinct remaining gap.');if(action.test(f.source)&&(missingPersonal.test(f.text)||/\b(individual|personal)\b[^.!?;]{0,65}\b(not visible|not described|absent|indistinguishable)\b/i.test(f.text)))errors.push(f.field+': the cited CV entry already describes personal actions/decisions. Do not claim individual contribution is absent or indistinguishable.');}
 if(finding.test(cv)&&/missing conclusions across|no findings anywhere|no results anywhere/i.test(a.deskSummary||''))errors.push('Summary ignores explicit findings in the CV. Describe the actual remaining gap, not blanket missing conclusions.');
 const original=a.cvPreview?.original||'',rewrite=a.cvPreview?.structure||'';
 for(const token of original.match(/(?:£|\$|€)?\d[\d,.]*(?:%|x)?/g)||[]){const n=token.replace(/[.,]+$/,'');if(!rewrite.includes(n))errors.push('CV placeholder drops confirmed number '+n+'. Preserve the selected bullet’s supported scale and findings.');}
 return errors;
}
