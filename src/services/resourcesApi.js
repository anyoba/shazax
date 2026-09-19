export class ResourcesApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', requestId = '', stage = '' } = {}) {
    super(message);
    this.name = 'ResourcesApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.stage = stage;
  }
}

async function getAuthHeaders(getToken) {
  if (typeof getToken !== 'function') {
    throw new ResourcesApiError('Authentication is required.', {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    });
  }

  const token = await getToken();
  if (!token) {
    throw new ResourcesApiError('Authentication is required.', {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    });
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  let body = {};

  try {
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      const text = await response.text();
      body = text ? { error: text } : {};
    }
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new ResourcesApiError(body.error || `Request failed with status ${response.status}.`, {
      status: response.status,
      code: body.code || `HTTP_${response.status}`,
      requestId: body.requestId || '',
      stage: body.stage || '',
    });
  }

  return body;
}

export async function fetchResources() {
  const response = await fetch('/api/resources');
  const body = await parseResponse(response);
  return body.resources || [];
}

export async function createResource(resource, getToken) {
  const authHeaders = await getAuthHeaders(getToken);
  const response = await fetch('/api/resources', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resource),
  });

  const body = await parseResponse(response);
  return body.resource;
}

export async function updateResource(resourceId, updates, getToken) {
  const authHeaders = await getAuthHeaders(getToken);
  const response = await fetch(`/api/resources?id=${encodeURIComponent(resourceId)}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const body = await parseResponse(response);
  return body.resource;
}

export async function deleteResource(resourceId, getToken) {
  const authHeaders = await getAuthHeaders(getToken);
  const response = await fetch(`/api/resources?id=${encodeURIComponent(resourceId)}`, {
    method: 'DELETE',
    headers: authHeaders,
  });

  return parseResponse(response);
}
