/**
 * Absolute base URL for uploaded assets.
 * Prefer PUBLIC_APP_URL (set in Vercel), else request host, else localhost.
 */
export function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`;
  }
  if (req?.headers?.['x-forwarded-host'] || req?.headers?.host) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'http';
    return `${proto}://${host}`;
  }
  return `http://localhost:${process.env.PORT || 3001}`;
}

export function uploadPublicUrl(req, filename) {
  return `${getPublicBaseUrl(req)}/uploads/${filename}`;
}
