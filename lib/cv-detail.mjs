export const normalCvDetail=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
// Real short employer labels such as EY, UBS and PwC are valid exact anchors.
export const shortCvDetail=value=>/^(?=.{2,3}$)(?=.*[A-Z].*[A-Z])[A-Za-z]+$/.test(String(value||''));
export function containsCvDetail(text,detail){
 const source=normalCvDetail(text),name=normalCvDetail(detail);if(!name)return false;
 if(!shortCvDetail(detail))return source.includes(name);
 return new RegExp('(^|[^\\p{L}\\p{N}])'+name+'(?=$|[^\\p{L}\\p{N}])','u').test(source);
}
export const usableCvDetail=value=>normalCvDetail(value).length>=4||shortCvDetail(value);
