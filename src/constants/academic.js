import { USER_ROLES } from './roles.js';

export const ACADEMIC_STATUSES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

export const ACADEMIC_STATUS_VALUES = Object.values(ACADEMIC_STATUSES);

export const INSTITUTION_TYPES = {
  FACULTY: 'faculty',
  ENGINEERING_SCHOOL: 'engineering_school',
  BUSINESS_SCHOOL: 'business_school',
  MEDICAL_SCHOOL: 'medical_school',
  UNIVERSITY: 'university',
  INSTITUTE: 'institute',
  OTHER: 'other',
};

export const INSTITUTION_TYPE_VALUES = Object.values(INSTITUTION_TYPES);

export const RESOURCE_CATEGORIES = [
  {
    id: 'course',
    label: 'Cours',
    disabled: false,
  },
  {
    id: 'td',
    label: 'TD',
    disabled: false,
  },
  {
    id: 'tp',
    label: 'TP',
    disabled: false,
  },
  {
    id: 'exam',
    label: 'Examens',
    disabled: false,
  },
  {
    id: 'qcm',
    label: 'QCM',
    disabled: true,
    badge: 'Coming soon',
  },
  {
    id: 'uncategorized',
    label: 'Non classé',
    disabled: false,
    adminOnly: true,
  },
];

export const RESOURCE_CATEGORY_VALUES = RESOURCE_CATEGORIES.map((category) => category.id);

export const ACADEMIC_COLLECTIONS = {
  INSTITUTIONS: 'institutions',
  PROGRAMS: 'programs',
  PROGRAM_YEARS: 'program_years',
  SEMESTERS: 'semesters',
  MODULES: 'modules',
  RESOURCES: 'resources',
};

export const ACADEMIC_READ_LIMIT = 100;

export const ACADEMIC_CONTENT_WRITE_ROLES = [
  USER_ROLES.EDITOR,
  USER_ROLES.ADMIN,
  USER_ROLES.OWNER,
];

export const ACADEMIC_ADMIN_READ_ROLES = [
  USER_ROLES.MODERATOR,
  USER_ROLES.EDITOR,
  USER_ROLES.ADMIN,
  USER_ROLES.OWNER,
];

export const ACADEMIC_PUBLISH_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.OWNER,
];

export function getResourceCategory(categoryId) {
  return RESOURCE_CATEGORIES.find((category) => category.id === categoryId) || null;
}

export function getAcademicStatus(status) {
  return ACADEMIC_STATUS_VALUES.includes(status) ? status : null;
}

export function getInstitutionType(type) {
  return INSTITUTION_TYPE_VALUES.includes(type) ? type : null;
}

export function isResourceCategoryDisabled(categoryId) {
  return Boolean(getResourceCategory(categoryId)?.disabled);
}

export function isAdminOnlyResourceCategory(categoryId) {
  return Boolean(getResourceCategory(categoryId)?.adminOnly);
}

export function isPublishedAcademicItem(item) {
  return item?.status === ACADEMIC_STATUSES.PUBLISHED && item?.isDeleted !== true;
}
