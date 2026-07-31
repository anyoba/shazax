import {
  ACADEMIC_ADMIN_READ_ROLES,
  ACADEMIC_CONTENT_WRITE_ROLES,
  ACADEMIC_PUBLISH_ROLES,
  ACADEMIC_STATUSES,
  ACADEMIC_STATUS_VALUES,
} from '../../../src/constants/academic.js';
import { getAdminDb, FieldValue } from '../../_lib/firebaseAdmin.js';
import { HttpError, requireRole, sendError, sendJson } from '../../_lib/auth.js';
import { readJsonBody, setMethodHeader } from '../../_lib/request.js';
import {
  normalizeComparable,
  validateInstitutionPayload,
} from '../../_lib/institutionsValidation.js';

const COLLECTION = 'institutions';
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

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
  const snapshot = await db.collection(COLLECTION).where('slug', '==', slug).limit(2).get();
  const duplicate = snapshot.docs.find((doc) => doc.id !== excludeId);

  if (duplicate) {
    throw new HttpError(409, 'An institution with this slug already exists.');
  }
}

async function assertNameCityAvailable(db, name, city, excludeId = null) {
  const snapshot = await db.collection(COLLECTION).where('city', '==', city).limit(25).get();
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
    throw new HttpError(409, 'An institution with this name already exists in this city.');
  }
}

async function handleGet(req, res) {
  const includeAdminData = getQueryValue(req.query?.admin) === 'true';
  const limit = parseLimit(req.query?.limit);
  const db = getAdminDb();
  let isAdminRequest = false;

  if (includeAdminData) {
    await requireRole(req, ACADEMIC_ADMIN_READ_ROLES);
    isAdminRequest = true;
  }

  let institutionsQuery = db
    .collection(COLLECTION)
    .where('isDeleted', '==', false)
    .orderBy('order', 'asc')
    .orderBy('name', 'asc')
    .limit(limit);

  if (!isAdminRequest) {
    institutionsQuery = db
      .collection(COLLECTION)
      .where('status', '==', ACADEMIC_STATUSES.PUBLISHED)
      .where('isDeleted', '==', false)
      .orderBy('order', 'asc')
      .orderBy('name', 'asc')
      .limit(limit);
  } else {
    const status = getQueryValue(req.query?.status);
    if (status && status !== 'all') {
      if (!ACADEMIC_STATUS_VALUES.includes(status)) {
        throw new HttpError(400, 'status filter is invalid.');
      }

      institutionsQuery = db
        .collection(COLLECTION)
        .where('isDeleted', '==', false)
        .where('status', '==', status)
        .orderBy('order', 'asc')
        .orderBy('name', 'asc')
        .limit(limit);
    }
  }

  const snapshot = await institutionsQuery.get();
  const institutions = snapshot.docs
    .map((doc) => serializeInstitution(doc, { admin: isAdminRequest }))
    .sort(sortInstitutions);

  sendJson(res, 200, { institutions });
}

async function handlePost(req, res) {
  const user = await requireRole(req, ACADEMIC_CONTENT_WRITE_ROLES);
  const payload = validateInstitutionPayload(await readJsonBody(req));

  if (
    [ACADEMIC_STATUSES.PUBLISHED, ACADEMIC_STATUSES.ARCHIVED].includes(payload.status) &&
    !ACADEMIC_PUBLISH_ROLES.includes(user.role)
  ) {
    throw new HttpError(403, 'Only admin and owner roles can publish or archive institutions.');
  }

  const db = getAdminDb();
  await assertSlugAvailable(db, payload.slug);
  await assertNameCityAvailable(db, payload.name, payload.city);

  const now = FieldValue.serverTimestamp();
  const docRef = await db.collection(COLLECTION).add({
    ...payload,
    description: payload.description || '',
    logoUrl: payload.logoUrl || '',
    websiteUrl: payload.websiteUrl || '',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    createdBy: user.userId,
    updatedBy: user.userId,
  });

  const created = await docRef.get();
  sendJson(res, 201, { institution: serializeInstitution(created, { admin: true }) });
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET', 'POST']);

  try {
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);

    throw new HttpError(405, 'Method not allowed.');
  } catch (error) {
    return sendError(res, error);
  }
}
