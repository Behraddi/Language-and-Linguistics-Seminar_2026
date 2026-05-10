export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  // Never block admin pages or API calls
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) {
    return next();
  }

  const maintenance = await env.CMS_KV.get('site_maintenance');
  if (maintenance !== '1') return next();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Under Maintenance</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: #f0f2f5;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .card {
      background: white; border-radius: 16px;
      padding: 3rem 2.5rem; max-width: 480px; width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.10);
    }
    .icon { font-size: 3.5rem; margin-bottom: 1rem; }
    h1 { color: #1a1a2e; font-size: 1.6rem; margin: 0 0 0.75rem; }
    p { color: #6b7280; margin: 0; line-height: 1.6; }
    .brand { margin-top: 2rem; color: #445AAA; font-weight: 600; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔧</div>
    <h1>Under Maintenance</h1>
    <p>The Language and Linguistics Seminar website is temporarily offline for maintenance. Please check back soon.</p>
    <p class="brand">Western Sydney University</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Retry-After': '3600',
    },
  });
}
