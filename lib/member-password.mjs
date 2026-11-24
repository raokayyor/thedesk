import {scrypt as derive,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export async function passwordHash(password){if(typeof password!=='string'||password.length<12||password.length>256)throw Error('Use a password between 12 and 256 characters.');const salt=randomBytes(16).toString('hex');return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex');}
export async function passwordMatches(password,stored){if(typeof password!=='string'||password.length>256||! /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored||''))return false;const [salt,key]=stored.split(':');return timingSafeEqual(Buffer.from(await scrypt(password,salt,64)),Buffer.from(key,'hex'));}
