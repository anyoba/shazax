export const USER_ROLES = {
  STUDENT: 'student',
  MODERATOR: 'moderator',
  EDITOR: 'editor',
  ADMIN: 'admin',
  OWNER: 'owner',
};

export const USER_ROLE_VALUES = Object.values(USER_ROLES);

export const USER_ROLE_STATUS = {
  ACTIVE: 'active',
};

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
