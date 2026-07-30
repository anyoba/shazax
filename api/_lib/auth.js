import { verifyToken } from '@clerk/backend';
import { getAdminDb } from './firebaseAdmin.js';
import { USER_ROLE_STATUS, USER_ROLE_VALUES } from '../../src/constants/roles.js';

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

export function sendError(res, error) {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = statusCode === 500 ? 'Internal server error.' : error.message;
  sendJson(res, statusCode, { error: message });
}

export async function requireAuthenticatedUser(req) {
  const token = getBearerToken(req);
  if (!token) {
    throw new HttpError(401, 'Authentication required.');
  }

  if (!process.env.CLERK_SECRET_KEY) {
    throw new HttpError(500, 'Clerk server configuration is missing.');
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      throw new HttpError(401, 'Invalid authentication token.');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid || null,
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Invalid authentication token.');
  }
}

export async function requireRole(req, allowedRoles) {
  const user = await requireAuthenticatedUser(req);
  const roleSnapshot = await getAdminDb().collection('user_roles').doc(user.userId).get();

  if (!roleSnapshot.exists) {
    throw new HttpError(403, 'Access forbidden.');
  }

  const roleData = roleSnapshot.data() || {};
  const role = typeof roleData.role === 'string' ? roleData.role : null;
  const status = typeof roleData.status === 'string' ? roleData.status : null;

  if (!USER_ROLE_VALUES.includes(role) || status !== USER_ROLE_STATUS.ACTIVE) {
    throw new HttpError(403, 'Access forbidden.');
  }

  if (!allowedRoles.includes(role)) {
    throw new HttpError(403, 'Access forbidden.');
  }

  return {
    ...user,
    role,
    status,
  };
}
