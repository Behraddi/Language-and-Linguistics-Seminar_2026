async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyLogin(username, password, env) {
  if (env.ADMIN_USER && env.ADMIN_PASS) {
    return username === env.ADMIN_USER && password === env.ADMIN_PASS;
  }
  const stored = await env.CMS_KV.get('admin_credentials', 'json');
  if (!stored) return false;
  const hash = await sha256(password + stored.salt);
  return username === stored.username && hash === stored.hash;
}

export async function hashNewPassword(password) {
  const salt = crypto.randomUUID();
  const hash = await sha256(password + salt);
  return { hash, salt };
}

export async function isSetupRequired(env) {
  if (env.ADMIN_USER && env.ADMIN_PASS) return false;
  const stored = await env.CMS_KV.get('admin_credentials', 'json');
  return !stored;
}

export async function authenticate(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const valid = await env.CMS_KV.get(`session:${token}`);
  return valid !== null;
}

// ── Rate limiting ────────────────────────────────────────────────────────────
const RATE_WINDOW_SEC = 15 * 60;  // 15-minute window
const RATE_MAX        = 5;        // max failures before lockout

export async function checkRateLimit(ip, env) {
  const data = await env.CMS_KV.get(`ratelimit:${ip}`, 'json');
  if (!data) return { blocked: false };
  if (data.blocked && data.until > Date.now()) {
    return { blocked: true, retryAfter: Math.ceil((data.until - Date.now()) / 1000) };
  }
  return { blocked: false };
}

export async function recordFailedAttempt(ip, env) {
  const key = `ratelimit:${ip}`;
  const data = (await env.CMS_KV.get(key, 'json')) || { count: 0 };
  data.count = (data.count || 0) + 1;
  if (data.count >= RATE_MAX) {
    data.blocked = true;
    data.until = Date.now() + RATE_WINDOW_SEC * 1000;
  }
  await env.CMS_KV.put(key, JSON.stringify(data), { expirationTtl: RATE_WINDOW_SEC });
}

export async function clearRateLimit(ip, env) {
  await env.CMS_KV.delete(`ratelimit:${ip}`);
}

// ── Cloudflare Turnstile ─────────────────────────────────────────────────────
export async function verifyTurnstile(token, env) {
  if (!env.TURNSTILE_SECRET_KEY) return true; // not configured — skip
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

// ── Response helpers ─────────────────────────────────────────────────────────
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
