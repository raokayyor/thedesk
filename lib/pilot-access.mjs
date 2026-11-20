import {createHash,timingSafeEqual} from 'node:crypto';
// Temporary shared tester pass. It never authenticates an existing email account.
export const PILOT_EXPIRES='2026-12-12T23:59:59Z';
const digest='ebbdc1713a5274076effe32268fbdea4d94fa04238f0b99a3c3fce2ec7eed1d1';
export function validPilotCode(code,now=Date.now()){
 if(typeof code!=='string'||code.length>80||now>=Date.parse(PILOT_EXPIRES))return false;
 return timingSafeEqual(createHash('sha256').update(code.trim()).digest(),Buffer.from(digest,'hex'));
}

const ameliaDigest='af6d9493ffd9d726d52d8c0f0efe43c80addde32b27945362c73e144e554535f';
export function validAmeliaCode(code,now=Date.now()){return typeof code==='string'&&code.length<=80&&now<Date.parse(PILOT_EXPIRES)&&timingSafeEqual(createHash('sha256').update(code.trim()).digest(),Buffer.from(ameliaDigest,'hex'));}
