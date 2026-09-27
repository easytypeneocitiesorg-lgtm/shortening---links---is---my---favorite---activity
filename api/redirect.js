const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    const url = await kv.get(`code:${code}`);
    if (!url) {
      return res.status(404).send('Short link not found');
    }
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};
