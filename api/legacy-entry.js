import {currentAccount} from '../lib/accounts.mjs';
import {legacyEntry} from '../lib/legacy-entry.mjs';
export default async function handler(req,res){res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');if(!['GET','HEAD'].includes(req.method))return res.status(405).end();const account=await currentAccount(req);res.setHeader('Location',legacyEntry({signedIn:!!account,taster:String(req.query?.taster||'')}));return res.status(302).end();}
