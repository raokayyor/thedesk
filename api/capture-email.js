export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { email, firm, div, score, name } = req.body || {};
    console.log("EMAIL CAPTURE:", { email, name, firm, div, score, ts: new Date().toISOString() });
    return res.status(200).json({ success: true });
  } catch(e) {
    return res.status(500).json({ success: false });
  }
}
