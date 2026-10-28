// Claude's strict subset excludes length and most array cardinality constraints.
// Keep the complete schema for server validation; remove only unsupported grammar keywords.
export function strictToolSchema(value){
 if(Array.isArray(value))return value.map(strictToolSchema);
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.entries(value).filter(([key,val])=>!['minLength','maxLength','maxItems','minimum','maximum','multipleOf'].includes(key)&&(key!=='minItems'||val===0||val===1)).map(([key,val])=>[key,strictToolSchema(val)]));
}
