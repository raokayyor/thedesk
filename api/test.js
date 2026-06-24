export const maxDuration = 60;
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const t = Date.now();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: 'Reply with this exact JSON: {"status":"ok","model":"haiku","test":true}' }]
    });

    const text = response.content?.[0]?.text || "";
    const ms = Date.now() - t;

    return res.status(200).json({
      success: true,
      ms,
      raw: text,
      apiKeySet: !!process.env.ANTHROPIC_API_KEY
    });
  } catch(e) {
    return res.status(500).json({ success: false, error: e.message, apiKeySet: !!process.env.ANTHROPIC_API_KEY });
  }
}
