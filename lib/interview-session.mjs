import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
const secret=()=>process.env.INTERVIEW_SIGNING_KEY||process.env.ANTHROPIC_API_KEY;
export const interviewContextKey=(ctx,key)=>createHash('sha256').update(JSON.stringify([key,ctx.cvText,ctx.confirmedExperience,ctx.firm,ctx.division])).digest('hex');
export function signQuestion(question,contextKey,now=Date.now()){
 if(!secret())throw Error('Interview signing unavailable');
 const payload=Buffer.from(JSON.stringify({question,contextKey,expires:now+2*60*60*1000})).toString('base64url');
 const tag=createHmac('sha256',secret()).update('desk-interview-v1:'+payload).digest('base64url');
 return {...question,token:payload+'.'+tag};
}
export function verifyQuestion(token,contextKey,now=Date.now()){
 if(typeof token!=='string'||token.length>20000||!secret())throw Error('Invalid practice session');
 const [payload,tag,...extra]=token.split('.');if(!payload||!tag||extra.length)throw Error('Invalid practice session');
 const expected=createHmac('sha256',secret()).update('desk-interview-v1:'+payload).digest();const supplied=Buffer.from(tag,'base64url');
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw Error('Invalid practice session');
 const decoded=JSON.parse(Buffer.from(payload,'base64url').toString());
 if(decoded.contextKey!==contextKey||!Number.isFinite(decoded.expires)||decoded.expires<now)throw Error('Expired practice session');
 return decoded.question;
}
