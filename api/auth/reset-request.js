import { randomBytes } from 'crypto';
import { getDb } from '../db.js';

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Ungültiges JSON' }); }
  }

  const { email } = body || {};
  if (!email) return res.status(400).json({ error: 'E-Mail erforderlich' });

  // Always return 200 to avoid revealing whether email exists
  const sql = getDb();
  const [user] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (!user) return res.status(200).json({ ok: true });

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await sql`
    INSERT INTO reset_tokens (token, user_id, expires_at)
    VALUES (${token}, ${user.id}, ${expiresAt.toISOString()})
    ON CONFLICT (token) DO NOTHING
  `;

  const baseUrl = process.env.FRONTEND_URL || `https://${process.env.VERCEL_URL}`;
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'E-Mail-Versand nicht konfiguriert' });

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'be nice Strategietool <noreply@nice-network.de>',
      to: [email.toLowerCase()],
      subject: 'Passwort zurücksetzen – be nice Strategietool',
      html: resetEmailHtml(resetLink),
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden' });
  }

  return res.status(200).json({ ok: true });
}

function resetEmailHtml(resetLink) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Calibri,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#cccccc;border-bottom:4px solid #8CC63E;padding:20px 32px;">
            <span style="font-size:16px;font-weight:700;color:#454544;">be nice Strategietool</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#454544;">Hallo,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#454544;line-height:1.5;">
              du hast angefragt, dein Passwort zurückzusetzen. Klick auf den Button &ndash; der Link ist eine Stunde gültig.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#8CC63E;border-radius:4px;padding:12px 28px;">
                  <a href="${resetLink}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                    Passwort zurücksetzen
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#777777;">
              Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#777777;word-break:break-all;">
              <a href="${resetLink}" style="color:#33AB97;">${resetLink}</a>
            </p>
            <p style="margin:0;font-size:13px;color:#777777;">
              Wenn du kein Passwort zurückgesetzt hast, kannst du diese E-Mail ignorieren.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f0f0f0;padding:16px 32px;border-top:1px solid #e0e0e0;">
            <p style="margin:0;font-size:12px;color:#999999;">Clemens Gutmann · be nice Managementberatung · www.nice-network.de</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
