// Vercel serverless function.
// Admin panel (admin.html) calls this to add/delete products.
// It writes the change to products.json in the GitHub repo, which then
// re-deploys automatically and shows the new stock to every visitor.
//
// Needs these Environment Variables set in the Vercel project (Settings > Environment Variables):
//   GITHUB_TOKEN   - a GitHub Personal Access Token with "contents: read & write" on this repo
//   GITHUB_REPO    - "owner/repo", e.g. "rishipahwajee2024-cmyk/pahwautospares"
//   ADMIN_PASSWORD - the password you'll type into admin.html to make changes
//   GITHUB_BRANCH  - optional, defaults to "main"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { password, action, product, id } = req.body || {};
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
  const FILE_PATH = 'products.json';

  if (!ADMIN_PASSWORD || !GITHUB_TOKEN || !GITHUB_REPO) {
    res.status(500).json({ error: 'Server abhi set up nahi hua hai. Vercel me GITHUB_TOKEN, GITHUB_REPO aur ADMIN_PASSWORD add karo.' });
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Galat password.' });
    return;
  }

  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${GITHUB_BRANCH}`;
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'pahwa-auto-spares-admin',
      Accept: 'application/vnd.github+json',
    };

    const getResp = await fetch(apiUrl, { headers: ghHeaders });
    if (!getResp.ok) {
      throw new Error('products.json GitHub se nahi mil paya (' + getResp.status + ')');
    }
    const fileData = await getResp.json();
    const sha = fileData.sha;
    const current = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));
    let products = current.products || [];

    if (action === 'add') {
      if (!product || !product.name || !product.cat) {
        res.status(400).json({ error: 'Naam aur category zaroori hai.' });
        return;
      }
      products.push({ ...product, id: Date.now() });
    } else if (action === 'delete') {
      products = products.filter((p) => p.id !== id);
    } else {
      res.status(400).json({ error: 'Invalid action' });
      return;
    }

    const newContentStr = JSON.stringify({ products }, null, 2);
    const putResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: action === 'add' ? `Add product: ${product.name}` : `Delete product ${id}`,
        content: Buffer.from(newContentStr).toString('base64'),
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      throw new Error('GitHub update fail hua: ' + errText);
    }

    res.status(200).json({ ok: true, products });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Kuch galat ho gaya.' });
  }
}
