module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Use is.gd (super short links)
    const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    // is.gd returns either { shorturl: "..." } or { errorcode, errormessage }
    if (data.shorturl) {
      return res.status(200).json({ shorturl: data.shorturl });
    } else {
      return res.status(400).json({ 
        error: data.errormessage || 'Failed to create short link' 
      });
    }

  } catch (err) {
    console.error('Shorten error:', err);
    return res.status(500).json({ error: 'Server error while shortening' });
  }
};
