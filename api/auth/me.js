import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Nicht eingeloggt' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.SESSION_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
  }

  const sql = getDb();
  const [user] = await sql`SELECT id, email, created_at FROM users WHERE id = ${payload.sub}`;
  if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden' });

  return res.status(200).json({ user: { id: user.id, email: user.email } });
}
