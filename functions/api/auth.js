import {
  json, cors, verifyLogin, isSetupRequired,
  checkRateLimit, recordFailedAttempt, clearRateLimit, verifyTurnstile,
} from './_helpers.js';
import { verifyTOTP } from './_totp.js';

export async function onRequestOptions() { return cors(); }

// GET — setup/login status + optional Turnstile site key for the login page
export async function onRequestGet({ env }) {
  const setupRequired = await isSetupRequired(env);
  const turnstileSiteKey = env.TURNSTILE_SITE_KEY || null;
  return json({ setupRequired, turnstileSiteKey });
}

function clientIP(request) {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')
    || 'unknown';
}

// POST — two-step login
//   Step 1: { username, password, turnstileToken? }  → { token } or { requires2FA, tempToken }
//   Step 2: { tempToken, totpCode }                  → { token }
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const ip = clientIP(request);

  // ── Step 2: TOTP verification ────────────────────────────────────────────
  if (body.tempToken && body.totpCode) {
    const tempData = await env.CMS_KV.get(`temp_session:${body.tempToken}`, 'json');
    if (!tempData) {
      return json({ error: 'Session expired — please log in again.' }, 401);
    }

    const secret = await env.CMS_KV.get('totp_secret');
    if (!secret) return json({ error: 'TOTP not configured.' }, 500);

    if (!await verifyTOTP(secret, (body.totpCode || '').trim())) {
      await recordFailedAttempt(ip, env);
      return json({ error: 'Invalid code — please try again.' }, 401);
    }

    await env.CMS_KV.delete(`temp_session:${body.tempToken}`);
    await clearRateLimit(ip, env);
    const token = crypto.randomUUID();
    await env.CMS_KV.put(`session:${token}`, '1', { expirationTtl: 86400 });
    return json({ token });
  }

  // ── Step 1: Username + password ──────────────────────────────────────────
  const { username, password, turnstileToken } = body;
  if (!username || !password) return json({ error: 'Missing credentials' }, 400);

  // Rate limit check
  const rl = await checkRateLimit(ip, env);
  if (rl.blocked) {
    const mins = Math.ceil(rl.retryAfter / 60);
    return json({ error: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` }, 429);
  }

  // Turnstile bot check (only when TURNSTILE_SECRET_KEY is set)
  if (!await verifyTurnstile(turnstileToken, env)) {
    return json({ error: 'Bot verification failed — please try again.' }, 400);
  }

  // Credential check
  if (!await verifyLogin(username, password, env)) {
    await recordFailedAttempt(ip, env);
    return json({ error: 'Invalid username or password.' }, 401);
  }

  // TOTP check: if enabled, issue a 5-minute temp token instead of a full session
  const totpSecret = await env.CMS_KV.get('totp_secret');
  if (totpSecret) {
    const tempToken = crypto.randomUUID();
    await env.CMS_KV.put(`temp_session:${tempToken}`, JSON.stringify({ username }), { expirationTtl: 300 });
    return json({ requires2FA: true, tempToken });
  }

  // No 2FA configured — issue full session
  await clearRateLimit(ip, env);
  const token = crypto.randomUUID();
  await env.CMS_KV.put(`session:${token}`, '1', { expirationTtl: 86400 });
  return json({ token });
}

// DELETE — logout
export async function onRequestDelete({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) await env.CMS_KV.delete(`session:${token}`);
  return json({ success: true });
}
