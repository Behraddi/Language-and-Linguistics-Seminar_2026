import { json, cors, authenticate, listAdminUsers, createAdminUser, deleteAdminUser } from './_helpers.js';

export async function onRequestOptions() { return cors(); }

// GET — list all admin users
export async function onRequestGet({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  const users = await listAdminUsers(env);
  return json(users);
}

// POST — create new admin user { username, password }
export async function onRequestPost({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const result = await createAdminUser(body.username?.trim(), body.password, env);
  if (result.error) return json(result, 400);
  return json(result);
}

// DELETE — delete an admin user { username } (cannot delete yourself)
export async function onRequestDelete({ request, env }) {
  const session = await authenticate(request, env);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { username } = body;
  if (!username) return json({ error: 'Missing username' }, 400);
  if (username === session.username) return json({ error: 'You cannot delete your own account.' }, 400);

  await deleteAdminUser(username, env);
  return json({ success: true });
}
