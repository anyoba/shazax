import { USER_ROLES } from '../../src/constants/roles.js';
import { HttpError, requireRole, sendError, sendJson } from '../_lib/auth.js';
import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js';
import { readJsonBody, setMethodHeader } from '../_lib/request.js';
import { validateResourcePayload } from '../_lib/resourcesValidation.js';

const WRITE_ROLES = [USER_ROLES.EDITOR, USER_ROLES.ADMIN, USER_ROLES.OWNER];
const DELETE_ROLES = [USER_ROLES.ADMIN, USER_ROLES.OWNER];

function getResourceId(req) {
  const id = req.query?.id;
  const resourceId = Array.isArray(id) ? id[0] : id;

  if (!resourceId || typeof resourceId !== 'string' || resourceId.length > 160) {
    throw new HttpError(400, 'Resource id is invalid.');
  }

  return resourceId;
}

async function updateResource(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const resourceId = getResourceId(req);
  const payload = validateResourcePayload(await readJsonBody(req), { partial: true });
  const resourceRef = getAdminDb().collection('resources').doc(resourceId);
  const snapshot = await resourceRef.get();

  if (!snapshot.exists) {
    throw new HttpError(404, 'Resource not found.');
  }

  await resourceRef.update({
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.userId,
  });

  sendJson(res, 200, {
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
  const snapshot = await resourceRef.get();

  if (!snapshot.exists) {
    throw new HttpError(404, 'Resource not found.');
  }

  await resourceRef.delete();

  sendJson(res, 200, {
    success: true,
    id: resourceId,
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'PATCH') {
      await updateResource(req, res);
      return;
    }

    if (req.method === 'DELETE') {
      await deleteResource(req, res);
      return;
    }

    setMethodHeader(res, ['PATCH', 'DELETE']);
    throw new HttpError(405, 'Method not allowed.');
  } catch (error) {
    sendError(res, error);
  }
}
