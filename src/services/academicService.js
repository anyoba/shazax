import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import {
  ACADEMIC_COLLECTIONS,
  ACADEMIC_READ_LIMIT,
  ACADEMIC_STATUSES,
} from '../constants/academic';
import { db } from '../firebase';
import { sortByOrder } from '../utils/academicValidation';
import { getFirestoreErrorMessage } from '../utils/firebaseErrors';

export class AcademicServiceError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AcademicServiceError';
    this.cause = cause;
  }
}

function serializeDoc(docSnapshot) {
  return {
    id: docSnapshot.id,
    ...docSnapshot.data(),
  };
}

function withoutDeleted(items) {
  return items.filter((item) => item.isDeleted !== true);
}

async function readAcademicCollection(collectionName, constraints, label) {
  try {
    // Firestore indexes may be required for queries combining parentId/status with order.
    // See docs/ACADEMIC_ARCHITECTURE.md for the expected composite indexes.
    const snapshot = await getDocs(
      query(
        collection(db, collectionName),
        ...constraints,
        where('status', '==', ACADEMIC_STATUSES.PUBLISHED),
        orderBy('order', 'asc'),
        limit(ACADEMIC_READ_LIMIT),
      ),
    );

    return sortByOrder(withoutDeleted(snapshot.docs.map(serializeDoc)));
  } catch (error) {
    throw new AcademicServiceError(getFirestoreErrorMessage(error, `Unable to load ${label}.`), error);
  }
}

export function getInstitutions() {
  return readAcademicCollection(ACADEMIC_COLLECTIONS.INSTITUTIONS, [], 'institutions');
}

export function getPrograms(institutionId) {
  if (!institutionId) return Promise.resolve([]);

  return readAcademicCollection(
    ACADEMIC_COLLECTIONS.PROGRAMS,
    [where('institutionId', '==', institutionId)],
    'programs',
  );
}

export function getProgramYears(programId) {
  if (!programId) return Promise.resolve([]);

  return readAcademicCollection(
    ACADEMIC_COLLECTIONS.PROGRAM_YEARS,
    [where('programId', '==', programId)],
    'program years',
  );
}

export function getSemesters(programYearId) {
  if (!programYearId) return Promise.resolve([]);

  return readAcademicCollection(
    ACADEMIC_COLLECTIONS.SEMESTERS,
    [where('programYearId', '==', programYearId)],
    'semesters',
  );
}

export function getAcademicModules(semesterId) {
  if (!semesterId) return Promise.resolve([]);

  return readAcademicCollection(
    ACADEMIC_COLLECTIONS.MODULES,
    [where('semesterId', '==', semesterId)],
    'modules',
  );
}
