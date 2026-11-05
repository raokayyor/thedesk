import { fetchTranscript } from 'youtube-transcript';

export function youtubeVideoId(input) {
  if(typeof input!=='string'||input.length>2048)throw new Error('Enter a YouTube video link.');
  const value=input.trim();
  if(/^[\w-]{11}$/.test(value))return value;
  let u;try{u=new URL(value)}catch{throw new Error('Enter a YouTube video link.')}
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)throw new Error('Enter a YouTube video link.');
  const host=u.hostname.toLowerCase();let id;
  if(host==='youtu.be')id=u.pathname.slice(1);
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(host)){
    id=u.pathname==='/watch'?u.searchParams.get('v'):(/^\/(shorts|embed|live)\/([^/]+)\/?$/.exec(u.pathname)||[])[2];
  }
  if(!/^[\w-]{11}$/.test(id||''))throw new Error('Use a single YouTube video link, rather than a channel or playlist.');
  return id;
}
export function captionText(segments) {
  if(!Array.isArray(segments)||!segments.length)throw new Error('No captions were returned.');
  const text=segments.map(s=>String(s.text||'').replace(/<[^>]*>/g,'').trim()).filter(Boolean).join('\n');
  if(text.length<40)throw new Error('There is not enough caption text to import.');
  if(text.length>300000)throw new Error('This transcript is too long. Import shorter sections.');
  return text;
}
export async function importYoutube(input,{retrieve=fetchTranscript,fetcher=fetch}={}) {
  const id=youtubeVideoId(input),signal=AbortSignal.timeout(20000);
  const safeFetch=async(url,options={})=>{
    const u=new URL(String(url));
    if(u.protocol!=='https:'||u.port||!(u.hostname==='youtube.com'||u.hostname.endsWith('.youtube.com')))throw new Error('Unexpected caption host.');
    const r=await fetcher(u,{...options,redirect:'error',signal});
    if(!r.ok)throw new Error('Caption request failed.');
    const reader=r.body?.getReader();if(!reader)return r;
    let bytes=0;const chunks=[];
    for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>4000000){await reader.cancel();throw new Error('Caption response too large.')}chunks.push(value)}
    return new Response(Buffer.concat(chunks),{status:r.status,headers:r.headers});
  };
  try {
    const segments=await retrieve(id,{lang:'en',fetch:safeFetch});
    return {videoId:id,url:'https://www.youtube.com/watch?v='+id,text:captionText(segments),language:segments[0]?.lang||'',method:'captions'};
  }catch(e){throw new Error('Could not retrieve captions for this video. Paste its transcript or upload a .txt, .vtt or .srt file instead.');}
}
