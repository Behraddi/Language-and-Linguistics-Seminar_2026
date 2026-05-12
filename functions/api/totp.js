import { json, cors, authenticate, getUserTOTPSecret, setUserTOTPSecret } from './_helpers.js';
import { newTOTPSecret, totpUri, verifyTOTP } from './_totp.js';

export async function onRequestOptions() { return cors(); }

// GET — ?setupToken=X → unauthenticated first-time setup (fresh secret + uri)
//      authenticated   → { enabled }
export async function onRequestGet({ request, env }) {
  const url        = new URL(request.url);
  const setupToken = url.searchParams.get('setupToken');

  if (setupToken) {
    const sessionData = await env.CMS_KV.get(`setup_session:${setupToken}`, 'json');
    if (!sessionData) return json({ error: 'Setup session expired — please log in again.' }, 401);
    const secret = newTOTPSecret();
    const uri    = totpUri(secret, 'Ling Seminar CMS', sessionData.username);
    await env.CMS_KV.put(`setup_pending:${setupToken}`, secret, { expirationTtl: 300 });
    return json({ secret, uri });
  }

  const session = await authenticate(request, env);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  const secret = await getUserTOTPSecret(session.username, env);
  return json({ enabled: !!secret });
}

// POST — { setupToken, code }        → first-time mandatory setup → { token }
//        { action:'setup' }          → dashboard: generate secret → { secret, uri }
//        { action:'enable', code }   → dashboard: save secret
//        { action:'disable' }        → dashboard: remove secret
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  // ── Unauthenticated first-time setup (login flow) ─────────────────────────
  if (body.setupToken) {
    const sessionData = await env.CMS_KV.get(`setup_session:${body.setupToken}`, 'json');
    if (!sessionData) return json({ error: 'Setup session expired — please log in again.' }, 401);
    const secret = await env.CMS_KV.get(`setup_pending:${body.setupToken}`);
    if (!secret) return json({ error: 'No pending secret — please refresh the page.' }, 400);

    if (!await verifyTOTP(secret, (body.code || '').trim())) {
      return json({ error: 'Invalid code — check your authenticator app and try again.' }, 400);
    }

    await setUserTOTPSecret(sessionData.username, secret, env);
    await env.CMS_KV.delete(`setup_session:${body.setupToken}`);
    await env.CMS_KV.delete(`setup_pending:${body.setupToken}`);

    const token = crypto.randomUUID();
    await env.CMS_KV.put(`session:${token}`, JSON.stringify({ username: sessionData.username }), { expirationTtl: 86400 });
    return json({ token });
  }

  // ── Authenticated dashboard management ────────────────────────────────────
  const session = await authenticate(request, env);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  if (body.action === 'setup') {
    const secret = newTOTPSecret();
    const uri    = totpUri(secret, 'Ling Seminar CMS', session.username);
    await env.CMS_KV.put('totp_pending', secret, { expirationTtl: 600 });
    return json({ secret, uri });
  }

  if (body.action === 'enable') {
    const secret = await env.CMS_KV.get('totp_pending');
    if (!secret) return json({ error: 'Setup session expired — please start again.' }, 400);
    if (!await verifyTOTP(secret, (body.code || '').trim())) {
      return json({ error: 'Invalid code — check your authenticator app and try again.' }, 400);
    }
    await setUserTOTPSecret(session.username, secret, env);
    await env.CMS_KV.delete('totp_pending');
    return json({ success: true });
  }

  if (body.action === 'disable') {
    await setUserTOTPSecret(session.username, null, env);
    return json({ success: true });
  }

  return json({ error: 'Unknown action' }, 400);
}
