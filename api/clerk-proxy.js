export default async function handler(req, res) {
	const secretKey = process.env.CLERK_SECRET_KEY;
	const proxyUrl = 'https://shazax.vercel.app/__clerk';

	if (!secretKey) {
		console.error('[clerk-proxy] Missing CLERK_SECRET_KEY in Vercel environment variables');
		return res.status(500).json({ error: 'Missing CLERK_SECRET_KEY in Vercel environment variables.' });
	}

	const requestUrl = new URL(req.url || '/', `https://${req.headers.host || 'shazax.vercel.app'}`);
	const path = normalizeProxyPath(requestUrl.searchParams.get('path'));
	const targetUrl = new URL(path, 'https://frontend-api.clerk.dev');

	// Forward any query params from the original request except the internal `path` param.
	for (const [k, v] of requestUrl.searchParams.entries()) {
		if (k === 'path') continue;
		// append other params to the target URL
		targetUrl.searchParams.append(k, v);
	}

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

	headers.set('Clerk-Proxy-Url', proxyUrl);
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

	// Expose the final target URL for debugging when enabled (safe off by default).
	if (process.env.DEBUG_CLERK_PROXY) {
		res.setHeader('X-Clerk-Proxy-Target', targetUrl.toString());
	}

	const responseHeaders = {};
	response.headers.forEach((value, key) => {
		if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length', 'set-cookie'].includes(key.toLowerCase())) {
			responseHeaders[key] = value;
		}
	});

	const location = response.headers.get('location');
	if (location) {
		responseHeaders.location = rewriteClerkLocation(location, proxyUrl, requestUrl);
	}

	Object.entries(responseHeaders).forEach(([key, value]) => res.setHeader(key, value));

	const setCookies = getSetCookieHeaders(response.headers)
		.map((cookie) => rewriteClerkSetCookie(cookie));
	if (setCookies.length > 0) {
		res.setHeader('Set-Cookie', setCookies);
	}

	res.status(response.status);

	if (response.status >= 300 && response.status < 400) {
		return res.end();
	}

	const arrayBuffer = await response.arrayBuffer();
	if (!arrayBuffer || arrayBuffer.byteLength === 0) return res.end();
	const buffer = Buffer.from(arrayBuffer);
	return res.send(buffer);
}

function normalizeProxyPath(path) {
	if (!path || path === '/') return '/';
	return path.startsWith('/') ? path : `/${path}`;
}

function rewriteClerkLocation(location, proxyUrl, requestUrl) {
	const currentOrigin = requestUrl.origin;
	const locationUrl = new URL(location, currentOrigin);

	if (locationUrl.pathname === '/v1/oauth_callback' && locationUrl.searchParams.has('err_code')) {
		const errorUrl = new URL('/auth', currentOrigin);
		errorUrl.searchParams.set('clerk_oauth_error', locationUrl.searchParams.get('err_code'));
		return errorUrl.toString();
	}

	try {
		const url = new URL(location);
		if (url.hostname === 'frontend-api.clerk.dev') {
			return `${proxyUrl}${url.pathname}${url.search}${url.hash}`;
		}
	} catch {
		// Keep non-URL Location values unchanged.
	}

	return location;
}

function getSetCookieHeaders(headers) {
	if (typeof headers.getSetCookie === 'function') {
		return headers.getSetCookie();
	}

	const setCookie = headers.get('set-cookie');
	return setCookie ? splitSetCookieHeader(setCookie) : [];
}

function splitSetCookieHeader(header) {
	return header.split(/,(?=\s*[^;,=\s]+=[^;,]*?(?:;|$))/g);
}

function rewriteClerkSetCookie(cookie) {
	return cookie.replace(/;\s*Domain=frontend-api\.clerk\.dev/gi, '');
}
