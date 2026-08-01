import {
  randomUUID,
} from 'node:crypto';
import {
  ACADEMIC_ADMIN_READ_ROLES,
  ACADEMIC_CONTENT_WRITE_ROLES,
  ACADEMIC_PUBLISH_ROLES,
  ACADEMIC_STATUSES,
  ACADEMIC_STATUS_VALUES,
} from '../../_lib/serverConstants.js';
import { getAdminDb, FieldValue } from '../../_lib/firebaseAdmin.js';
import {
  createFirestoreHttpError,
  HttpError,
  requireRole,
  sendError,
  sendJson,
} from '../../_lib/auth.js';
import { readJsonBody, setMethodHeader } from '../../_lib/request.js';
import {
  normalizeComparable,
  validateInstitutionPayload,
} from '../../_lib/institutionsValidation.js';

const COLLECTION = 'institutions';
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;
const CREATE_STAGES = {
  AUTH: 'AUTH',
  ROLE_LOOKUP: 'ROLE_LOOKUP',
  BODY_PARSE: 'BODY_PARSE',
  VALIDATION: 'VALIDATION',
  SLUG_CHECK: 'SLUG_CHECK',
  FIRESTORE_WRITE: 'FIRESTORE_WRITE',
};
const GET_STAGES = {
  AUTH: 'GET_AUTH',
  FIRESTORE_READ: 'GET_FIRESTORE_READ',
};

function getRequestId(req) {
  const headerRequestId = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  const requestId = Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId;

  return requestId || randomUUID();
}

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseLimit(value) {
  const parsed = Number(getQueryValue(value) || DEFAULT_LIMIT);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function serializeTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
}

function serializeInstitution(doc, { admin = false } = {}) {
  const data = doc.data() || {};
  const base = {
    id: doc.id,
    name: data.name || '',
    shortName: data.shortName || '',
    slug: data.slug || '',
    city: data.city || '',
    type: data.type || '',
    status: data.status || ACADEMIC_STATUSES.DRAFT,
    order: Number.isFinite(data.order) ? data.order : 9999,
    description: data.description || '',
    logoUrl: data.logoUrl || '',
    websiteUrl: data.websiteUrl || '',
  };

  if (!admin) return base;

  return {
    ...base,
    isDeleted: data.isDeleted === true,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    createdBy: data.createdBy || '',
    updatedBy: data.updatedBy || '',
  };
}

function sortInstitutions(first, second) {
  if (first.order !== second.order) return first.order - second.order;
  return first.name.localeCompare(second.name);
}

async function assertSlugAvailable(db, slug, excludeId = null) {
  if (!slug) return;

  let snapshot;
  try {
    snapshot = await db.collection(COLLECTION).where('slug', '==', slug).limit(2).get();
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to verify institution slug availability.');
  }

  const duplicate = snapshot.docs.find((doc) => doc.id !== excludeId);

  if (duplicate) {
    throw new HttpError(409, 'An institution with this slug already exists.', 'INSTITUTION_SLUG_DUPLICATE');
  }
}

async function assertNameCityAvailable(db, name, city, excludeId = null) {
  if (!name || !city) return;

  let snapshot;
  try {
    snapshot = await db.collection(COLLECTION).where('city', '==', city).limit(25).get();
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to verify institution name availability.');
  }

  const targetName = normalizeComparable(name);
  const targetCity = normalizeComparable(city);
  const duplicate = snapshot.docs.find((doc) => {
    if (doc.id === excludeId) return false;
    const data = doc.data() || {};
    return (
      data.isDeleted !== true &&
      normalizeComparable(data.name) === targetName &&
      normalizeComparable(data.city) === targetCity
    );
  });

  if (duplicate) {
    throw new HttpError(409, 'An institution with this name already exists in this city.', 'INSTITUTION_NAME_CITY_DUPLICATE');
  }
}

function removeUndefinedFields(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

async function handleGet(req, res, setStage) {
  const includeAdminData = getQueryValue(req.query?.admin) === 'true';
  const limit = parseLimit(req.query?.limit);
  const db = getAdminDb();
  let isAdminRequest = false;

  if (includeAdminData) {
    await requireRole(req, ACADEMIC_ADMIN_READ_ROLES, { onStage: setStage });
    isAdminRequest = true;
  }

  let institutionsQuery = db.collection(COLLECTION).limit(limit);

  if (!isAdminRequest) {
    institutionsQuery = db
      .collection(COLLECTION)
      .where('status', '==', ACADEMIC_STATUSES.PUBLISHED)
      .limit(limit);
  } else {
    const status = getQueryValue(req.query?.status);
    if (status && status !== 'all') {
      if (!ACADEMIC_STATUS_VALUES.includes(status)) {
        throw new HttpError(400, 'status filter is invalid.');
      }

      institutionsQuery = db
        .collection(COLLECTION)
        .where('status', '==', status)
        .limit(limit);
    }
  }

  let snapshot;
  try {
    setStage(GET_STAGES.FIRESTORE_READ);
    snapshot = await institutionsQuery.get();
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to load institutions.');
  }

  const institutions = snapshot.docs
    .filter((doc) => doc.data()?.isDeleted !== true)
    .map((doc) => serializeInstitution(doc, { admin: isAdminRequest }))
    .sort(sortInstitutions);

  sendJson(res, 200, { institutions });
}

async function handlePost(req, res, setStage) {
  const user = await requireRole(req, ACADEMIC_CONTENT_WRITE_ROLES, { onStage: setStage });

  setStage(CREATE_STAGES.BODY_PARSE);
  const body = await readJsonBody(req);

  setStage(CREATE_STAGES.VALIDATION);
  const payload = validateInstitutionPayload(body);

  if (
    [ACADEMIC_STATUSES.PUBLISHED, ACADEMIC_STATUSES.ARCHIVED].includes(payload.status) &&
    !ACADEMIC_PUBLISH_ROLES.includes(user.role)
  ) {
    throw new HttpError(403, 'Only admin and owner roles can publish or archive institutions.', 'INSTITUTION_STATUS_FORBIDDEN');
  }

  setStage(CREATE_STAGES.SLUG_CHECK);
  const db = getAdminDb();
  await assertSlugAvailable(db, payload.slug);
  await assertNameCityAvailable(db, payload.name, payload.city);

  const now = FieldValue.serverTimestamp();
  const status = payload.status || ACADEMIC_STATUSES.DRAFT;
  const docRef = db.collection(COLLECTION).doc();
  const institution = removeUndefinedFields({
    name: payload.name,
    shortName: payload.shortName,
    slug: payload.slug,
    city: payload.city,
    type: payload.type,
    status,
    order: Number(payload.order),
    description: payload.description || '',
    logoUrl: payload.logoUrl || '',
    websiteUrl: payload.websiteUrl || '',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    createdBy: user.userId,
    updatedBy: user.userId,
  });

  try {
    setStage(CREATE_STAGES.FIRESTORE_WRITE);
    await docRef.set(institution);
  } catch (error) {
    throw createFirestoreHttpError(error, 'Unable to create institution in Firestore.');
  }

  sendJson(res, 201, {
    success: true,
    institution: {
      id: docRef.id,
      name: institution.name,
      shortName: institution.shortName,
      slug: institution.slug,
      city: institution.city,
      type: institution.type,
      status: institution.status,
      order: institution.order,
      description: institution.description,
      logoUrl: institution.logoUrl,
      websiteUrl: institution.websiteUrl,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.userId,
      updatedBy: user.userId,
    },
  });
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET', 'POST']);
  const requestId = getRequestId(req);
  let stage = req.method === 'POST' ? CREATE_STAGES.AUTH : GET_STAGES.FIRESTORE_READ;
  const setStage = (nextStage) => {
    stage = nextStage;
  };

  try {
    if (req.method === 'GET') return await handleGet(req, res, setStage);
    if (req.method === 'POST') return await handlePost(req, res, setStage);

    throw new HttpError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
  } catch (error) {
    if (req.method === 'GET') {
      console.error('[INSTITUTIONS_GET_FAILED]', {
        requestId,
        stage,
        name: error?.name,
        code: error?.code,
        message: error?.message,
      });
    }

    if (req.method === 'POST') {
      console.error('[INSTITUTION_CREATE_FAILED]', {
        requestId,
        stage,
        name: error?.name,
        code: error?.code,
        message: error?.message,
      });
    }

    return sendError(res, error, { requestId, stage });
  }
}
