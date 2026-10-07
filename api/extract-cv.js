import formidable from 'formidable';
import mammoth from 'mammoth';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import {readFile,unlink} from 'node:fs/promises';
import {sameOrigin} from '../lib/report-store.mjs';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req,res))return;
 let path;
 try{const [fields,files]=await formidable({maxFiles:1,maxFileSize:2*1024*1024,maxTotalFileSize:2*1024*1024,allowEmptyFiles:false}).parse(req);
 const file=files.cvFile?.[0];if(!file)throw new Error('Choose a PDF, Word (.docx) or text CV.');path=file.filepath;
 if(fields.consent?.[0]!=='true')throw new Error('Confirm processing consent before uploading.');
 const ext=file.originalFilename?.toLowerCase().split('.').pop();const buffer=await readFile(path);let text;
 if(ext==='txt')text=buffer.toString('utf8');else if(ext==='docx')text=(await mammoth.extractRawText({buffer})).value;else if(ext==='pdf')text=(await pdf(buffer)).text;else throw new Error('Use PDF, .docx or .txt.');
 text=text.trim();if(text.length<100)throw new Error('This file has too little readable text. For scanned PDFs, paste your CV text instead.');if(text.length>40000)throw new Error('Your CV is too long. Use a CV under 40,000 characters.');return res.json({success:true,text});
 }catch(e){return res.status(400).json({error:/Choose|Confirm|Use PDF|too little|too long/.test(e.message)?e.message:'We could not read this file. Paste your CV text instead.'});}finally{if(path)await unlink(path).catch(()=>{});}
}
