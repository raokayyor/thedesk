# Interview voice setup

The interview uses ElevenLabs when the production key is configured and the student has loaded an assessment belonging to the current browser owner. Otherwise, the existing device voice remains available. No browser receives the provider key.

1. Create an ElevenLabs account with suitable commercial/API access and generate an API key with Text to Speech permission.
2. In Vercel → The Desk project → Settings → Environment Variables, add `ELEVENLABS_API_KEY` as a sensitive variable for Production. Never add a public prefix or commit the value.
3. Optionally set `ELEVENLABS_VOICE_ID` to a voice available to that account. The default is the voice ID used in the provider's API documentation. The integration uses `eleven_flash_v2_5` with MP3 output.
4. Redeploy the latest tested release after changing environment variables, then audition a question and repeat it. GET `/api/interview-voice` should report `enabled: true`; this indicates configuration, not successful provider billing or voice access.

Audio is kept only in page memory, bounded to 16 question clips, and revoked on page exit. A repeat reuses the cached clip. Questions may contain a short CV evidence quote: only the spoken question is sent to the speech provider, not the whole CV or the student's recording. Recording starts after question playback finishes. The endpoint enforces same-origin requests, owned assessment access, text limits and 80 synthesis calls per owner per day.

Provider playback and request/security tests use mocked audio and a test key. Real voice quality, credentials and billing cannot be verified until the production key has been supplied. No subscription was purchased during implementation.
