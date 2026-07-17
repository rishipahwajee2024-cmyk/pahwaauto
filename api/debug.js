// Temporary diagnostic endpoint. Visit /api/debug in the browser.
// Shows (safely masked) what this LIVE deployment actually sees for each
// environment variable, so we can spot mismatches without guessing.
// Delete this file once the problem is fixed.

export default function handler(req, res) {
  function mask(v) {
    if (!v) return null;
    if (v.length <= 8) return '*'.repeat(v.length);
    return v.slice(0, 4) + '...' + v.slice(-4) + ' (length ' + v.length + ')';
  }

  res.status(200).json({
    GITHUB_TOKEN_present: !!process.env.GITHUB_TOKEN,
    GITHUB_TOKEN_masked: mask(process.env.GITHUB_TOKEN),
    GITHUB_REPO_present: !!process.env.GITHUB_REPO,
    GITHUB_REPO_value: process.env.GITHUB_REPO || null,
    ADMIN_PASSWORD_present: !!process.env.ADMIN_PASSWORD,
    GITHUB_BRANCH_value: process.env.GITHUB_BRANCH || '(default: main)',
    VERCEL_ENV: process.env.VERCEL_ENV || null,
    VERCEL_URL: process.env.VERCEL_URL || null,
    VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG || null,
    VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER || null,
  });
}
