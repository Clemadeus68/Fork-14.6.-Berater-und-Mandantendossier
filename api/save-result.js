import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token fehlt' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Ungültiges JSON' }); }
  }

  const { url, companyName, report, briefing, sistrixData, competitors } = body || {};
  if (!report && !sistrixData) return res.status(400).json({ error: 'Keine Daten' });

  const id = randomUUID().replace(/-/g, '').slice(0, 12);
  const storeId = 'store_' + token.split('_')[3];
  const payload = JSON.stringify({
    url: url || '',
    companyName: companyName || '',
    report: report || '',
    briefing: briefing || '',
    sistrixData: sistrixData || null,
    competitors: competitors || [],
    createdAt: new Date().toISOString().slice(0, 10),
  });

  try {
    const uploadRes = await fetch(`https://blob.vercel-storage.com/results/${id}.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-vercel-blob-store-id': storeId,
        'x-vercel-blob-access': 'private',
      },
      body: payload,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: 'Blob PUT fehlgeschlagen', detail: err });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Fetch fehlgeschlagen', detail: e.message });
  }

  return res.status(200).json({ id });
}
