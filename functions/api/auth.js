import {
  json, cors, verifyLogin, isSetupRequired,
  checkRateLimit, recordFailedAttempt, clearRateLimit, verifyTurnstile,
  getUserTOTPSecret,
} from './_helpers.js';
import { verifyTOTP } from './_totp.js';

export async function onRequestOptions() { return cors(); }

export async function onRequestGet({ env }) {
  const setupRequired    = await isSetupRequired(env);
  const turnstileSiteKey = env.TURNSTILE_SITE_KEY || null;
  return json({ setupRequired, turnstileSiteKey });
}

function clientIP(request) {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')
    || 'unknown';
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const ip = clientIP(request);

  // ── Step 2: TOTP code verification ───────────────────────────────────────
  if (body.tempToken && body.totpCode) {
    const tempData = await env.CMS_KV.get(`temp_session:${body.tempToken}`, 'json');
    if (!tempData) return json({ error: 'Session expired — please log in again.' }, 401);

    const secret = await getUserTOTPSecret(tempData.username, env);
    if (!secret) return json({ error: 'TOTP not configured.' }, 500);

    if (!await verifyTOTP(secret, (body.totpCode || '').trim())) {
      await recordFailedAttempt(ip, env);
      return json({ error: 'Invalid code — please try again.' }, 401);
    }

    await env.CMS_KV.delete(`temp_session:${body.tempToken}`);
    await clearRateLimit(ip, env);
    const token = crypto.randomUUID();
    await env.CMS_KV.put(`session:${token}`, JSON.stringify({ username: tempData.username }), { expirationTtl: 86400 });
    return json({ token });
  }

  // ── Step 1: Username + password ───────────────────────────────────────────
  const { username, password, turnstileToken } = body;
  if (!username || !password) return json({ error: 'Missing credentials' }, 400);

  const rl = await checkRateLimit(ip, env);
  if (rl.blocked) {
    const mins = Math.ceil(rl.retryAfter / 60);
    return json({ error: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` }, 429);
  }

  if (!await verifyTurnstile(turnstileToken, env)) {
    return json({ error: 'Bot verification failed — please try again.' }, 400);
  }

  if (!await verifyLogin(username, password, env)) {
    await recordFailedAttempt(ip, env);
    return json({ error: 'Invalid username or password.' }, 401);
  }

  await clearRateLimit(ip, env);

  const totpSecret = await getUserTOTPSecret(username, env);
  if (totpSecret) {
    const tempToken = crypto.randomUUID();
    await env.CMS_KV.put(`temp_session:${tempToken}`, JSON.stringify({ username }), { expirationTtl: 300 });
    return json({ requires2FA: true, tempToken });
  }

  // No TOTP yet — force first-time setup
  const setupToken = crypto.randomUUID();
  await env.CMS_KV.put(`setup_session:${setupToken}`, JSON.stringify({ username }), { expirationTtl: 300 });
  return json({ requiresTOTPSetup: true, setupToken });
}

export async function onRequestDelete({ request, env }) {
  const auth  = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) await env.CMS_KV.delete(`session:${token}`);
  return json({ success: true });
}
