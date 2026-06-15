import bcrypt from 'bcryptjs';
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

  const { token, password } = body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token und Passwort erforderlich' });
  if (password.length < 8) return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });

  const sql = getDb();
  const [row] = await sql`
    SELECT rt.token, rt.user_id, rt.expires_at, rt.used
    FROM reset_tokens rt
    WHERE rt.token = ${token}
  `;

  if (!row) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Link' });
  if (row.used) return res.status(400).json({ error: 'Dieser Link wurde bereits verwendet' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Der Link ist abgelaufen. Bitte neu anfordern.' });

  const hash = await bcrypt.hash(password, 12);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${row.user_id}`;
  await sql`UPDATE reset_tokens SET used = TRUE WHERE token = ${token}`;

  return res.status(200).json({ ok: true });
}
