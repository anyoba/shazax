import { getAdminDb } from './firebaseAdmin.js';
import { createFirestoreHttpError, sendJson } from './auth.js';
import { ACADEMIC_STATUSES } from './serverConstants.js';

const COLLECTION_LIMITS = {
  institutions: 100,
  programs: 200,
  program_years: 300,
  semesters: 600,
  modules: 1000,
};

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
    iconKey: data.iconKey || '',
    themeKey: data.themeKey || '',
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

export async function getAcademicLearnTree(req, res) {
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
}
