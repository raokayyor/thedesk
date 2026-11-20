// Keep evidence and score validation on the server, while preventing malformed
// tool arguments (missing fields, string severities, unknown source IDs).
// Strict tools support enums but not numeric bounds or fixed array lengths.
export function strictAssessmentSchema(schema){
 const visit=value=>{
  if(Array.isArray(value))return value.map(visit);
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const [key,item] of Object.entries(value)){
   if(['minimum','maximum','minItems','maxItems'].includes(key))continue;
   if(key==='enum'&&Array.isArray(item)&&!item.length)continue;
   out[key]=visit(item);
  }
  if(value.type==='integer'&&Number.isInteger(value.minimum)&&Number.isInteger(value.maximum)){
   out.enum=Array.from({length:value.maximum-value.minimum+1},(_,i)=>value.minimum+i);
  }
  if(Number.isInteger(value.minItems)||Number.isInteger(value.maxItems)){
   out.description=[out.description,value.minItems===value.maxItems?`Return exactly ${value.minItems} items.`:`Return at most ${value.maxItems} items.`].filter(Boolean).join(' ');
  }
  return out;
 };
 return visit(schema);
}
