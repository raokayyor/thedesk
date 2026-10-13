import {sql} from './report-store.mjs';
let initialized;
export function initQuestions(){return initialized??=sql().query(`CREATE TABLE IF NOT EXISTS desk_practitioner_questions(id text PRIMARY KEY,root_id text UNIQUE NOT NULL,owner_hash text NOT NULL,bank text NOT NULL DEFAULT 'db',email text NOT NULL,question text NOT NULL,publish_consent boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now(),due_at timestamptz NOT NULL DEFAULT now()+interval '48 hours',answer text,practitioner text,answered_at timestamptz,published boolean NOT NULL DEFAULT false)`).catch(e=>{initialized=null;throw e;});}
export const validEmail=email=>typeof email==='string'&&email.length<=254&&/^\S+@[^\s@]+\.[^\s@]+$/.test(email);
export const PRACTITIONERS=['Rao','Peter Cheley','Neil Robertson','Jim Staples'];
