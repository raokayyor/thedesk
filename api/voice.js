import { sameOrigin, apiFailure } from '../lib/report-store.mjs';
import { currentAccount, entitlement, useQuota } from '../lib/accounts.mjs';
import { voiceConfigured, transcribe, speech, audioKind, MAX_AUDIO_BYTES } from '../lib/voice.mjs';

export const config = { api: { bodyParser: { sizeLimit: '4.4mb' } } };

// POST { action: 'stt', audio: <base64>, mime, context? } → { text }   (Full Cycle; audio is not stored)
// POST { action: 'tts', text } → audio/mpeg                             (Full Cycle)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req, res)) return;
  if (!voiceConfigured()) return res.status(503).json({ error: 'Server voice is not switched on.' });
  try {
    const account = await currentAccount(req);
    if (!account) return res.status(401).json({ error: 'Sign in first.' });
    if (!(await entitlement(account.id)).active) return res.status(402).json({ error: 'Part of Full Cycle.' });
    const body = req.body || {};
    if (body.action === 'stt') {
      if (!audioKind(body.mime)) return res.status(400).json({ error: 'Unsupported audio format.' });
      const buf = Buffer.from(String(body.audio || ''), 'base64');
      if (buf.length < 1000 || buf.length > MAX_AUDIO_BYTES) return res.status(400).json({ error: 'Recording too short or too long.' });
      if (!await useQuota(account.id, 'stt', 300)) return res.status(429).json({ error: 'Daily transcription limit reached.' });
      const context = typeof body.context === 'string' ? body.context.slice(0, 300) : '';
      return res.json({ success: true, text: await transcribe(buf, body.mime, context) });
    }
    if (body.action === 'tts') {
      const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
      if (text.length < 3 || text.length > 500) return res.status(400).json({ error: 'Text too long.' });
      if (!await useQuota(account.id, 'tts', 400)) return res.status(429).json({ error: 'Daily voice limit reached.' });
      const audio = await speech(text);
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.status(200).send(audio);
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) { return apiFailure(res, e); }
}
