const { kv } = require('@vercel/kv');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateCode(len) {
  let code = '';
  for (let i = 0; i < len; i++) {
    code += ALPHABET[Math.floor(Math.random() * 62)];
  }
  return code;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    let url = (req.body && req.body.url) || '';
    url = url.trim();

    if (!url) {
      return res.status(400).end(JSON.stringify({ error: 'URL required' }));
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // reuse if already shortened
    const existing = await kv.get(`url:${url}`);
    if (existing) {
      const host = req.headers.host;
      return res.end(JSON.stringify({ shortUrl: `https://${host}/${existing}` }));
    }

    // generate shortest possible code
    let length = 1;
    let code;
    let tries = 0;

    while (true) {
      code = generateCode(length);
      const taken = await kv.exists(`code:${code}`);
      if (!taken) break;

      tries++;
      if (tries > 12) {
        length++;
        tries = 0;
      }
    }

    await kv.set(`code:${code}`, url);
    await kv.set(`url:${url}`, code);

    const host = req.headers.host;
    res.end(JSON.stringify({ shortUrl: `https://${host}/${code}` }));

  } catch (err) {
    console.error(err);
    res.status(500).end(JSON.stringify({ error: 'Server error: ' + err.message }));
  }
};
