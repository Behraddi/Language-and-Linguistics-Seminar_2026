import { authenticate, json, cors } from './_helpers.js';
import { sendBatch, newsletterEmailHtml } from './_email.js';

export async function onRequestOptions() { return cors(); }

export async function onRequestPost({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);

  if (!env.RESEND_API_KEY) {
    return json({ error: 'RESEND_API_KEY is not configured. Add it in your Cloudflare Pages environment variables.' }, 503);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { subject, message } = body;
  if (!subject || !subject.trim()) return json({ error: 'Subject is required.' }, 400);
  if (!message || !message.trim()) return json({ error: 'Message body is required.' }, 400);

  const subscribers = (await env.CMS_KV.get('subscribers', 'json')) || [];
  if (!subscribers.length) return json({ error: 'No subscribers to send to.' }, 400);

  const siteUrl = new URL(request.url).origin;

  // Convert plain text line breaks to HTML paragraphs
  const bodyHtml = message
    .split(/\n\n+/)
    .map(p => `<p style="margin:0 0 16px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  // Build batch — Resend allows max 100 per batch request
  const BATCH_SIZE = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);
    const emails = chunk.map(s => ({
      to: s.email,
      subject: subject.trim(),
      html: newsletterEmailHtml(subject.trim(), bodyHtml, siteUrl, s.email),
    }));

    const res = await sendBatch(env, emails);
    if (res.ok) {
      sent += chunk.length;
    } else {
      // If batch fails, try individually
      for (const s of chunk) {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: env.FROM_EMAIL || 'Language & Linguistics Seminars <seminars@westernsydney.edu.au>',
            to: [s.email],
            subject: subject.trim(),
            html: newsletterEmailHtml(subject.trim(), bodyHtml, siteUrl, s.email),
          }),
        });
        r.ok ? sent++ : failed++;
      }
    }
  }

  return json({ success: true, sent, failed, total: subscribers.length });
}
