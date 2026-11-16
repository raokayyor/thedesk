import {currentAccount,isPaidOwner} from '../lib/value-accounts.mjs';
import {apiFailure} from '../lib/report-store.mjs';
import {editionFor} from '../lib/markets-snapshot.mjs';
export const maxDuration=60;
export default async function handler(req,res){res.setHeader('Cache-Control','private, no-store');if(req.method!=='GET')return res.status(405).end();try{const account=await currentAccount(req);if(!account)return res.status(401).json({error:'Log in to read your briefing.'});if(!await isPaidOwner('account:'+account.id))return res.status(403).json({error:'Your personalised briefing is included with membership.'});return res.json(await editionFor(account.id));}catch(e){return apiFailure(res,e);}}
