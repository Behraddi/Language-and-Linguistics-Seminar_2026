async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyLogin(username, password, env) {
  // Env vars take priority (for secure production deployments)
  if (env.ADMIN_USER && env.ADMIN_PASS) {
    return username === env.ADMIN_USER && password === env.ADMIN_PASS;
  }
  // Fall back to KV-stored credentials (created via /admin/setup)
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
