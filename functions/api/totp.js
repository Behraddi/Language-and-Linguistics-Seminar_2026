import { json, cors, authenticate } from './_helpers.js';
import { newTOTPSecret, totpUri, verifyTOTP } from './_totp.js';

export async function onRequestOptions() { return cors(); }

// GET — either:
//   ?setupToken=X  → unauthenticated first-time setup (issued by auth.js after password)
//   authenticated  → return { enabled }
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const setupToken = url.searchParams.get('setupToken');

  if (setupToken) {
    const valid = await env.CMS_KV.get(`setup_session:${setupToken}`);
    if (!valid) return json({ error: 'Setup session expired — please log in again.' }, 401);
    const secret = newTOTPSecret();
    const uri    = totpUri(secret);
    await env.CMS_KV.put(`setup_pending:${setupToken}`, secret, { expirationTtl: 300 });
    return json({ secret, uri });
  }

  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  const secret = await env.CMS_KV.get('totp_secret');
  return json({ enabled: !!secret });
}

// POST — three paths:
//   { setupToken, code }              → first-time mandatory setup (no session yet)
//   { action:'setup' }                → dashboard: generate new secret to show QR
//   { action:'enable', code }         → dashboard: confirm and save
//   { action:'disable' }              → dashboard: remove secret
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  // ── First-time mandatory setup (unauthenticated, uses setupToken) ─────────
  if (body.setupToken) {
    const valid = await env.CMS_KV.get(`setup_session:${body.setupToken}`);
    if (!valid) return json({ error: 'Setup session expired — please log in again.' }, 401);

    const secret = await env.CMS_KV.get(`setup_pending:${body.setupToken}`);
    if (!secret) return json({ error: 'No pending secret — please refresh the QR code.' }, 400);

    if (!await verifyTOTP(secret, (body.code || '').trim())) {
      return json({ error: 'Invalid code — check your authenticator app and try again.' }, 400);
    }

    await env.CMS_KV.put('totp_secret', secret);
    await env.CMS_KV.delete(`setup_session:${body.setupToken}`);
    await env.CMS_KV.delete(`setup_pending:${body.setupToken}`);

    const token = crypto.randomUUID();
    await env.CMS_KV.put(`session:${token}`, '1', { expirationTtl: 86400 });
    return json({ token });
  }

  // ── Authenticated dashboard management ────────────────────────────────────
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);

  if (body.action === 'setup') {
    const secret = newTOTPSecret();
    const uri    = totpUri(secret);
    await env.CMS_KV.put('totp_pending', secret, { expirationTtl: 600 });
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
