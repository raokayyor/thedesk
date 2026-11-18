export function applyCvRepair(text,original,suggested){
 if(typeof text!=='string'||typeof original!=='string'||typeof suggested!=='string'||!original.trim()||!suggested.trim())throw Error('This suggestion is not ready to add.');
 const at=text.indexOf(original);if(at<0)throw Error('The original line has changed in your draft. Edit that line manually.');if(text.indexOf(original,at+original.length)>=0)throw Error('This line appears more than once. Choose the right place in your draft and edit it manually.');
 if(/\[(?:confirm|what|who|how|when|which)[:\s]/i.test(suggested))throw Error('Confirm the missing facts before adding this suggestion.');
 return text.slice(0,at)+suggested+text.slice(at+original.length);
}
