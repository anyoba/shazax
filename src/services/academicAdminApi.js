export class AcademicAdminApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', requestId = '', stage = '' } = {}) {
    super(message);
    this.name = 'AcademicAdminApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.stage = stage;
  }
}

const ENTITY_PATHS = {
  programs: 'programs',
  program_years: 'program-years',
  semesters: 'semesters',
  modules: 'modules',
};

async function getAuthHeaders(getToken) {
  if (typeof getToken !== 'function') {
    throw new AcademicAdminApiError('Authentication is required.', {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    });
  }

  const token = await getToken();
  if (!token) {
    throw new AcademicAdminApiError('Authentication is required.', {
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
    throw new AcademicAdminApiError(body.error || `Request failed with status ${response.status}.`, {
      status: response.status,
      code: body.code || `HTTP_${response.status}`,
      requestId: body.requestId || '',
      stage: body.stage || '',
    });
  }

  return body;
}

function entityUrl(entityType, id = '', params = {}) {
  const entityPath = ENTITY_PATHS[entityType];
  if (!entityPath) {
    throw new AcademicAdminApiError(`Unknown academic entity type: ${entityType}.`, {
      code: 'ACADEMIC_ENTITY_TYPE_UNKNOWN',
    });
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });

  query.set('entity', entityPath);
  if (id) query.set('id', id);

  const path = '/api/academic';
  const queryString = query.toString();

  return queryString ? `${path}?${queryString}` : path;
}

export function formatAcademicApiError(error, fallback) {
  const details = [];
  if (error?.status) details.push(`HTTP ${error.status}`);
  if (error?.code) details.push(`code: ${error.code}`);
  if (error?.stage) details.push(`stage: ${error.stage}`);
  if (error?.requestId) details.push(`requestId: ${error.requestId}`);

  const message = error?.message || fallback;
  return details.length > 0 ? `${message} (${details.join(' | ')})` : message;
}

export async function listAcademicItems(entityType, { getToken, status = 'all', filters = {} } = {}) {
  const headers = await getAuthHeaders(getToken);
  const response = await fetch(entityUrl(entityType, '', { admin: true, status, ...filters }), {
    headers,
  });
  const body = await parseResponse(response);
  return body.items || [];
}

export async function createAcademicItem(entityType, payload, getToken) {
  const headers = await getAuthHeaders(getToken);
  const response = await fetch(entityUrl(entityType), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await parseResponse(response);

  if (body?.success !== true || !body?.item?.id) {
    throw new AcademicAdminApiError('Creation was not confirmed by the API.', {
      status: response.status,
      code: body?.code || 'ACADEMIC_CREATE_NOT_CONFIRMED',
      requestId: body?.requestId || '',
      stage: body?.stage || '',
    });
  }

  return body.item;
}

export async function updateAcademicItem(entityType, id, payload, getToken) {
  const headers = await getAuthHeaders(getToken);
  const response = await fetch(entityUrl(entityType, id), {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await parseResponse(response);
  return body.item;
}

export async function archiveAcademicItem(entityType, id, getToken) {
  const headers = await getAuthHeaders(getToken);
  const response = await fetch(entityUrl(entityType, id), {
    method: 'DELETE',
    headers,
  });
  const body = await parseResponse(response);
  return body.item;
}

export async function restoreAcademicItem(entityType, id, getToken) {
  return updateAcademicItem(entityType, id, { status: 'draft' }, getToken);
}
