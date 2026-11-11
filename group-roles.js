// Shared allocation rules: three options plus chair, or four option advocates.
(()=>{const people=['dominic','priya','sam','you'];const slots=sc=>sc.options.length>=4?[0,1,2,3]:[0,1,2,-1];
function validate(sc,input){if(!input||typeof input!=='object')return null;const values=people.map(p=>input[p]);if(values.some(x=>!Number.isInteger(x))||new Set(values).size!==4)return null;const allowed=slots(sc);return values.every(x=>allowed.includes(x))?Object.fromEntries(people.map((p,i)=>[p,values[i]])):null;}
function assign(sc,rng=Math.random){const values=slots(sc);for(let i=values.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return Object.fromEntries(people.map((p,i)=>[p,values[i]]));}
function chooseStudent(sc,input,role){const a=validate(sc,input);if(!a||!slots(sc).includes(role))return null;const other=people.find(p=>a[p]===role);[a.you,a[other]]=[a[other],a.you];return a;}
function describe(sc,input){const a=validate(sc,input);if(!a)return null;return Object.fromEntries(people.map(p=>[p,a[p]===-1?'Chair — give and defend your recommendation, guide the discussion and involve everyone.':sc.options[a[p]].name]));}
globalThis.DeskGroupRoles={assign,validate,describe,chooseStudent};})();
