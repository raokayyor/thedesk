// Preview checklist data must never change production students, quotas or trading.
// Every Preview query uses an isolated schema with no public fallback.
export const PREVIEW_SCHEMA='desk_preview_mydesk_20261109';
export function previewSql(client){
 let ready;
 const init=()=>ready??=client.query('CREATE SCHEMA IF NOT EXISTS '+PREVIEW_SCHEMA).catch(e=>{ready=null;throw e});
 return {query:async(text,params=[])=>{await init();const rows=await client.transaction(tx=>[tx.query("SELECT set_config('search_path',$1,true)",[PREVIEW_SCHEMA]),tx.query(text,params)]);return rows[1]}};
}
