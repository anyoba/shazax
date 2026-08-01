import { sortByOrder } from '../utils/academicValidation';
import { buildFstFallbackTreeForInstitution, fallbackAcademicTree } from '../data/academicFallback';

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
  const cachedTree = readCachedAcademicTree();
  return cachedTree ? mergeMissingFstStructure(cachedTree) : fallbackAcademicTree;
}

function mergeMissingFstStructure(tree) {
  const fstInstitution = tree.institutions.find((institution) => institution.slug === 'fst-settat');
  if (!fstInstitution) return tree;

  const fstPrograms = tree.programs.filter((program) => program.institutionId === fstInstitution.id);
  const msdProgram =
    fstPrograms.find((program) => program.slug === 'mathematiques-science-donnees') || fstPrograms[0];

  const needsProgramFallback = fstPrograms.length === 0;
  const msdProgramYears = msdProgram
    ? tree.programYears.filter((programYear) => programYear.programId === msdProgram.id)
    : [];
  const needsYearFallback = msdProgramYears.length === 0;
  const msdProgramYearIds = new Set(msdProgramYears.map((programYear) => programYear.id));
  const msdSemesters = tree.semesters.filter((semester) => msdProgramYearIds.has(semester.programYearId));
  const hasS1ToS4 = ['s1', 's2', 's3', 's4'].every((slug) =>
    msdSemesters.some((semester) => semester.slug === slug),
  );
  const s2Semester = msdSemesters.find((semester) => semester.slug === 's2');
  const s2Modules = tree.modules.filter((moduleItem) => moduleItem.semesterId === s2Semester?.id);
  const hasFstS2Modules = ['analyse-2', 'algebre-2', 'mecanique', 'thermodynamique', 'structure-de-la-matiere'].every(
    (slug) => s2Modules.some((moduleItem) => moduleItem.slug === slug),
  );

  if (!needsProgramFallback && !needsYearFallback && hasS1ToS4 && hasFstS2Modules) return tree;

  const fallback = buildFstFallbackTreeForInstitution(fstInstitution);
  const fallbackProgram = msdProgram || fallback.programs[0];
  const fallbackProgramYears = fallback.programYears.map((programYear) => {
    const existingYear = msdProgramYears.find((item) => item.slug === programYear.slug);
    return existingYear || { ...programYear, programId: fallbackProgram.id };
  });
  const fallbackYearBySlug = Object.fromEntries(fallbackProgramYears.map((programYear) => [programYear.slug, programYear]));

  const nextPrograms = [...tree.programs];
  if (!msdProgram) nextPrograms.push(fallbackProgram);

  const nextProgramYears = [...tree.programYears];
  for (const programYear of fallbackProgramYears) {
    if (!nextProgramYears.some((item) => item.id === programYear.id || (item.programId === fallbackProgram.id && item.slug === programYear.slug))) {
      nextProgramYears.push(programYear);
    }
  }

  const nextSemesters = [...tree.semesters];
  for (const semester of fallback.semesters) {
    const yearSlug = semester.semesterNumber <= 2 ? '1ere-annee' : '2eme-annee';
    const programYear = fallbackYearBySlug[yearSlug];
    const nextSemester = {
      ...semester,
      programId: fallbackProgram.id,
      programYearId: programYear.id,
    };

    if (!nextSemesters.some((item) => item.programYearId === nextSemester.programYearId && item.slug === nextSemester.slug)) {
      nextSemesters.push(nextSemester);
    }
  }

  const mergedS2Semester = nextSemesters.find(
    (semester) => semester.programId === fallbackProgram.id && semester.slug === 's2',
  );
  const firstYear = fallbackYearBySlug['1ere-annee'];
  const nextModules = [...tree.modules];

  if (mergedS2Semester && firstYear) {
    for (const moduleItem of fallback.modules) {
      const nextModule = {
        ...moduleItem,
        programId: fallbackProgram.id,
        programYearId: firstYear.id,
        semesterId: mergedS2Semester.id,
      };

      if (!nextModules.some((item) => item.semesterId === nextModule.semesterId && item.slug === nextModule.slug)) {
        nextModules.push(nextModule);
      }
    }
  }

  return normalizeResponsePayload({
    ...tree,
    programs: nextPrograms,
    programYears: nextProgramYears,
    semesters: nextSemesters,
    modules: nextModules,
  });
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

  const tree = mergeMissingFstStructure(normalizeResponsePayload(payload));
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
