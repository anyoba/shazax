async function getAuthHeaders(getToken) {
  if (typeof getToken !== 'function') {
    throw new Error('Authentication is required.');
  }

  const token = await getToken();
  if (!token) {
    throw new Error('Authentication is required.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}.`);
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
  const response = await fetch(`/api/resources/${encodeURIComponent(resourceId)}`, {
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
  const response = await fetch(`/api/resources/${encodeURIComponent(resourceId)}`, {
    method: 'DELETE',
    headers: authHeaders,
  });

  return parseResponse(response);
}
