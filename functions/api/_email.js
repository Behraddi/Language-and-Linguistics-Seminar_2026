export async function sendEmail(env, { to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || 'Language & Linguistics Seminars <seminars@westernsydney.edu.au>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });
  return res;
}

export async function sendBatch(env, emails) {
  // Resend batch API — sends up to 100 at once
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emails.map(e => ({
      from: env.FROM_EMAIL || 'Language & Linguistics Seminars <seminars@westernsydney.edu.au>',
      to: [e.to],
      subject: e.subject,
      html: e.html,
    }))),
  });
  return res;
}

export function welcomeEmailHtml(name, siteUrl) {
  const displayName = name ? `Hi ${name},` : 'Hello,';
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#445AAA 0%,#2e3d8f 100%);padding:40px 40px 32px;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px">Language &amp; Linguistics<br>Seminar Series</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px">Western Sydney University</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e">${displayName}</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
              You're now subscribed to the <strong>Bi-weekly Research Seminar Series</strong> hosted by the Languages and Linguistics Academic Program at Western Sydney University.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">
              You'll receive updates whenever new seminar events are announced — including speaker details, abstracts, and Zoom links.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px">
              <tr>
                <td style="background:#445AAA;border-radius:8px;padding:0">
                  <a href="${siteUrl}" style="display:inline-block;padding:14px 28px;color:white;text-decoration:none;font-size:15px;font-weight:600">View Upcoming Events</a>
                </td>
              </tr>
            </table>
            <div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;border-left:3px solid #445AAA">
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">
                You can also subscribe to our <strong>RSS feed</strong> at <a href="${siteUrl}/api/rss" style="color:#445AAA">${siteUrl}/api/rss</a> to get updates in your RSS reader.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6">
              Languages &amp; Linguistics Academic Program · Western Sydney University<br>
              <a href="${siteUrl}/api/newsletter?unsubscribe=1&email={{EMAIL}}" style="color:#9ca3af">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function newsletterEmailHtml(subject, bodyHtml, siteUrl, subscriberEmail) {
  const unsubUrl = `${siteUrl}/api/newsletter?unsubscribe=1&email=${encodeURIComponent(subscriberEmail)}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#445AAA 0%,#2e3d8f 100%);padding:32px 40px;text-align:center">
            <p style="color:rgba(255,255,255,0.7);margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px">Language &amp; Linguistics Seminar Series</p>
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700">${subject}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;font-size:15px;color:#374151;line-height:1.7">
            ${bodyHtml}
            <table cellpadding="0" cellspacing="0" style="margin:32px 0 0">
              <tr>
                <td style="background:#445AAA;border-radius:8px;padding:0">
                  <a href="${siteUrl}" style="display:inline-block;padding:14px 28px;color:white;text-decoration:none;font-size:15px;font-weight:600">View All Events</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6">
              Languages &amp; Linguistics Academic Program · Western Sydney University<br>
              You're receiving this because you subscribed at <a href="${siteUrl}" style="color:#9ca3af">${siteUrl}</a><br>
              <a href="${unsubUrl}" style="color:#9ca3af">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
