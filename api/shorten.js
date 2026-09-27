const { kv } = require('@vercel/kv');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateCode(length) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL required' });

    // auto add https if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // try to reuse existing short code for same URL
    const existing = await kv.get(`url:${url}`);
    if (existing) {
      const host = req.headers.host;
      return res.json({ shortUrl: `https://${host}/${existing}` });
    }

    // generate shortest possible code
    let length = 1;
    let code;
    let attempts = 0;

    while (true) {
      code = generateCode(length);
      const exists = await kv.exists(`code:${code}`);
      if (!exists) break;

      attempts++;
      if (attempts > 15) {
        length++;
        attempts = 0;
      }
    }

    // save both ways
    await kv.set(`code:${code}`, url);
    await kv.set(`url:${url}`, code);

    const host = req.headers.host;
    res.json({ shortUrl: `https://${host}/${code}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to shorten' });
  }
};
