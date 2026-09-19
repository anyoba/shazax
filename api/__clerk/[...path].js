export default async function handler(req, res) {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({
      error: 'Missing CLERK_SECRET_KEY in Vercel environment variables.',
    });
  }

  const method = req.method || 'GET';
  const forwardedFor =
    req.headers['x-forwarded-for'] ||
    req.headers['X-Forwarded-For'] ||
    req.socket?.remoteAddress ||
    'unknown';

  const requestUrl = new URL(req.url || '/', 'https://shazax.vercel.app');
  const pathname = requestUrl.pathname.replace(/^\/__clerk/, '').replace(/^\/api\/__clerk/, '') || '/';
  const targetUrl = new URL(`${pathname}${requestUrl.search}`, 'https://frontend-api.clerk.dev');

  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;

    const skip = [
      'host',
      'content-length',
      'connection',
      'transfer-encoding',
      'keep-alive',
      'upgrade',
      'proxy-connection',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailer',
      'proxy-connection',
    ];

    if (skip.includes(key.toLowerCase())) continue;

    const headerValue = Array.isArray(value) ? value.join(', ') : value;
    headers.set(key, headerValue);
  }

  headers.set('Clerk-Proxy-Url', 'https://shazax.vercel.app/__clerk');
  headers.set('Clerk-Secret-Key', secretKey);
  headers.set('X-Forwarded-For', typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown');
  headers.set('X-Forwarded-Proto', 'https');

  let body;
  const hasBody = !['GET', 'HEAD'].includes(method.toUpperCase());

  if (hasBody) {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length > 0) {
      body = Buffer.concat(chunks);
    }
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: hasBody && body ? body : undefined,
  });

  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
      responseHeaders[key] = value;
    }
  });

  Object.entries(responseHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const text = await response.text();
  res.status(response.status);

  if (!text) {
    return res.end();
  }

  return res.send(text);
}
