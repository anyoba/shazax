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

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) return cookies;

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (!key) return cookies;

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }

    return cookies;
  }, {});
}

function getCookieToken(req) {
  const cookies = parseCookies(req.headers.cookie || req.headers.Cookie || '');
  return cookies.__session || null;
}

function getRequestToken(req) {
  return getBearerToken(req) || getCookieToken(req);
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
  const token = getRequestToken(req);
  if (!token) {
    console.error('[CLERK_AUTH_FAILED]', {
      name: 'MissingSession',
      message: 'No Clerk session token found in Authorization header or cookie.',
    });
    throw new HttpError(401, 'Authentication required.');
  }

  if (!process.env.CLERK_SECRET_KEY) {
    console.error('[CLERK_AUTH_FAILED]', {
      name: 'MissingClerkSecret',
      message: 'Clerk server configuration is missing.',
    });
    throw new HttpError(500, 'Clerk server configuration is missing.');
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      console.error('[CLERK_AUTH_FAILED]', {
        name: 'MissingSubject',
        message: 'Clerk token does not contain a user subject.',
      });
      throw new HttpError(401, 'Invalid authentication token.');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid || null,
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('[CLERK_AUTH_FAILED]', {
      name: error?.name,
      message: error?.message,
    });
    throw new HttpError(401, 'Invalid authentication token.');
  }
}

export async function requireRole(req, allowedRoles) {
  const user = await requireAuthenticatedUser(req);
  let roleSnapshot;

  try {
    roleSnapshot = await getAdminDb().collection('user_roles').doc(user.userId).get();
  } catch (error) {
    console.error('[ROLE_LOOKUP_FAILED]', {
      userId: user.userId,
      name: error?.name,
      message: error?.message,
    });
    throw new HttpError(500, 'Unable to verify user role.');
  }

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
