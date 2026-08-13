import nodemailer from 'nodemailer';

/**
 * Fan a captured lead out to whichever delivery channels are configured.
 *
 * Every channel is optional. With none configured the lead is still logged and
 * the caller still gets a success — a missing SMTP password should never turn
 * into a broken form on the marketing site.
 */
export async function deliverLead(lead) {
  const results = await Promise.allSettled([sendWebhook(lead), sendEmail(lead)]);

  const delivered = [];
  for (const [i, r] of results.entries()) {
    const channel = ['webhook', 'email'][i];
    if (r.status === 'fulfilled' && r.value) delivered.push(channel);
    if (r.status === 'rejected') console.error(`[leads] ${channel} delivery failed:`, r.reason?.message || r.reason);
  }

  if (!delivered.length) {
    console.log('[leads] no delivery channel configured — captured lead:', JSON.stringify(lead));
  }
  return delivered;
}

async function sendWebhook(lead) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return false;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  return true;
}

let transporter;

async function sendEmail(lead) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEADS_TO_EMAIL } = process.env;
  if (!SMTP_HOST || !LEADS_TO_EMAIL) return false;

  transporter ||= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  const rows = Object.entries(lead)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#7186a0">${k}</td><td style="padding:4px 0">${escapeHtml(String(v))}</td></tr>`)
    .join('');

  await transporter.sendMail({
    from: SMTP_USER || LEADS_TO_EMAIL,
    to: LEADS_TO_EMAIL,
    replyTo: lead.email,
    subject: `Video Funker — new ${lead.intent} request from ${lead.name || lead.email}`,
    html: `<h2 style="font-family:sans-serif">New ${lead.intent} request</h2><table style="font-family:sans-serif;font-size:14px">${rows}</table>`,
  });
  return true;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
