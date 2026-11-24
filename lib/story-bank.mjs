import {sql,hash,newId} from './report-store.mjs';
import {factKind,matchingFact,groundedStorySources,refreshStoryParts} from './story-fact-rules.mjs';
export {matchingFact,groundedStorySources,refreshStoryParts};
export const storyEvidenceId=(cv,source)=>hash(String(cv)).slice(0,24)+':'+String(source||'').split(/\s+[—–-]\s+/)[0].toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
let ready;
export function initStoryBank(){return ready??=(async()=>{
 await sql().query(`CREATE TABLE IF NOT EXISTS story_facts(id text PRIMARY KEY,owner text NOT NULL,prompt text NOT NULL,answer text NOT NULL,evidence_ids jsonb NOT NULL DEFAULT '[]',kind text NOT NULL,firm text NOT NULL DEFAULT '',fact_key text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),used_in integer NOT NULL DEFAULT 0,UNIQUE(owner,fact_key))`);
 await sql().query(`CREATE TABLE IF NOT EXISTS story_uses(fact_id text NOT NULL REFERENCES story_facts(id) ON DELETE CASCADE,owner text NOT NULL,surface text NOT NULL,ref text NOT NULL,label text NOT NULL,metadata jsonb NOT NULL DEFAULT '{}',PRIMARY KEY(fact_id,surface,ref))`);
 await sql().query('CREATE INDEX IF NOT EXISTS story_facts_owner ON story_facts(owner)');
 })().catch(e=>{ready=null;throw e;});}
export async function storyFacts(owner){await initStoryBank();return sql().query('SELECT * FROM story_facts WHERE owner=$1 ORDER BY updated_at DESC LIMIT 500',[owner]);}
export async function useStoryFact(owner,fact,surface,ref,label,metadata={}){await initStoryBank();await sql().query(`INSERT INTO story_uses(fact_id,owner,surface,ref,label,metadata) SELECT id,$2,$3,$4,$5,$6::jsonb FROM story_facts WHERE id=$1 AND owner=$2 ON CONFLICT(fact_id,surface,ref) DO UPDATE SET label=EXCLUDED.label,metadata=EXCLUDED.metadata`,[fact.id,owner,surface,String(ref),String(label).slice(0,400),JSON.stringify(metadata)]);await sql().query(`UPDATE story_facts SET used_in=(SELECT count(DISTINCT surface||':'||ref) FROM story_uses WHERE fact_id=$1 AND owner=$2) WHERE id=$1 AND owner=$2`,[fact.id,owner]);}
export async function saveStoryFact(owner,{prompt,answer,evidenceIds=[],firm='',key,usage}){
 prompt=String(prompt||'').trim();answer=String(answer||'').trim();if(prompt.length<5||prompt.length>1600||answer.length<5||answer.length>2000||!Array.isArray(evidenceIds)||evidenceIds.some(x=>typeof x!=='string'||x.length>200))throw Error('Add a short prompt and your own true answer.');
 await initStoryBank();const kind=factKind(prompt),factKey=key||hash(JSON.stringify({prompt:prompt.toLowerCase(),evidenceIds:[...evidenceIds].sort(),firm:firm.toLowerCase()}));
 const [fact]=await sql().query(`INSERT INTO story_facts(id,owner,prompt,answer,evidence_ids,kind,firm,fact_key) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8) ON CONFLICT(owner,fact_key) DO UPDATE SET answer=EXCLUDED.answer,evidence_ids=EXCLUDED.evidence_ids,updated_at=now() RETURNING *`,[newId(),owner,prompt,answer,JSON.stringify(evidenceIds),kind,firm,factKey]);if(usage)await useStoryFact(owner,fact,usage.surface,usage.ref,usage.label,usage.metadata);return fact;
}
// Only explicit generated-draft references are refreshed; recordings and original transcripts stay immutable.
export async function refreshFactUses(owner,fact,deleted=false){
 const uses=await sql().query('SELECT * FROM story_uses WHERE fact_id=$1 AND owner=$2',[fact.id,owner]);const changed=new Set();
 for(const use of uses){const m=use.metadata||{};
 if(use.surface==='application'&&m.gapId&&m.cvHash){if(deleted)await sql().query('DELETE FROM app_gap_answers WHERE principal=$1 AND cv_hash=$2 AND gap_id=$3',[owner,m.cvHash,m.gapId]);else await sql().query('UPDATE app_gap_answers SET text=$1,updated_at=now() WHERE principal=$2 AND cv_hash=$3 AND gap_id=$4',[fact.answer,owner,m.cvHash,m.gapId]);changed.add(use.surface+use.ref);}
 if(use.surface==='guide'&&m.noteId){if(deleted)await sql().query("DELETE FROM desk_value_items WHERE principal=$1 AND id=$2 AND kind='interview-guide-gap'",[owner,m.noteId]);else await sql().query("UPDATE desk_value_items SET data=jsonb_set(data,'{text}',to_jsonb($1::text)) WHERE principal=$2 AND id=$3 AND kind='interview-guide-gap'",[fact.answer,owner,m.noteId]);changed.add(use.surface+use.ref);}
 }
 // Rewrites and saved generated versions carry structured fact IDs, never a broad find-and-replace.
 const rows=await sql().query("SELECT id,kind,data FROM desk_value_items WHERE principal=$1 AND kind IN ('interview-rewrite-detail','answer') AND data::text LIKE $2",[owner,'%'+fact.id+'%']);const facts=await storyFacts(owner),current=deleted?facts.filter(f=>f.id!==fact.id):facts;
 for(const row of rows){const d=row.data;if(!d.rewrite?.parts?.some(p=>p.storyFactId===fact.id||p.storyFactIds?.includes(fact.id)))continue;d.rewrite=refreshStoryParts(d.rewrite,current);d.text=d.script=d.rewrite.text;delete d.score;delete d.scoredHash;await sql().query('UPDATE desk_value_items SET data=$1::jsonb WHERE id=$2 AND principal=$3',[JSON.stringify(d),row.id,owner]);changed.add('answer'+row.id);}
 return changed.size;
}
