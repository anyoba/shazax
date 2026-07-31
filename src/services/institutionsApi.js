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
  let body = {};

  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    const text = await response.text();
    body = text ? { error: text } : {};
  }

  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}.`);
  }

  return body;
}

function buildInstitutionUrl(id = '', params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const path = id
    ? `/api/academic/institutions/${encodeURIComponent(id)}`
    : '/api/academic/institutions';
  const queryString = query.toString();

  return queryString ? `${path}?${queryString}` : path;
}

export async function listInstitutions({ admin = false, status = 'all', getToken } = {}) {
  const headers = admin ? await getAuthHeaders(getToken) : {};
  const response = await fetch(buildInstitutionUrl('', { admin, status }), {
    headers,
  });
  const body = await parseResponse(response);
  return body.institutions || [];
}

export async function getInstitution(id, { admin = false, getToken } = {}) {
  const headers = admin ? await getAuthHeaders(getToken) : {};
  const response = await fetch(buildInstitutionUrl(id, { admin }), {
    headers,
  });
  const body = await parseResponse(response);
  return body.institution;
}

export async function createInstitution(payload, getToken) {
  const authHeaders = await getAuthHeaders(getToken);
  const response = await fetch('/api/academic/institutions', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await parseResponse(response);
  return body.institution;
}

export async function updateInstitution(id, payload, getToken) {
  const authHeaders = await getAuthHeaders(getToken);
  const response = await fetch(buildInstitutionUrl(id), {
    method: 'PATCH',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await parseResponse(response);
  return body.institution;
}

export async function archiveInstitution(id, getToken) {
  const authHeaders = await getAuthHeaders(getToken);
  const response = await fetch(buildInstitutionUrl(id), {
    method: 'DELETE',
    headers: authHeaders,
  });
  const body = await parseResponse(response);
  return body.institution;
}

export async function restoreInstitution(id, getToken) {
  return updateInstitution(id, { status: 'draft' }, getToken);
}
