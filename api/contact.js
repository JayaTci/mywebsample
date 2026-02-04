// Serverless function to create a GitHub issue from a contact form submission
// Designed for Vercel / Netlify (Node 18+). Configure env vars: GITHUB_TOKEN and optionally GITHUB_REPO (owner/repo)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const message = (body.message || '').trim();
    const hp = (body.hp || '').trim(); // honeypot

    if (hp) return res.status(400).json({ error: 'Spam detected' });
    if (!message || message.length < 3) return res.status(400).json({ error: 'Message is required' });

    // Very small in-memory rate limit (per IP). Serverless instances are ephemeral; this is a best-effort guard.
    global.__contactRateLimit = global.__contactRateLimit || {};

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = ip;
    const now = Date.now();
    const last = global.__contactRateLimit[key] || 0;
    const MIN_MS = 30 * 1000; // 30 seconds
    if (now - last < MIN_MS) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    global.__contactRateLimit[key] = now;

    const repo = process.env.GITHUB_REPO || 'JayaTci/mywebsample';
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'Server not configured. Ask the site owner to set GITHUB_TOKEN.' });

    const title = `Contact: ${name || 'Anonymous'} (${new Date().toISOString()})`;
    const issueBody = `**Message**:\n${message}\n\n**From**: ${name || 'Anonymous'}\n**Email**: ${email || 'Not provided'}\n**IP**: ${ip}`;

    // Use the GitHub REST API to create an issue
    const ghRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body: issueBody })
    });

    if (!ghRes.ok) {
      const text = await ghRes.text();
      return res.status(500).json({ error: 'Failed to create issue', details: text });
    }

    const data = await ghRes.json();
    return res.status(200).json({ success: true, url: data.html_url });
  } catch (err) {
    console.error('Contact API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
