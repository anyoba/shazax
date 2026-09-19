import { randomUUID } from 'node:crypto';
import { USER_ROLES, USER_ROLE_STATUS, USER_ROLE_VALUES } from '../server/_lib/serverConstants.js';
import { HttpError, requireAuthenticatedUser, sendError, sendJson } from '../server/_lib/auth.js';
import { FieldValue, getAdminDb } from '../server/_lib/firebaseAdmin.js';
import { readJsonBody, setMethodHeader } from '../server/_lib/request.js';

function getRequestId(req) {
  const header = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  return (Array.isArray(header) ? header[0] : header) || randomUUID();
}

function q(value) {
  return Array.isArray(value) ? value[0] : value;
}

async function syncUser(req, res) {
  const auth = await requireAuthenticatedUser(req);
  const body = await readJsonBody(req);
  const ref = getAdminDb().collection('users').doc(auth.userId);
  const snapshot = await ref.get();
  const payload = {
    id: auth.userId,
    fullName: String(body.fullName || body.name || body.email || 'Student').trim().slice(0, 180),
    email: String(body.email || '').trim().toLowerCase().slice(0, 220),
    profileImageUrl: String(body.profileImageUrl || '').trim().slice(0, 2000),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!snapshot.exists) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, { merge: true });
  return sendJson(res, 200, { user: { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
}

async function currentRole(req, res) {
  const auth = await requireAuthenticatedUser(req);
  const snapshot = await getAdminDb().collection('user_roles').doc(auth.userId).get();
  if (!snapshot.exists) {
    return sendJson(res, 200, { role: USER_ROLES.STUDENT, status: USER_ROLE_STATUS.ACTIVE });
  }
  const data = snapshot.data() || {};
  const role = USER_ROLE_VALUES.includes(data.role) ? data.role : USER_ROLES.STUDENT;
  const status = data.status === USER_ROLE_STATUS.ACTIVE ? USER_ROLE_STATUS.ACTIVE : data.status || USER_ROLE_STATUS.ACTIVE;
  return sendJson(res, 200, { role, status });
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET', 'POST']);
  const requestId = getRequestId(req);
  const action = String(q(req.query?.action) || 'sync');
  try {
    if (req.method === 'GET' && action === 'role') return await currentRole(req, res);
    if (req.method === 'POST' && action === 'sync') return await syncUser(req, res);
    throw new HttpError(405, 'Method or action not allowed.', 'METHOD_NOT_ALLOWED');
  } catch (error) {
    console.error('[USERS_API_FAILED]', { requestId, action, method: req.method, name: error?.name, code: error?.code, message: error?.message });
    return sendError(res, error, { requestId, stage: `USERS_${action}` });
  }
}
