import { sortByOrder } from '../utils/academicValidation';
import { fallbackAcademicTree } from '../data/academicFallback';

export class AcademicServiceError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AcademicServiceError';
    this.cause = cause;
  }
}

const ACADEMIC_TREE_STORAGE_KEY = 'shazax_academic_tree_v1';
let academicTreeCache = null;
let academicTreePromise = null;

function normalizeResponsePayload(payload) {
  return {
    institutions: Array.isArray(payload?.institutions) ? payload.institutions : [],
    programs: Array.isArray(payload?.programs) ? payload.programs : [],
    programYears: Array.isArray(payload?.programYears) ? payload.programYears : [],
    semesters: Array.isArray(payload?.semesters) ? payload.semesters : [],
    modules: Array.isArray(payload?.modules) ? payload.modules : [],
  };
}

function readCachedAcademicTree() {
  try {
    const cached = window.localStorage.getItem(ACADEMIC_TREE_STORAGE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const tree = normalizeResponsePayload(parsed);
    return tree.institutions.length > 0 ? tree : null;
  } catch {
    return null;
  }
}

function saveCachedAcademicTree(tree) {
  try {
    window.localStorage.setItem(ACADEMIC_TREE_STORAGE_KEY, JSON.stringify(tree));
  } catch {
    // Ignore localStorage failures.
  }
}

function getFallbackAcademicTree() {
  return readCachedAcademicTree() || fallbackAcademicTree;
}

async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { error: text } : {};
}

async function fetchAcademicTree() {
  const response = await fetch('/api/academic?view=learn');
  const payload = await parseApiResponse(response);

  if (!response.ok || payload?.success === false) {
    const message = payload?.error || `Unable to load academic navigation. HTTP ${response.status}`;
    throw new AcademicServiceError(message);
  }

  const tree = normalizeResponsePayload(payload);
  if (tree.institutions.length > 0) {
    saveCachedAcademicTree(tree);
  }

  return tree;
}

export async function getAcademicTree({ force = false } = {}) {
  if (!force && academicTreeCache) return academicTreeCache;
  if (!force && academicTreePromise) return academicTreePromise;

  academicTreePromise = fetchAcademicTree()
    .then((tree) => {
      academicTreeCache = tree;
      return tree;
    })
    .catch((error) => {
      const fallbackTree = getFallbackAcademicTree();
      academicTreeCache = fallbackTree;
      console.warn('Using cached academic tree because the server tree could not be loaded.', error?.message);
      return fallbackTree;
    })
    .finally(() => {
      academicTreePromise = null;
    });

  return academicTreePromise;
}

export function clearAcademicTreeCache() {
  academicTreeCache = null;
  academicTreePromise = null;
}

export async function getInstitutions() {
  const tree = await getAcademicTree();
  return sortByOrder(tree.institutions);
}

export async function getPrograms(institutionId) {
  if (!institutionId) return [];

  const tree = await getAcademicTree();
  return sortByOrder(tree.programs.filter((program) => program.institutionId === institutionId));
}

export async function getProgramYears(programId) {
  if (!programId) return [];

  const tree = await getAcademicTree();
  return sortByOrder(tree.programYears.filter((programYear) => programYear.programId === programId));
}

export async function getSemesters(programYearId) {
  if (!programYearId) return [];

  const tree = await getAcademicTree();
  return sortByOrder(tree.semesters.filter((semester) => semester.programYearId === programYearId));
}

export async function getAcademicModules(semesterId) {
  if (!semesterId) return [];

  const tree = await getAcademicTree();
  return sortByOrder(tree.modules.filter((moduleItem) => moduleItem.semesterId === semesterId));
}
