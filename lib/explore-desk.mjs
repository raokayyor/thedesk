import {PRACTITIONERS,FIRM_LOGOS} from '../data/home-practitioners.mjs';
import {readFile} from 'node:fs/promises';
let sample;
const showcase=readFile(new URL('../samples/amelia-interview-showcase.json',import.meta.url),'utf8').then(JSON.parse);
export const sampleStudent=()=>sample??=readFile(new URL('../samples/amelia-report-v3-preview.json',import.meta.url),'utf8').then(JSON.parse);
export async function exploreDesk(){const s=await sampleStudent();const fixed=s.cv.sections.find(x=>x.title==='Experience').items[0].bullets[0].text;return {team:{people:PRACTITIONERS,logos:FIRM_LOGOS},showcase:await showcase,sampleFix:{before:s.result.cvPreview.original.split('. ')[0]+'.',after:fixed},explore:true,sample:true,hasOwnAssessment:false,signedIn:false,member:false,accountType:'explore',profile:{...s.profile,name:'',firstName:'',university:'',course:'',year:''},readiness:null,report:null,deep:null,prep:null,library:{answers:0,storyFacts:0,storyUses:0},applications:[],actions:[],tests:{count:0},interview:{count:0,recent:[]},practitioners:null,prices:{membership:'£89 a year'}};}
