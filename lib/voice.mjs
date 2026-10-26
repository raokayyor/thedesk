// The Desk · optional server voice features (OpenAI). Switched on by OPENAI_API_KEY; the pages fall back to the browser without it.
// Audio is sent to OpenAI for transcription and is never stored by The Desk. Video never leaves the device.
export const voiceConfigured = () => !!process.env.OPENAI_API_KEY;
export const TRANSCRIBE_MODEL = () => process.env.TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';
export const TTS_MODEL = () => process.env.TTS_MODEL || 'gpt-4o-mini-tts';
export const TTS_VOICE = () => process.env.TTS_VOICE || 'ash';
// Finance words speech recognition often gets wrong; given to the transcriber as a hint.
export const VOCAB = 'EBITDA, DCF, LBO, M&A, IPO, ECM, DCM, gilts, basis points, net interest margin, enterprise value, WACC, accretion, dilution, comps, precedents, private equity, Barclays, HSBC, J.P. Morgan, Goldman Sachs, Morgan Stanley, Citi, UBS, Deutsche Bank, Rothschild, Lazard, Evercore, PwC, Deloitte, EY, KPMG.';
const AUDIO_TYPES = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a' };
export const MAX_AUDIO_BYTES = 3 * 1024 * 1024; // about 10 minutes of speech; keeps requests under Vercel's 4.5MB body limit

export function audioKind(mime) { const base = String(mime || '').split(';')[0].trim().toLowerCase(); return AUDIO_TYPES[base] ? { base, ext: AUDIO_TYPES[base] } : null; }

export async function transcribe(buffer, mime, context = '') {
  const kind = audioKind(mime); if (!kind) throw new Error('Unsupported audio');
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: kind.base }), 'answer.' + kind.ext);
  form.append('model', TRANSCRIBE_MODEL());
  form.append('language', 'en');
  form.append('prompt', (context ? context.slice(0, 300) + ' ' : '') + VOCAB);
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form, signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error('Transcription failed ' + r.status);
  const d = await r.json();
  return String(d.text || '').replace(/\s+/g, ' ').trim();
}

export async function speech(text) {
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: TTS_MODEL(), voice: TTS_VOICE(), input: text, response_format: 'mp3',
      instructions: 'You are a senior interviewer at a London bank. Neutral British English accent, calm, clear and professional, at a natural interview pace.' })
  });
  if (!r.ok) throw new Error('Speech failed ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}
