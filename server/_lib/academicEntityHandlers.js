import { randomUUID } from 'node:crypto';
import {
  ACADEMIC_ADMIN_READ_ROLES,
  ACADEMIC_CONTENT_WRITE_ROLES,
  ACADEMIC_PUBLISH_ROLES,
  ACADEMIC_STATUSES,
  ACADEMIC_STATUS_VALUES,
} from './serverConstants.js';
import { getAdminDb, FieldValue } from './firebaseAdmin.js';
import {
  createFirestoreHttpError,
  HttpError,
  requireRole,
  sendError,
  sendJson,
} from './auth.js';
import { readJsonBody, setMethodHeader } from './request.js';
import {
  getAcademicEntityConfig,
  validateAcademicEntityPayload,
} from './academicEntityValidation.js';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const PARENT_COLLECTIONS = {
  institutionId: 'institutions',
  programId: 'programs',
  programYearId: 'program_years',
  semesterId: 'semesters',
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

function serializeDoc(doc, { admin = false } = {}) {
  const data = doc.data() || {};
  const item = {
    id: doc.id,
    name: data.name || '',
    shortName: data.shortName || '',
    slug: data.slug || '',
    status: data.status || ACADEMIC_STATUSES.DRAFT,
    order: Number.isFinite(data.order) ? data.order : 9999,
    description: data.description || '',
    institutionId: data.institutionId || '',
    programId: data.programId || '',
    programYearId: data.programYearId || '',
    semesterId: data.semesterId || '',
    yearNumber: Number.isFinite(data.yearNumber) ? data.yearNumber : null,
    semesterNumber: Number.isFinite(data.semesterNumber) ? data.semesterNumber : null,
    iconKey: data.iconKey || '',
    themeKey: data.themeKey || '',
  };

  if (!admin) return item;

  return {
    ...item,
    isDeleted: data.isDeleted === true,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    createdBy: data.createdBy || '',
    updatedBy: data.updatedBy || '',
  };
}

function sortItems(first, second) {
  if (first.order !== second.order) return first.order - second.order;
  return String(first.name || '').localeCompare(String(second.name || ''), 'fr');
}

function removeUndefinedFields(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

async function assertParentExists(db, parentField, parentId) {
  const collectionName = PARENT_COLLECTIONS[parentField];
  if (!collectionName || !parentId) return;

  let snapshot;
  try {
    snapshot = await db.collection(collectionName).doc(parentId).get();
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to verify ${parentField}.`);
  }

  if (!snapshot.exists || snapshot.data()?.isDeleted === true) {
    throw new HttpError(400, `${parentField} does not exist.`, 'ACADEMIC_PARENT_NOT_FOUND');
  }
}

async function assertParentsExist(db, payload, config) {
  for (const parentField of config.parentFields) {
    if (payload[parentField] !== undefined) {
      await assertParentExists(db, parentField, payload[parentField]);
    }
  }
}

function getParentFilters(req, config) {
  return config.parentFields.reduce((filters, field) => {
    const value = getQueryValue(req.query?.[field]);
    if (value) filters[field] = value;
    return filters;
  }, {});
}

function getScopeFilters(payload, config, fallback = {}) {
  return config.parentFields.reduce((filters, field) => {
    const value = payload[field] || fallback[field];
    if (value) filters[field] = value;
    return filters;
  }, {});
}

async function assertSlugAvailable(db, config, slug, scopeFilters, excludeId = null) {
  if (!slug) return;

  const query = db.collection(config.collection).where('slug', '==', slug).limit(50);

  let snapshot;
  try {
    snapshot = await query.get();
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to verify ${config.label} slug.`);
  }

  const duplicate = snapshot.docs.find((doc) => {
    if (doc.id === excludeId || doc.data()?.isDeleted === true) return false;
    const data = doc.data() || {};
    return Object.entries(scopeFilters).every(([field, value]) => data[field] === value);
  });
  if (duplicate) {
    throw new HttpError(409, `A ${config.label} with this slug already exists in this scope.`, 'ACADEMIC_SLUG_DUPLICATE');
  }
}

export async function handleAcademicEntityList(req, res, entityType) {
  const config = getAcademicEntityConfig(entityType);
  const includeAdminData = getQueryValue(req.query?.admin) === 'true';
  const limit = parseLimit(req.query?.limit);
  const db = getAdminDb();
  const parentFilters = getParentFilters(req, config);
  let isAdminRequest = false;

  if (includeAdminData) {
    await requireRole(req, ACADEMIC_ADMIN_READ_ROLES);
    isAdminRequest = true;
  }

  const parentEntries = Object.entries(parentFilters);
  let query = db.collection(config.collection);

  if (parentEntries.length > 0) {
    const [field, value] = parentEntries[0];
    query = query.where(field, '==', value);
  }

  const status = getQueryValue(req.query?.status);
  if (status && status !== 'all' && !ACADEMIC_STATUS_VALUES.includes(status)) {
    throw new HttpError(400, 'status filter is invalid.', 'ACADEMIC_STATUS_INVALID');
  }

  query = query.limit(limit);

  let snapshot;
  try {
    snapshot = await query.get();
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to load ${config.collection}.`);
  }

  const items = snapshot.docs
    .filter((doc) => {
      const data = doc.data() || {};
      if (data.isDeleted === true) return false;
      if (!isAdminRequest && data.status !== ACADEMIC_STATUSES.PUBLISHED) return false;
      if (isAdminRequest && status && status !== 'all' && data.status !== status) return false;
      return parentEntries.every(([field, value]) => data[field] === value);
    })
    .map((doc) => serializeDoc(doc, { admin: isAdminRequest }))
    .sort(sortItems);

  sendJson(res, 200, { items });
}

export async function handleAcademicEntityCreate(req, res, entityType) {
  const config = getAcademicEntityConfig(entityType);
  const user = await requireRole(req, ACADEMIC_CONTENT_WRITE_ROLES);
  const body = await readJsonBody(req);
  const payload = validateAcademicEntityPayload(entityType, body);

  if (
    [ACADEMIC_STATUSES.PUBLISHED, ACADEMIC_STATUSES.ARCHIVED].includes(payload.status) &&
    !ACADEMIC_PUBLISH_ROLES.includes(user.role)
  ) {
    throw new HttpError(403, 'Only admin and owner roles can publish or archive academic content.', 'ACADEMIC_STATUS_FORBIDDEN');
  }

  const db = getAdminDb();
  await assertParentsExist(db, payload, config);
  await assertSlugAvailable(db, config, payload.slug, getScopeFilters(payload, config));

  const now = FieldValue.serverTimestamp();
  const docRef = db.collection(config.collection).doc();
  const data = removeUndefinedFields({
    ...payload,
    status: payload.status || ACADEMIC_STATUSES.DRAFT,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    createdBy: user.userId,
    updatedBy: user.userId,
  });

  try {
    await docRef.set(data);
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to create ${config.label}.`);
  }

  sendJson(res, 201, {
    success: true,
    item: {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
}

async function getExistingDoc(db, config, id) {
  let docSnapshot;
  try {
    docSnapshot = await db.collection(config.collection).doc(id).get();
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to load ${config.label}.`);
  }

  if (!docSnapshot.exists || docSnapshot.data()?.isDeleted === true) {
    throw new HttpError(404, `${config.label} not found.`, 'ACADEMIC_ENTITY_NOT_FOUND');
  }

  return docSnapshot;
}

export async function handleAcademicEntityGetOne(req, res, entityType, id) {
  const config = getAcademicEntityConfig(entityType);
  const db = getAdminDb();
  const includeAdminData = getQueryValue(req.query?.admin) === 'true';
  const docSnapshot = await getExistingDoc(db, config, id);
  const data = docSnapshot.data() || {};

  if (data.status !== ACADEMIC_STATUSES.PUBLISHED && !includeAdminData) {
    throw new HttpError(404, `${config.label} not found.`, 'ACADEMIC_ENTITY_NOT_FOUND');
  }

  if (includeAdminData) {
    await requireRole(req, ACADEMIC_ADMIN_READ_ROLES);
  }

  sendJson(res, 200, { item: serializeDoc(docSnapshot, { admin: includeAdminData }) });
}

export async function handleAcademicEntityPatch(req, res, entityType, id) {
  const config = getAcademicEntityConfig(entityType);
  const user = await requireRole(req, ACADEMIC_CONTENT_WRITE_ROLES);
  const db = getAdminDb();
  const docSnapshot = await getExistingDoc(db, config, id);
  const existing = docSnapshot.data() || {};
  const body = await readJsonBody(req);
  const payload = validateAcademicEntityPayload(entityType, body, { partial: true });

  if (
    payload.status &&
    payload.status !== existing.status &&
    [ACADEMIC_STATUSES.PUBLISHED, ACADEMIC_STATUSES.ARCHIVED].includes(payload.status) &&
    !ACADEMIC_PUBLISH_ROLES.includes(user.role)
  ) {
    throw new HttpError(403, 'Only admin and owner roles can publish or archive academic content.', 'ACADEMIC_STATUS_FORBIDDEN');
  }

  if (payload.status === ACADEMIC_STATUSES.DRAFT && existing.status === ACADEMIC_STATUSES.ARCHIVED) {
    if (!ACADEMIC_PUBLISH_ROLES.includes(user.role)) {
      throw new HttpError(403, 'Only admin and owner roles can restore academic content.', 'ACADEMIC_RESTORE_FORBIDDEN');
    }
  }

  await assertParentsExist(db, payload, config);

  if (payload.slug) {
    const scopeFilters = getScopeFilters(payload, config, existing);
    await assertSlugAvailable(db, config, payload.slug, scopeFilters, id);
  }

  const restoreFields =
    payload.status === ACADEMIC_STATUSES.DRAFT && existing.status === ACADEMIC_STATUSES.ARCHIVED
      ? {
          deletedAt: FieldValue.delete(),
          deletedBy: FieldValue.delete(),
        }
      : {};

  const updateData = removeUndefinedFields({
    ...payload,
    ...restoreFields,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.userId,
  });

  try {
    await db.collection(config.collection).doc(id).update(updateData);
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to update ${config.label}.`);
  }

  const updatedSnapshot = await getExistingDoc(db, config, id);
  sendJson(res, 200, {
    success: true,
    item: serializeDoc(updatedSnapshot, { admin: true }),
  });
}

export async function handleAcademicEntityArchive(req, res, entityType, id) {
  const config = getAcademicEntityConfig(entityType);
  const user = await requireRole(req, ACADEMIC_PUBLISH_ROLES);
  const db = getAdminDb();
  const docSnapshot = await getExistingDoc(db, config, id);
  const current = docSnapshot.data() || {};

  try {
    await db.collection(config.collection).doc(id).update({
      status: ACADEMIC_STATUSES.ARCHIVED,
      previousStatus:
        current.status && current.status !== ACADEMIC_STATUSES.ARCHIVED
          ? current.status
          : current.previousStatus || ACADEMIC_STATUSES.DRAFT,
      isDeleted: false,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: user.userId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.userId,
    });
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to archive ${config.label}.`);
  }

  const updatedSnapshot = await getExistingDoc(db, config, id);
  sendJson(res, 200, {
    success: true,
    item: serializeDoc(updatedSnapshot, { admin: true }),
  });
}

export function createAcademicCollectionHandler(entityType) {
  return async function handler(req, res) {
    setMethodHeader(res, ['GET', 'POST']);
    const requestId = getRequestId(req);

    try {
      if (req.method === 'GET') return await handleAcademicEntityList(req, res, entityType);
      if (req.method === 'POST') return await handleAcademicEntityCreate(req, res, entityType);
      throw new HttpError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    } catch (error) {
      console.error('[ACADEMIC_ENTITY_COLLECTION_FAILED]', {
        requestId,
        entityType,
        method: req.method,
        name: error?.name,
        code: error?.code,
        message: error?.message,
      });
      return sendError(res, error, { requestId, stage: `ACADEMIC_${entityType.toUpperCase()}_${req.method}` });
    }
  };
}

export function createAcademicItemHandler(entityType) {
  return async function handler(req, res) {
    setMethodHeader(res, ['GET', 'PATCH', 'DELETE']);
    const requestId = getRequestId(req);
    const id = getQueryValue(req.query?.id);

    try {
      if (!id) throw new HttpError(400, 'id is required.', 'ACADEMIC_ID_REQUIRED');
      if (req.method === 'GET') return await handleAcademicEntityGetOne(req, res, entityType, id);
      if (req.method === 'PATCH') return await handleAcademicEntityPatch(req, res, entityType, id);
      if (req.method === 'DELETE') return await handleAcademicEntityArchive(req, res, entityType, id);
      throw new HttpError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    } catch (error) {
      console.error('[ACADEMIC_ENTITY_ITEM_FAILED]', {
        requestId,
        entityType,
        id,
        method: req.method,
        name: error?.name,
        code: error?.code,
        message: error?.message,
      });
      return sendError(res, error, { requestId, stage: `ACADEMIC_${entityType.toUpperCase()}_${req.method}` });
    }
  };
}
