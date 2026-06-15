import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

  const { email, password } = body || {};
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });

  const sql = getDb();
  const [user] = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email.toLowerCase()}`;
  if (!user) return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.SESSION_SECRET, { expiresIn: '7d' });
  return res.status(200).json({ token, user: { id: user.id, email: user.email } });
}
