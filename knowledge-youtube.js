// Staff import UI; transcripts remain temporary source material until extraction.
(() => {
 const box=document.createElement('section');
 box.innerHTML='<h3>YouTube transcript</h3><p class="mute">Paste a video link in Link above, then fetch its available captions. You can also upload a transcript file or paste the words below.</p><div class="row"><button type="button" id="fetchYoutube">Fetch YouTube transcript</button><label class="ghost">Transcript file <input type="file" id="transcriptFile" accept=".txt,.vtt,.srt,text/plain,text/vtt"></label></div><p id="youtubeStatus" class="status" role="status"></p>';
 document.getElementById('drop').before(box);
 const status=document.getElementById('youtubeStatus'),text=document.getElementById('text');
 const clean=s=>s.replace(/^\uFEFF/,'').replace(/^WEBVTT[^\n]*$/gm,'').split(/\r?\n/).filter(l=>!/^\s*\d+\s*$/.test(l)&&!l.includes('-->')).join('\n').replace(/<[^>]*>/g,'').trim();
 document.getElementById('fetchYoutube').onclick=async function(){
  if(text.value.trim()&&!confirm('Replace the transcript currently in the text box?'))return;
  this.disabled=true;status.textContent='Retrieving captions…';
  try{const d=await call('POST',{action:'youtube-transcript',url:document.getElementById('sUrl').value});if(d.error)throw Error(d.error);text.value=d.text;document.getElementById('sUrl').value=d.url;document.getElementById('sType').value='YouTube';status.textContent='Transcript loaded. Choose “Pull out the points” to create drafts for review.'}catch(e){status.textContent=e.message}finally{this.disabled=false}
 };
 document.getElementById('transcriptFile').onchange=async function(){const f=this.files[0];if(!f)return;if(f.size>600000){status.textContent='Choose a transcript file under 600 KB.';return}if(text.value.trim()&&!confirm('Replace the transcript currently in the text box?'))return;text.value=clean(await f.text());status.textContent='Transcript file loaded. Add its source link above, then pull out the points.'};
})();
