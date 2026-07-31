import { USER_ROLES } from '../../src/constants/roles.js';
import { HttpError, requireRole, sendError, sendJson } from '../_lib/auth.js';
import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js';
import { readJsonBody, setMethodHeader } from '../_lib/request.js';
import { isPublicResource, validateResourcePayload } from '../_lib/resourcesValidation.js';

const WRITE_ROLES = [USER_ROLES.EDITOR, USER_ROLES.ADMIN, USER_ROLES.OWNER];

function serializeResource(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
  };
}

async function listResources(req, res) {
  const snapshot = await getAdminDb().collection('resources').orderBy('createdAt', 'desc').get();
  const resources = snapshot.docs.map(serializeResource).filter(isPublicResource);

  sendJson(res, 200, { resources });
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

  await resourceRef.set(resource);

  sendJson(res, 201, {
    resource: {
      ...resource,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await listResources(req, res);
      return;
    }

    if (req.method === 'POST') {
      await createResource(req, res);
      return;
    }

    setMethodHeader(res, ['GET', 'POST']);
    throw new HttpError(405, 'Method not allowed.');
  } catch (error) {
    if (req.method === 'POST') {
      console.error('[RESOURCE_CREATE_FAILED]', {
        name: error?.name,
        message: error?.message,
      });
    }
    sendError(res, error);
  }
}
