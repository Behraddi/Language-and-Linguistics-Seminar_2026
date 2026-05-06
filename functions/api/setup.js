import { json, cors, isSetupRequired, hashNewPassword, authenticate } from './_helpers.js';

export async function onRequestOptions() { return cors(); }

// GET — check whether setup is still needed
export async function onRequestGet({ env }) {
  const setupRequired = await isSetupRequired(env);
  return json({ setupRequired });
}

// POST — create the admin account (only works once, when no credentials exist)
export async function onRequestPost({ request, env }) {
  if (!await isSetupRequired(env)) {
    return json({ error: 'Admin account already exists. Please log in.' }, 409);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { username, password, confirmPassword } = body;
  if (!username || username.trim().length < 3) {
    return json({ error: 'Username must be at least 3 characters.' }, 400);
  }
  if (!password || password.length < 8) {
    return json({ error: 'Password must be at least 8 characters.' }, 400);
  }
  if (password !== confirmPassword) {
    return json({ error: 'Passwords do not match.' }, 400);
  }

  const { hash, salt } = await hashNewPassword(password);
  await env.CMS_KV.put('admin_credentials', JSON.stringify({
    username: username.trim(),
    hash,
    salt,
    createdAt: new Date().toISOString(),
  }));

  return json({ success: true, message: 'Admin account created. You can now log in.' });
}

// PUT — change password (requires current session token)
export async function onRequestPut({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (env.ADMIN_USER && env.ADMIN_PASS) {
    return json({ error: 'Credentials are managed via environment variables. Update them in your Cloudflare dashboard.' }, 403);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { newUsername, newPassword } = body;
  if (!newUsername || newUsername.trim().length < 3) {
    return json({ error: 'Username must be at least 3 characters.' }, 400);
  }
  if (!newPassword || newPassword.length < 8) {
    return json({ error: 'New password must be at least 8 characters.' }, 400);
  }

  const { hash, salt } = await hashNewPassword(newPassword);
  await env.CMS_KV.put('admin_credentials', JSON.stringify({
    username: newUsername.trim(),
    hash,
    salt,
    updatedAt: new Date().toISOString(),
  }));

  return json({ success: true, message: 'Credentials updated. Please log in again.' });
}
