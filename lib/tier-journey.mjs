// Shared, conservative tier and upgrade-return policy.
export function localReturn(value,fallback='/my.html'){
 if(typeof value!=='string'||value.length>480||!value.startsWith('/')||value.startsWith('//')||/[\\\x00-\x20]/.test(value))return fallback;
 try{const u=new URL(value,'https://desk.invalid');if(!/^\/(?:[a-z0-9-]+\.html)?$/i.test(u.pathname)||u.origin!=='https://desk.invalid'||/^\/(?:api\/|signin|signup|membership-start|upgrade-return|try\.html)/.test(u.pathname))return fallback;return u.pathname+u.search+u.hash;}catch{return fallback;}
}
export function firmLimit(list,paid,extra=[]){if(paid)return true;return new Set([...Object.keys(list||{}).map(k=>k.split('|')[0]),...extra].map(x=>String(x).trim().toLowerCase()).filter(Boolean)).size<=3;}
export function ownTasterStudent(row,sample){const cv=String(row?.input?.cvText||'').trim();return cv?{profile:row.input?.profile||{},cv,result:row.result||{},sample:false}:{profile:sample.profile,cv:sample.originalCvText,result:sample.result,sample:true};}

export function upgradedReturn(value){const path=localReturn(value);const u=new URL(path,'https://desk.invalid');for(const key of ['taster','trial','sample'])u.searchParams.delete(key);u.searchParams.set('upgraded','1');return u.pathname+u.search+u.hash;}
