function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function onRequestGet({ env, request }) {
  const events = (await env.CMS_KV.get('events', 'json')) || [];
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const now = new Date();

  const upcoming = events
    .filter(e => e.date && new Date(e.date + 'T00:00:00') >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const items = upcoming.map(e => {
    const eventDate = new Date(e.date + 'T' + (e.time || '13:00') + ':00');
    const title = e.title && e.title !== 'TBA' ? e.title : `Seminar: ${e.speaker}`;
    const desc = e.abstract
      ? e.abstract.substring(0, 300) + (e.abstract.length > 300 ? '...' : '')
      : `${e.speaker} from ${e.institution || 'TBA'} presents at the Language & Linguistics Seminar Series.`;
    return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${baseUrl}/#events</link>
      <guid isPermaLink="false">${e.id}</guid>
      <pubDate>${eventDate.toUTCString()}</pubDate>
      <description>${escapeXml(desc)}</description>
      <author>${escapeXml(e.speaker)}</author>
      <category>Linguistics Seminar</category>
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Language &amp; Linguistics Seminar Series – WSU</title>
    <link>${baseUrl}</link>
    <description>Bi-weekly Research Seminar Series hosted by the Languages and Linguistics Academic Program, Western Sydney University.</description>
    <language>en-au</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/img/logo.svg</url>
      <title>Language &amp; Linguistics Seminar Series</title>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
