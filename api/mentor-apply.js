export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    
    // Log to Vercel function logs (visible in dashboard)
    console.log("=== MENTOR APPLICATION ===");
    console.log("Name:", body.name);
    console.log("University:", body.university);
    console.log("Course:", body.course);
    console.log("Year:", body.year);
    console.log("Grade:", body.grade);
    console.log("Target areas:", body.areas);
    console.log("Email:", body.email);
    console.log("Phone:", body.phone);
    console.log("Notes:", body.notes);
    console.log("Submitted:", new Date().toISOString());
    console.log("=========================");

    // Forward to email via Anthropic API as a simple notification
    // (swap this for Resend/SendGrid/Postmark when ready)
    
    return res.status(200).json({ 
      success: true, 
      message: "Application received" 
    });

  } catch(e) {
    console.error("Mentor apply error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
