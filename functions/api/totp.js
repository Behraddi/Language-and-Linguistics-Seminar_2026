import { json, cors, authenticate } from './_helpers.js';
import { newTOTPSecret, totpUri, verifyTOTP } from './_totp.js';

export async function onRequestOptions() { return cors(); }

// GET — TOTP enabled status
export async function onRequestGet({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  const secret = await env.CMS_KV.get('totp_secret');
  return json({ enabled: !!secret });
}

// POST — manage TOTP
//   { action: 'setup' }              → { secret, uri }   (generate + temporarily store secret)
//   { action: 'enable', code }       → { success }       (verify code + persist secret)
//   { action: 'disable' }            → { success }       (delete secret)
export async function onRequestPost({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (body.action === 'setup') {
    const secret = newTOTPSecret();
    const uri    = totpUri(secret);
    await env.CMS_KV.put('totp_pending', secret, { expirationTtl: 600 }); // 10-min window to verify
    return json({ secret, uri });
  }

  if (body.action === 'enable') {
    const secret = await env.CMS_KV.get('totp_pending');
    if (!secret) return json({ error: 'Setup session expired — please start again.' }, 400);
    if (!await verifyTOTP(secret, (body.code || '').trim())) {
      return json({ error: 'Invalid code — check your authenticator app and try again.' }, 400);
    }
    await env.CMS_KV.put('totp_secret', secret);
    await env.CMS_KV.delete('totp_pending');
    return json({ success: true });
  }

  if (body.action === 'disable') {
    await env.CMS_KV.delete('totp_secret');
    return json({ success: true });
  }

  return json({ error: 'Unknown action' }, 400);
}
