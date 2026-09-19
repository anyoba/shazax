export class ApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', requestId = '', stage = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.stage = stage;
  }
}

export async function getAuthHeaders(getToken) {
  if (typeof getToken !== 'function') {
    throw new ApiError('Authentication is required.', { status: 401, code: 'AUTHENTICATION_REQUIRED' });
  }
  const token = await getToken();
  if (!token) throw new ApiError('Authentication is required.', { status: 401, code: 'AUTHENTICATION_REQUIRED' });
  return { Authorization: `Bearer ${token}` };
}

export async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  let body = {};
  try {
    body = contentType.includes('application/json') ? await response.json() : { error: await response.text() };
  } catch {
    body = {};
  }
  if (!response.ok) {
    throw new ApiError(body.error || `Request failed with status ${response.status}.`, {
      status: response.status,
      code: body.code || `HTTP_${response.status}`,
      requestId: body.requestId || '',
      stage: body.stage || '',
    });
  }
  return body;
}
