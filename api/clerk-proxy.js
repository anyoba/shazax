export default async function handler(req, res) {
	const secretKey = process.env.CLERK_SECRET_KEY;

	if (!secretKey) {
		console.error('[clerk-proxy] Missing CLERK_SECRET_KEY in Vercel environment variables');
		return res.status(500).json({ error: 'Missing CLERK_SECRET_KEY in Vercel environment variables.' });
	}

	const requestUrl = new URL(req.url || '/', `https://${req.headers.host || 'shazax.vercel.app'}`);
	const path = requestUrl.searchParams.get('path') || '/';
	const targetUrl = new URL(path, 'https://frontend-api.clerk.dev');

	const method = req.method || 'GET';

	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers || {})) {
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
		];
		if (skip.includes(key.toLowerCase())) continue;
		const headerValue = Array.isArray(value) ? value.join(', ') : value;
		headers.set(key, headerValue);
	}

	headers.set('Clerk-Proxy-Url', 'https://shazax.vercel.app/__clerk');
	headers.set('Clerk-Secret-Key', secretKey);
	const forwardedFor = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
	headers.set('X-Forwarded-For', typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown');
	headers.set('X-Forwarded-Proto', 'https');

	let body;
	const hasBody = !['GET', 'HEAD'].includes(method.toUpperCase());
	if (hasBody) {
		const chunks = [];
		for await (const chunk of req) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		if (chunks.length > 0) body = Buffer.concat(chunks);
	}

	const response = await fetch(targetUrl.toString(), {
		method,
		headers,
		body: hasBody && body ? body : undefined,
		redirect: 'manual',
	});

	const responseHeaders = {};
	response.headers.forEach((value, key) => {
		if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
			responseHeaders[key] = value;
		}
	});

	Object.entries(responseHeaders).forEach(([key, value]) => res.setHeader(key, value));
	res.status(response.status);

	if (response.status >= 300 && response.status < 400) {
		return res.end();
	}

	const arrayBuffer = await response.arrayBuffer();
	if (!arrayBuffer || arrayBuffer.byteLength === 0) return res.end();
	const buffer = Buffer.from(arrayBuffer);
	return res.send(buffer);
}
