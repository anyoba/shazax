import { verifyToken } from '@clerk/backend';
import { getAdminDb } from './firebaseAdmin.js';
import { USER_ROLE_STATUS, USER_ROLE_VALUES } from './serverConstants.js';

export class HttpError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isFirestoreQuotaError(error) {
  return error?.code === 'resource-exhausted' || error?.code === 8;
}

export function createFirestoreHttpError(error, fallbackMessage = 'Firestore operation failed.') {
  if (isFirestoreQuotaError(error)) {
    return new HttpError(500, 'Firestore quota exceeded.', 'FIRESTORE_QUOTA_EXCEEDED');
  }

  if (error?.code === 'permission-denied' || error?.code === 7) {
    return new HttpError(500, 'Firebase Admin does not have permission for this Firestore operation.', 'FIRESTORE_PERMISSION_DENIED');
  }

  if (error?.code === 'unauthenticated' || error?.code === 16) {
    return new HttpError(500, 'Firebase Admin authentication failed.', 'FIREBASE_ADMIN_AUTH_FAILED');
  }

  if (error?.code === 'not-found' || error?.code === 5) {
    return new HttpError(500, 'Firestore database or document path was not found.', 'FIRESTORE_NOT_FOUND');
  }

  if (error?.code === 'failed-precondition' || error?.code === 9) {
    return new HttpError(500, 'Firestore operation requires an index or a valid database state.', 'FIRESTORE_PRECONDITION_FAILED');
  }

  if (error?.code === 'invalid-argument' || error?.code === 3) {
    return new HttpError(400, 'Firestore rejected invalid data.', 'FIRESTORE_INVALID_ARGUMENT');
  }

  return new HttpError(500, fallbackMessage, 'FIRESTORE_OPERATION_FAILED');
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

export function sendError(res, error, { requestId, stage } = {}) {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof HttpError ? error.message : 'Internal server error.';
  const code =
    error instanceof HttpError && error.code
      ? error.code
      : statusCode === 500
        ? 'INTERNAL_SERVER_ERROR'
        : `HTTP_${statusCode}`;

  sendJson(res, statusCode, {
    success: false,
    error: message,
    code,
    ...(requestId ? { requestId } : {}),
    ...(stage ? { stage } : {}),
  });
}

export async function requireAuthenticatedUser(req) {
  const token = getRequestToken(req);
  if (!token) {
    console.error('[CLERK_AUTH_FAILED]', {
      name: 'MissingSession',
      message: 'No Clerk session token found in Authorization header or cookie.',
    });
    throw new HttpError(401, 'Authentication required.', 'AUTHENTICATION_REQUIRED');
  }

  if (!process.env.CLERK_SECRET_KEY) {
    console.error('[CLERK_AUTH_FAILED]', {
      name: 'MissingClerkSecret',
      message: 'Clerk server configuration is missing.',
    });
    throw new HttpError(500, 'Clerk server configuration is missing.', 'CLERK_CONFIG_MISSING');
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
      throw new HttpError(401, 'Invalid authentication token.', 'INVALID_AUTH_TOKEN');
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
    throw new HttpError(401, 'Invalid authentication token.', 'INVALID_AUTH_TOKEN');
  }
}

export async function requireRole(req, allowedRoles, { onStage } = {}) {
  onStage?.('AUTH');
  const user = await requireAuthenticatedUser(req);
  let roleSnapshot;

  try {
    onStage?.('ROLE_LOOKUP');
    roleSnapshot = await getAdminDb().collection('user_roles').doc(user.userId).get();
  } catch (error) {
    console.error('[ROLE_LOOKUP_FAILED]', {
      userId: user.userId,
      name: error?.name,
      message: error?.message,
    });
    throw createFirestoreHttpError(error, 'Unable to verify user role.');
  }

  if (!roleSnapshot.exists) {
    throw new HttpError(403, 'Access forbidden.', 'ACCESS_FORBIDDEN');
  }

  const roleData = roleSnapshot.data() || {};
  const role = typeof roleData.role === 'string' ? roleData.role : null;
  const status = typeof roleData.status === 'string' ? roleData.status : null;

  if (!USER_ROLE_VALUES.includes(role) || status !== USER_ROLE_STATUS.ACTIVE) {
    throw new HttpError(403, 'Access forbidden.', 'ACCESS_FORBIDDEN');
  }

  if (!allowedRoles.includes(role)) {
    throw new HttpError(403, 'Access forbidden.', 'ACCESS_FORBIDDEN');
  }

  return {
    ...user,
    role,
    status,
  };
}
