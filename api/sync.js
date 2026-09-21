// Vercel Serverless Sync API Endpoint
let cachedData = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Key');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      if (!cachedData) {
        return res.status(200).json({ status: 'empty' });
      }
      return res.status(200).json(cachedData);
    }

    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (payload && payload.products) {
        cachedData = payload;
        cachedData.lastModified = payload.lastModified || Date.now();
        return res.status(200).json({ success: true, lastModified: cachedData.lastModified });
      }
      return res.status(400).json({ error: 'Payload non valido' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
