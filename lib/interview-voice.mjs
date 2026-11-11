export const voiceConfigured=()=>!!process.env.ELEVENLABS_API_KEY;
export function voiceText(value){return typeof value==='string'?value.replace(/\s+/g,' ').trim():''}
export async function generateInterviewSpeech(text,{fetcher=fetch,voice:requestedVoice}={}){
 const voice=requestedVoice||process.env.ELEVENLABS_VOICE_ID||'JBFqnCBsd6RMkjVDRZzb';
 if(!/^[A-Za-z0-9_-]{10,80}$/.test(voice))throw Error('Voice configuration invalid');
 const response=await fetcher('https://api.elevenlabs.io/v1/text-to-speech/'+voice+'/stream?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'Content-Type':'application/json',Accept:'audio/mpeg'},body:JSON.stringify({text,model_id:'eleven_flash_v2_5',voice_settings:{stability:0.5,similarity_boost:0.75,use_speaker_boost:true}}),signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Speech service unavailable');
 const audio=Buffer.from(await response.arrayBuffer());if(!audio.length||audio.length>3000000)throw Error('Invalid speech response');return audio;
}
