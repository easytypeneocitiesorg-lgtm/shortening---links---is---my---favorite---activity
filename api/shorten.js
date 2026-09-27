export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  try {
    // is.gd - one of the shortest free shorteners that exists
    const api = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
    const response = await fetch(api);
    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Shortening failed' });
  }
}
