import {
  ACADEMIC_ADMIN_READ_ROLES,
  ACADEMIC_CONTENT_WRITE_ROLES,
  ACADEMIC_PUBLISH_ROLES,
  ACADEMIC_STATUSES,
} from '../../_lib/serverConstants.js';
import { getAdminDb, FieldValue } from '../../_lib/firebaseAdmin.js';
import { HttpError, requireRole, sendError, sendJson } from '../../_lib/auth.js';
import { readJsonBody, setMethodHeader } from '../../_lib/request.js';
import {
  normalizeComparable,
  validateInstitutionPayload,
} from '../../_lib/institutionsValidation.js';

const COLLECTION = 'institutions';

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getInstitutionId(req) {
  const id = getQueryValue(req.query?.id);
  if (!id || typeof id !== 'string') {
    throw new HttpError(400, 'institution id is required.');
  }
  return id;
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

async function assertSlugAvailable(db, slug, excludeId) {
  const snapshot = await db.collection(COLLECTION).where('slug', '==', slug).limit(2).get();
  const duplicate = snapshot.docs.find((doc) => doc.id !== excludeId);

  if (duplicate) {
    throw new HttpError(409, 'An institution with this slug already exists.');
  }
}

async function assertNameCityAvailable(db, name, city, excludeId) {
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

function isPublicInstitution(data) {
  return data?.status === ACADEMIC_STATUSES.PUBLISHED && data?.isDeleted !== true;
}

async function handleGet(req, res) {
  const id = getInstitutionId(req);
  const snapshot = await getAdminDb().collection(COLLECTION).doc(id).get();

  if (!snapshot.exists) {
    throw new HttpError(404, 'Institution not found.');
  }

  const data = snapshot.data() || {};
  if (!isPublicInstitution(data)) {
    await requireRole(req, ACADEMIC_ADMIN_READ_ROLES);
    return sendJson(res, 200, {
      institution: serializeInstitution(snapshot, { admin: true }),
    });
  }

  return sendJson(res, 200, {
    institution: serializeInstitution(snapshot, { admin: false }),
  });
}

async function handlePatch(req, res) {
  const id = getInstitutionId(req);
  const user = await requireRole(req, ACADEMIC_CONTENT_WRITE_ROLES);
  const payload = validateInstitutionPayload(await readJsonBody(req), { partial: true });
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(id);
  const currentSnapshot = await docRef.get();

  if (!currentSnapshot.exists || currentSnapshot.data()?.isDeleted === true) {
    throw new HttpError(404, 'Institution not found.');
  }

  const currentData = currentSnapshot.data() || {};
  const nextStatus = payload.status ?? currentData.status;
  const isStatusChange = payload.status !== undefined && payload.status !== currentData.status;
  const isAdminOnlyStatusChange =
    nextStatus === ACADEMIC_STATUSES.PUBLISHED ||
    nextStatus === ACADEMIC_STATUSES.ARCHIVED ||
    currentData.status === ACADEMIC_STATUSES.ARCHIVED;

  if (isStatusChange && isAdminOnlyStatusChange && !ACADEMIC_PUBLISH_ROLES.includes(user.role)) {
    throw new HttpError(403, 'Only admin and owner roles can publish, archive, or restore institutions.');
  }

  if (payload.slug && payload.slug !== currentData.slug) {
    await assertSlugAvailable(db, payload.slug, id);
  }

  const nextName = payload.name ?? currentData.name;
  const nextCity = payload.city ?? currentData.city;
  if (payload.name !== undefined || payload.city !== undefined) {
    await assertNameCityAvailable(db, nextName, nextCity, id);
  }

  await docRef.update({
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.userId,
  });

  const updated = await docRef.get();
  return sendJson(res, 200, {
    institution: serializeInstitution(updated, { admin: true }),
  });
}

async function handleDelete(req, res) {
  const id = getInstitutionId(req);
  const user = await requireRole(req, ACADEMIC_PUBLISH_ROLES);
  const docRef = getAdminDb().collection(COLLECTION).doc(id);
  const currentSnapshot = await docRef.get();

  if (!currentSnapshot.exists || currentSnapshot.data()?.isDeleted === true) {
    throw new HttpError(404, 'Institution not found.');
  }

  await docRef.update({
    status: ACADEMIC_STATUSES.ARCHIVED,
    isDeleted: false,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.userId,
  });

  const updated = await docRef.get();
  return sendJson(res, 200, {
    institution: serializeInstitution(updated, { admin: true }),
  });
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET', 'PATCH', 'DELETE']);

  try {
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'PATCH') return await handlePatch(req, res);
    if (req.method === 'DELETE') return await handleDelete(req, res);

    throw new HttpError(405, 'Method not allowed.');
  } catch (error) {
    return sendError(res, error);
  }
}
