import { authenticate, json, cors } from './_helpers.js';
import { sendEmail, welcomeEmailHtml } from './_email.js';

export async function onRequestOptions() { return cors(); }

// GET — list subscribers (admin) or handle unsubscribe link click
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const unsubscribe = url.searchParams.get('unsubscribe');

  // Public unsubscribe via link
  if (unsubscribe === '1' && email) {
    const subscribers = (await env.CMS_KV.get('subscribers', 'json')) || [];
    const filtered = subscribers.filter(s => s.email.toLowerCase() !== email.toLowerCase());
    await env.CMS_KV.put('subscribers', JSON.stringify(filtered));
    return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Unsubscribed</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f2f5}
.box{background:white;border-radius:12px;padding:3rem;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.08);max-width:400px}
h2{color:#445AAA;margin:0 0 1rem}p{color:#6b7280;margin:0 0 1.5rem}
a{background:#445AAA;color:white;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600}</style>
</head><body><div class="box">
<h2>✓ Unsubscribed</h2>
<p>You've been removed from the Language &amp; Linguistics Seminar Series mailing list.</p>
<a href="/">Back to site</a>
</div></body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }

  // Admin: list all subscribers
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  const subscribers = (await env.CMS_KV.get('subscribers', 'json')) || [];
  return json(subscribers);
}

// POST — subscribe (public)
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { email, name } = body;
  if (!email || !email.includes('@')) return json({ error: 'Invalid email' }, 400);

  const subscribers = (await env.CMS_KV.get('subscribers', 'json')) || [];
  if (subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
    return json({ message: 'You are already subscribed!' });
  }

  subscribers.push({
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    name: name || '',
    subscribedAt: new Date().toISOString(),
  });
  await env.CMS_KV.put('subscribers', JSON.stringify(subscribers));

  // Send welcome email if Resend is configured
  if (env.RESEND_API_KEY) {
    const siteUrl = new URL(request.url).origin;
    const html = welcomeEmailHtml(name, siteUrl).replace('{{EMAIL}}', encodeURIComponent(email.toLowerCase()));
    await sendEmail(env, {
      to: email,
      subject: 'Welcome to the Language & Linguistics Seminar Series',
      html,
    }).catch(() => {}); // don't fail subscription if email errors
  }

  return json({ message: 'Subscribed! Check your inbox for a confirmation email.' }, 201);
}

// DELETE — remove subscriber (admin or unsubscribe by email param)
export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) return json({ error: 'Email required' }, 400);

  const subscribers = (await env.CMS_KV.get('subscribers', 'json')) || [];
  const filtered = subscribers.filter(s => s.email.toLowerCase() !== email.toLowerCase());
  await env.CMS_KV.put('subscribers', JSON.stringify(filtered));
  return json({ success: true });
}
