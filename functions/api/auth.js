import { json, cors, verifyLogin, isSetupRequired } from './_helpers.js';

export async function onRequestOptions() {
  return cors();
}

// GET — check setup/login status (used by admin pages on load)
export async function onRequestGet({ env }) {
  const setupRequired = await isSetupRequired(env);
  return json({ setupRequired });
}

// POST — login
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { username, password } = body;
  if (!username || !password) return json({ error: 'Missing credentials' }, 400);

  if (await verifyLogin(username, password, env)) {
    const token = crypto.randomUUID();
    await env.CMS_KV.put(`session:${token}`, '1', { expirationTtl: 86400 });
    return json({ token });
  }
  return json({ error: 'Invalid username or password' }, 401);
}

// DELETE — logout
export async function onRequestDelete({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) await env.CMS_KV.delete(`session:${token}`);
  return json({ success: true });
}
