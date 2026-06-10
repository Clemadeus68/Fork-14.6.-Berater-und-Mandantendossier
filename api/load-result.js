export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token fehlt' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID fehlt' });

  const storeId = 'store_' + token.split('_')[3];

  // List blobs with prefix to find the one matching this ID
  const listRes = await fetch(`https://blob.vercel-storage.com?prefix=results/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-vercel-blob-store-id': storeId,
    },
  });

  if (!listRes.ok) return res.status(500).json({ error: 'Fehler beim Suchen' });

  const { blobs } = await listRes.json();
  if (!blobs || blobs.length === 0) return res.status(404).json({ error: 'Ergebnis nicht gefunden' });

  // Fetch private blob with auth
  const contentRes = await fetch(blobs[0].url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!contentRes.ok) return res.status(500).json({ error: 'Fehler beim Laden' });

  const data = await contentRes.json();
  return res.status(200).json(data);
}
