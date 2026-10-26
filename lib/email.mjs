// The Desk · sending email through Resend (RESEND_API_KEY + EMAIL_FROM).
export const emailReady = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export { esc as escHtml };

export function emailLayout(inner, footer = '') {
  return `<!doctype html><html><body style="margin:0;background:#f7f4ee;font-family:Arial,Helvetica,sans-serif;color:#0d1620">
<div style="max-width:600px;margin:0 auto;padding:24px 20px">
<div style="font-family:Georgia,serif;font-size:22px;font-weight:600;margin-bottom:18px">The <span style="color:#d9480f;font-style:italic;font-weight:500">Desk</span></div>
<div style="background:#fffdfa;border:1px solid #e3ddd3;border-radius:8px;padding:22px;font-size:16px;line-height:1.55">${inner}</div>
<div style="font-size:12px;color:#6b7682;margin-top:16px;line-height:1.5">${footer}</div>
</div></body></html>`;
}

async function resend(path, body, idempotencyKey) {
  const r = await fetch('https://api.resend.com' + path, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json',...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{}) },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('Email send failed ' + r.status);
  return r.json().catch(() => ({}));
}
// One email. headers: e.g. List-Unsubscribe for marketing mail.
export async function sendEmail({ to, subject, html, text, headers }) {
  if (!emailReady()) throw new Error('Email not configured');
  return resend('/emails', { from: process.env.EMAIL_FROM, to: [to], subject, html, text, ...(headers ? { headers } : {}) });
}
// Up to 100 emails in one request.
export async function sendBatch(messages,idempotencyKey) {
  if (!emailReady()) throw new Error('Email not configured');
  if (!messages.length) return [];
  return resend('/emails/batch', messages.map(m => ({ from: process.env.EMAIL_FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text, ...(m.headers ? { headers: m.headers } : {}) })),idempotencyKey);
}
