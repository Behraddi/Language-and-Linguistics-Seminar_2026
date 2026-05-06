import { authenticate, json, cors } from './_helpers.js';

export async function onRequestOptions() { return cors(); }

export async function onRequestGet({ env }) {
  const events = (await env.CMS_KV.get('events', 'json')) || [];
  return json(events);
}

export async function onRequestPost({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  let event;
  try { event = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const events = (await env.CMS_KV.get('events', 'json')) || [];
  event.id = crypto.randomUUID();
  events.push(event);
  await env.CMS_KV.put('events', JSON.stringify(events));
  return json(event, 201);
}

export async function onRequestPut({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  let updated;
  try { updated = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const events = (await env.CMS_KV.get('events', 'json')) || [];
  const idx = events.findIndex(e => e.id === updated.id);
  if (idx === -1) return json({ error: 'Not found' }, 404);
  events[idx] = updated;
  await env.CMS_KV.put('events', JSON.stringify(events));
  return json(updated);
}

export async function onRequestDelete({ request, env }) {
  if (!await authenticate(request, env)) return json({ error: 'Unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const events = (await env.CMS_KV.get('events', 'json')) || [];
  const filtered = events.filter(e => e.id !== body.id);
  await env.CMS_KV.put('events', JSON.stringify(filtered));
  return json({ success: true });
}
