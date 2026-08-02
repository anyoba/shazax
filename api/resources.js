import { randomUUID } from 'node:crypto';
import { USER_ROLES } from '../server/_lib/serverConstants.js';
import {
  createFirestoreHttpError,
  HttpError,
  requireRole,
  sendError,
  sendJson,
} from '../server/_lib/auth.js';
import { FieldValue, getAdminDb } from '../server/_lib/firebaseAdmin.js';
import { readJsonBody, setMethodHeader } from '../server/_lib/request.js';
import { isPublicResource, validateResourcePayload } from '../server/_lib/resourcesValidation.js';

const WRITE_ROLES = [USER_ROLES.EDITOR, USER_ROLES.ADMIN, USER_ROLES.OWNER];
const DELETE_ROLES = [USER_ROLES.ADMIN, USER_ROLES.OWNER];
const DEFAULT_RESOURCE_LIMIT = 200;
const MAX_RESOURCE_LIMIT = 300;

function getRequestId(req) {
  const headerRequestId = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  const requestId = Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId;

  return requestId || randomUUID();
}

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseLimit(value) {
  const parsed = Number(getQueryValue(value) || DEFAULT_RESOURCE_LIMIT);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_RESOURCE_LIMIT;
  return Math.min(parsed, MAX_RESOURCE_LIMIT);
}

function getResourceId(req) {
  const id = getQueryValue(req.query?.id);

  if (!id || typeof id !== 'string' || id.length > 160) {
    throw new HttpError(400, 'Resource id is invalid.', 'RESOURCE_ID_INVALID');
  }

  return id;
}

function serializeResource(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
  };
}

async function listResources(req, res) {
  const id = getQueryValue(req.query?.id);

  if (id) {
    let snapshot;
    try {
      snapshot = await getAdminDb().collection('resources').doc(id).get();
    } catch (error) {
      throw createFirestoreHttpError(error, 'Unable to load resource.');
    }

    if (!snapshot.exists || !isPublicResource(snapshot.data() || {})) {
      throw new HttpError(404, 'Resource not found.', 'RESOURCE_NOT_FOUND');
    }

    return sendJson(res, 200, { resource: serializeResource(snapshot) });
  }

  let snapshot;
  try {
    snapshot = await getAdminDb()
      .collection('resources')
      .orderBy('createdAt', 'desc')
      .limit(parseLimit(req.query?.limit))
      .get();
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to load resources.');
  }

  const resources = snapshot.docs.map(serializeResource).filter(isPublicResource);

  return sendJson(res, 200, { resources });
}

async function createResource(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const payload = validateResourcePayload(await readJsonBody(req));
  const resourceRef = getAdminDb().collection('resources').doc();

  const resource = {
    ...payload,
    id: resourceRef.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: user.userId,
    updatedBy: user.userId,
  };

  try {
    await resourceRef.set(resource);
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to create resource.');
  }

  return sendJson(res, 201, {
    resource: {
      ...resource,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
}

async function updateResource(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const resourceId = getResourceId(req);
  const payload = validateResourcePayload(await readJsonBody(req), { partial: true });
  const resourceRef = getAdminDb().collection('resources').doc(resourceId);
  let snapshot;
  try {
    snapshot = await resourceRef.get();
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to load resource.');
  }

  if (!snapshot.exists) {
    throw new HttpError(404, 'Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  try {
    await resourceRef.update({
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.userId,
    });
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to update resource.');
  }

  return sendJson(res, 200, {
    resource: {
      id: resourceId,
      ...snapshot.data(),
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: user.userId,
    },
  });
}

async function deleteResource(req, res) {
  await requireRole(req, DELETE_ROLES);
  const resourceId = getResourceId(req);
  const resourceRef = getAdminDb().collection('resources').doc(resourceId);
  let snapshot;
  try {
    snapshot = await resourceRef.get();
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to load resource.');
  }

  if (!snapshot.exists) {
    throw new HttpError(404, 'Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  try {
    await resourceRef.delete();
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to delete resource.');
  }

  return sendJson(res, 200, {
    success: true,
    id: resourceId,
  });
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET', 'POST', 'PATCH', 'DELETE']);
  const requestId = getRequestId(req);

  try {
    if (req.method === 'GET') return await listResources(req, res);
    if (req.method === 'POST') return await createResource(req, res);
    if (req.method === 'PATCH') return await updateResource(req, res);
    if (req.method === 'DELETE') return await deleteResource(req, res);

    throw new HttpError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
  } catch (error) {
    if (req.method === 'POST') {
      console.error('[RESOURCE_CREATE_FAILED]', {
        requestId,
        name: error?.name,
        code: error?.code,
        message: error?.message,
      });
    }

    console.error('[RESOURCES_API_FAILED]', {
      requestId,
      method: req.method,
      id: getQueryValue(req.query?.id) || '',
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });
    return sendError(res, error, { requestId, stage: `RESOURCES_${req.method}` });
  }
}
