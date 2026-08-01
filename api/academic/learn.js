import { randomUUID } from 'node:crypto';
import { getAdminDb } from '../_lib/firebaseAdmin.js';
import { createFirestoreHttpError, HttpError, sendError, sendJson } from '../_lib/auth.js';
import { setMethodHeader } from '../_lib/request.js';
import { ACADEMIC_STATUSES } from '../_lib/serverConstants.js';

const COLLECTION_LIMITS = {
  institutions: 100,
  programs: 200,
  program_years: 300,
  semesters: 600,
  modules: 1000,
};

function getRequestId(req) {
  const headerRequestId = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  const requestId = Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId;

  return requestId || randomUUID();
}

function serializeTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
}

function isPublished(data) {
  return data?.status === ACADEMIC_STATUSES.PUBLISHED && data?.isDeleted !== true;
}

function sortByOrderAndName(first, second) {
  const firstOrder = Number.isFinite(first?.order) ? first.order : Number.MAX_SAFE_INTEGER;
  const secondOrder = Number.isFinite(second?.order) ? second.order : Number.MAX_SAFE_INTEGER;
  if (firstOrder !== secondOrder) return firstOrder - secondOrder;

  return String(first?.name || '').localeCompare(String(second?.name || ''), 'fr');
}

function cleanEntity(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    name: data.name || '',
    shortName: data.shortName || '',
    slug: data.slug || '',
    city: data.city || '',
    type: data.type || '',
    description: data.description || '',
    logoUrl: data.logoUrl || '',
    websiteUrl: data.websiteUrl || '',
    status: data.status || '',
    order: Number.isFinite(data.order) ? data.order : 9999,
    institutionId: data.institutionId || '',
    programId: data.programId || '',
    programYearId: data.programYearId || '',
    semesterId: data.semesterId || '',
    yearNumber: Number.isFinite(data.yearNumber) ? data.yearNumber : null,
    semesterNumber: Number.isFinite(data.semesterNumber) ? data.semesterNumber : null,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

async function readPublishedCollection(db, collectionName) {
  try {
    const snapshot = await db
      .collection(collectionName)
      .where('status', '==', ACADEMIC_STATUSES.PUBLISHED)
      .limit(COLLECTION_LIMITS[collectionName])
      .get();

    return snapshot.docs
      .filter((doc) => isPublished(doc.data()))
      .map(cleanEntity)
      .sort(sortByOrderAndName);
  } catch (error) {
    throw createFirestoreHttpError(error, `Unable to load ${collectionName}.`);
  }
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET']);
  const requestId = getRequestId(req);

  try {
    if (req.method !== 'GET') {
      throw new HttpError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    }

    const db = getAdminDb();
    const [
      institutions,
      programs,
      programYears,
      semesters,
      modules,
    ] = await Promise.all([
      readPublishedCollection(db, 'institutions'),
      readPublishedCollection(db, 'programs'),
      readPublishedCollection(db, 'program_years'),
      readPublishedCollection(db, 'semesters'),
      readPublishedCollection(db, 'modules'),
    ]);

    const institutionIds = new Set(institutions.map((institution) => institution.id));
    const filteredPrograms = programs.filter((program) => institutionIds.has(program.institutionId));
    const programIds = new Set(filteredPrograms.map((program) => program.id));
    const filteredProgramYears = programYears.filter((programYear) => programIds.has(programYear.programId));
    const programYearIds = new Set(filteredProgramYears.map((programYear) => programYear.id));
    const filteredSemesters = semesters.filter((semester) => programYearIds.has(semester.programYearId));
    const semesterIds = new Set(filteredSemesters.map((semester) => semester.id));
    const filteredModules = modules.filter((moduleItem) => semesterIds.has(moduleItem.semesterId));

    sendJson(res, 200, {
      success: true,
      institutions,
      programs: filteredPrograms,
      programYears: filteredProgramYears,
      semesters: filteredSemesters,
      modules: filteredModules,
    });
  } catch (error) {
    console.error('[ACADEMIC_LEARN_GET_FAILED]', {
      requestId,
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });
    sendError(res, error, { requestId, stage: 'ACADEMIC_LEARN_GET' });
  }
}
