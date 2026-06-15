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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  if (password.length < 8) return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });

  const sql = getDb();
  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length > 0) return res.status(409).json({ error: 'Diese E-Mail ist bereits registriert' });

  const hash = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (email, password_hash) VALUES (${email.toLowerCase()}, ${hash})
    RETURNING id, email, created_at
  `;

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.SESSION_SECRET, { expiresIn: '7d' });
  return res.status(201).json({ token, user: { id: user.id, email: user.email } });
}
