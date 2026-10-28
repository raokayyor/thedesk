import assert from 'node:assert/strict';
import {buildRepairedCv} from '../lib/repaired-cv.mjs';
import {workedAnswer} from '../lib/assessment-scoring.mjs';
const generic='Supported the investment team with research and analysis on potential transactions.';
const detail='Researched 12 UK software companies. Recorded revenue and EBITDA in Excel. Flagged 4 companies for review. Presented the comparison to an associate. No transaction outcome was confirmed.';
const cv='Candidate\nEXPERIENCE\nFirm — Intern, 2025\n'+generic+'\n'+detail+'\nSKILLS\nExcel and research.';
const paid={bulletRepair:[{originalBullet:generic,exampleBullet:'Researched 12 UK software companies in Excel and flagged 4 companies for review.',factsUsed:[generic,detail],questionsToConfirm:[]}],competencyRepair:Array(7).fill({}),interviewRiskMap:[{},{},{}]};
const result=buildRepairedCv({cvText:cv,paid});
assert.equal(result.sourceText.split('Researched 12').length,2);
assert(result.sourceText.includes('Recorded revenue and EBITDA'));
assert(result.sourceText.includes('No transaction outcome was confirmed.'));
const wa=workedAnswer({route:'investment_banking',topic:'WACC',question:'Why?',options:['Wrong','Lenders rank ahead of shareholders','Wrong','Wrong'],answer:1,concept:'Lenders have a prior claim.',working:[],trap:'',id:'T0038'},'commercial');
assert.equal(wa.correctAnswer,'Lenders rank ahead of shareholders');assert.equal(wa.trap,null);assert.equal(wa.hub.topic,'WACC');
console.log('PASS v3.1 integration: lossless duplicate repair, preserved qualification, correct option and practice topic');

