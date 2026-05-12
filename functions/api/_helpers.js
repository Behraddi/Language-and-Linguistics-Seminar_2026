async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── User storage ─────────────────────────────────────────────────────────────
// Primary admin → KV 'admin_credentials'  (created by setup.html, legacy)
// Extra admins  → KV 'admin_users'        (JSON object keyed by username)

async function getAdminUsers(env) {
  return (await env.CMS_KV.get('admin_users', 'json')) || {};
}
async function saveAdminUsers(users, env) {
  await env.CMS_KV.put('admin_users', JSON.stringify(users));
}

export async function verifyLogin(username, password, env) {
  if (env.ADMIN_USER && env.ADMIN_PASS) {
    return username === env.ADMIN_USER && password === env.ADMIN_PASS;
  }
  // Check additional users
  const users = await getAdminUsers(env);
  if (users[username]) {
    const hash = await sha256(password + users[username].salt);
    return hash === users[username].hash;
  }
  // Fall back to primary admin (legacy)
  const stored = await env.CMS_KV.get('admin_credentials', 'json');
  if (!stored || stored.username !== username) return false;
  const hash = await sha256(password + stored.salt);
  return hash === stored.hash;
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

// Returns { username } or null. Object is truthy so existing `if (!authenticate)` checks still work.
export async function authenticate(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const val = await env.CMS_KV.get(`session:${token}`);
  if (val === null) return null;
  try {
    const data = JSON.parse(val);
    return typeof data === 'object' && data.username ? data : { username: 'admin' };
  } catch {
    return { username: 'admin' }; // old sessions stored '1'
  }
}

// ── Per-user TOTP ─────────────────────────────────────────────────────────────
export async function getUserTOTPSecret(username, env) {
  const users = await getAdminUsers(env);
  if (users[username]) return users[username].totpSecret || null;
  // Primary admin uses global totp_secret
  return await env.CMS_KV.get('totp_secret');
}

export async function setUserTOTPSecret(username, secret, env) {
  const users = await getAdminUsers(env);
  if (users[username]) {
    users[username].totpSecret = secret || null;
    await saveAdminUsers(users, env);
  } else {
    // Primary admin
    if (secret) await env.CMS_KV.put('totp_secret', secret);
    else         await env.CMS_KV.delete('totp_secret');
  }
}

// ── User CRUD ─────────────────────────────────────────────────────────────────
export async function listAdminUsers(env) {
  const users = await getAdminUsers(env);
  const result = [];
  const stored = await env.CMS_KV.get('admin_credentials', 'json');
  if (stored) {
    const totpSecret = await env.CMS_KV.get('totp_secret');
    result.push({ username: stored.username, has2FA: !!totpSecret, isPrimary: true });
  }
  for (const [u, data] of Object.entries(users)) {
    result.push({ username: u, has2FA: !!data.totpSecret, isPrimary: false });
  }
  return result;
}

export async function createAdminUser(username, password, env) {
  if (!username || username.length < 3) return { error: 'Username must be at least 3 characters' };
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters' };
  const users = await getAdminUsers(env);
  if (users[username]) return { error: 'Username already exists' };
  const stored = await env.CMS_KV.get('admin_credentials', 'json');
  if (stored && stored.username === username) return { error: 'Username already exists' };
  const { hash, salt } = await hashNewPassword(password);
  users[username] = { hash, salt, totpSecret: null };
  await saveAdminUsers(users, env);
  return { success: true };
}

export async function deleteAdminUser(username, env) {
  const users = await getAdminUsers(env);
  delete users[username];
  await saveAdminUsers(users, env);
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const RATE_WINDOW_SEC = 15 * 60;
const RATE_MAX        = 5;

export async function checkRateLimit(ip, env) {
  const data = await env.CMS_KV.get(`ratelimit:${ip}`, 'json');
  if (!data) return { blocked: false };
  if (data.blocked && data.until > Date.now()) {
    return { blocked: true, retryAfter: Math.ceil((data.until - Date.now()) / 1000) };
  }
  return { blocked: false };
}

export async function recordFailedAttempt(ip, env) {
  const key  = `ratelimit:${ip}`;
  const data = (await env.CMS_KV.get(key, 'json')) || { count: 0 };
  data.count = (data.count || 0) + 1;
  if (data.count >= RATE_MAX) {
    data.blocked = true;
    data.until   = Date.now() + RATE_WINDOW_SEC * 1000;
  }
  await env.CMS_KV.put(key, JSON.stringify(data), { expirationTtl: RATE_WINDOW_SEC });
}

export async function clearRateLimit(ip, env) {
  await env.CMS_KV.delete(`ratelimit:${ip}`);
}

// ── Cloudflare Turnstile ──────────────────────────────────────────────────────
export async function verifyTurnstile(token, env) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const res  = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

// ── Response helpers ──────────────────────────────────────────────────────────
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
