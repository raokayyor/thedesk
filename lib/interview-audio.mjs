// Mono 16-bit WAV fallback stays under the request limit for a two-minute answer.
export function wavFromFloatChunks(chunks,sampleRate,targetRate=12000,maxSeconds=120){
 if(!chunks?.length||!Number.isFinite(sampleRate)||sampleRate<8000)return null;
 const length=chunks.reduce((n,c)=>n+c.length,0);if(!length)return null;const input=new Float32Array(length);let offset=0;for(const chunk of chunks){input.set(chunk,offset);offset+=chunk.length;}
 const count=Math.min(Math.floor(length*targetRate/sampleRate),targetRate*maxSeconds);if(!count)return null;const bytes=new ArrayBuffer(44+count*2),v=new DataView(bytes),write=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
 write(0,'RIFF');v.setUint32(4,36+count*2,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,targetRate,true);v.setUint32(28,targetRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,count*2,true);
 const ratio=sampleRate/targetRate;for(let i=0;i<count;i++){const start=Math.floor(i*ratio),end=Math.min(length,Math.max(start+1,Math.floor((i+1)*ratio)));let value=0;for(let j=start;j<end;j++)value+=input[j];value=Math.max(-1,Math.min(1,value/(end-start)));v.setInt16(44+i*2,value<0?value*32768:value*32767,true);}
 return new Blob([bytes],{type:'audio/wav'});
}
export function normaliseAudioType(value=''){const mime=(typeof value==='string'?value:'').toLowerCase().split(';')[0].trim();return ({'audio/x-m4a':'audio/mp4','audio/m4a':'audio/mp4','audio/x-wav':'audio/wav','audio/mp3':'audio/mpeg'})[mime]||mime;}
