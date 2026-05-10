import { authenticate, json, cors } from './_helpers.js';

export async function onRequestOptions() { return cors(); }

export async function onRequestGet({ env }) {
  const val = await env.CMS_KV.get('site_maintenance');
  return json({ enabled: val === '1' });
}

export async function onRequestPost({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  await env.CMS_KV.put('site_maintenance', body.enabled ? '1' : '0');
  return json({ enabled: !!body.enabled });
}
