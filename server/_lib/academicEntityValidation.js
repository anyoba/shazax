import { ACADEMIC_STATUSES, ACADEMIC_STATUS_VALUES } from './serverConstants.js';
import { HttpError } from './auth.js';
import {
  isPlainObject,
  isValidSlug,
  normalizeSlug,
  normalizeSpaces,
} from './institutionsValidation.js';

const ENTITY_CONFIGS = {
  programs: {
    collection: 'programs',
    label: 'program',
    allowedFields: [
      'institutionId',
      'name',
      'shortName',
      'slug',
      'status',
      'order',
      'description',
    ],
    requiredFields: ['institutionId', 'name', 'shortName', 'slug', 'status', 'order'],
    parentFields: ['institutionId'],
    textRules: {
      name: { min: 2, max: 140 },
      shortName: { min: 1, max: 50 },
      description: { min: 0, max: 1000 },
    },
  },
  program_years: {
    collection: 'program_years',
    label: 'program year',
    allowedFields: [
      'institutionId',
      'programId',
      'name',
      'slug',
      'yearNumber',
      'status',
      'order',
    ],
    requiredFields: ['institutionId', 'programId', 'name', 'slug', 'yearNumber', 'status', 'order'],
    parentFields: ['institutionId', 'programId'],
    textRules: {
      name: { min: 2, max: 80 },
    },
    numberRules: {
      yearNumber: { min: 1, max: 10 },
    },
  },
  semesters: {
    collection: 'semesters',
    label: 'semester',
    allowedFields: [
      'institutionId',
      'programId',
      'programYearId',
      'name',
      'slug',
      'semesterNumber',
      'status',
      'order',
    ],
    requiredFields: [
      'institutionId',
      'programId',
      'programYearId',
      'name',
      'slug',
      'semesterNumber',
      'status',
      'order',
    ],
    parentFields: ['institutionId', 'programId', 'programYearId'],
    textRules: {
      name: { min: 1, max: 50 },
    },
    numberRules: {
      semesterNumber: { min: 1, max: 20 },
    },
  },
  modules: {
    collection: 'modules',
    label: 'module',
    allowedFields: [
      'institutionId',
      'programId',
      'programYearId',
      'semesterId',
      'name',
      'shortName',
      'slug',
      'status',
      'order',
      'description',
      'iconKey',
      'themeKey',
    ],
    requiredFields: ['institutionId', 'programId', 'programYearId', 'semesterId', 'name', 'slug', 'status', 'order'],
    parentFields: ['institutionId', 'programId', 'programYearId', 'semesterId'],
    textRules: {
      name: { min: 2, max: 140 },
      shortName: { min: 0, max: 50 },
      description: { min: 0, max: 1000 },
    },
    enumRules: {
      iconKey: ['calculator', 'book', 'layers', 'flask', 'atom', 'cpu', 'code', 'graduation'],
      themeKey: ['cyan', 'violet', 'sky', 'orange', 'emerald', 'white', 'rose', 'slate'],
    },
  },
};

export function getAcademicEntityConfig(entityType) {
  const config = ENTITY_CONFIGS[entityType];
  if (!config) {
    throw new HttpError(404, 'Academic entity type not found.', 'ACADEMIC_ENTITY_TYPE_NOT_FOUND');
  }

  return config;
}

function assertNoUnexpectedFields(payload, config) {
  const unexpectedField = Object.keys(payload).find((field) => !config.allowedFields.includes(field));
  if (unexpectedField) {
    throw new HttpError(400, `Unexpected field: ${unexpectedField}.`, 'ACADEMIC_FIELD_UNEXPECTED');
  }
}

function cleanText(payload, field, rule, { partial, required }) {
  const value = payload[field];

  if (value === undefined || value === null) {
    if (partial || !required) return undefined;
    throw new HttpError(400, `${field} is required.`, 'ACADEMIC_FIELD_REQUIRED');
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string.`, 'ACADEMIC_FIELD_INVALID');
  }

  const cleaned = normalizeSpaces(value);
  if (required && cleaned.length < rule.min) {
    throw new HttpError(400, `${field} must be at least ${rule.min} characters.`, 'ACADEMIC_FIELD_TOO_SHORT');
  }

  if (cleaned.length > rule.max) {
    throw new HttpError(400, `${field} must be ${rule.max} characters or fewer.`, 'ACADEMIC_FIELD_TOO_LONG');
  }

  return cleaned;
}

function cleanSlug(payload, { partial }) {
  const value = payload.slug;

  if (value === undefined || value === null) {
    if (partial) return undefined;
    throw new HttpError(400, 'slug is required.', 'ACADEMIC_SLUG_REQUIRED');
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'slug must be a string.', 'ACADEMIC_SLUG_INVALID');
  }

  const cleaned = normalizeSlug(value);
  if (!cleaned || !isValidSlug(cleaned)) {
    throw new HttpError(400, 'slug must contain lowercase letters, numbers, and single hyphens.', 'ACADEMIC_SLUG_INVALID');
  }

  return cleaned;
}

function cleanStatus(payload, { partial }) {
  const value = payload.status;

  if (value === undefined || value === null || value === '') {
    if (partial) return undefined;
    return ACADEMIC_STATUSES.DRAFT;
  }

  if (!ACADEMIC_STATUS_VALUES.includes(value)) {
    throw new HttpError(400, 'status is invalid.', 'ACADEMIC_STATUS_INVALID');
  }

  return value;
}

function cleanOrder(payload, { partial }) {
  const value = payload.order;

  if (value === undefined || value === null || value === '') {
    if (partial) return undefined;
    throw new HttpError(400, 'order is required.', 'ACADEMIC_ORDER_REQUIRED');
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 9999) {
    throw new HttpError(400, 'order must be an integer between 0 and 9999.', 'ACADEMIC_ORDER_INVALID');
  }

  return numberValue;
}

function cleanNumber(payload, field, rule, { partial, required }) {
  const value = payload[field];

  if (value === undefined || value === null || value === '') {
    if (partial || !required) return undefined;
    throw new HttpError(400, `${field} is required.`, 'ACADEMIC_FIELD_REQUIRED');
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < rule.min || numberValue > rule.max) {
    throw new HttpError(400, `${field} must be an integer between ${rule.min} and ${rule.max}.`, 'ACADEMIC_FIELD_INVALID');
  }

  return numberValue;
}

function cleanParentId(payload, field, { partial }) {
  const value = payload[field];

  if (value === undefined || value === null) {
    if (partial) return undefined;
    throw new HttpError(400, `${field} is required.`, 'ACADEMIC_PARENT_REQUIRED');
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${field} is invalid.`, 'ACADEMIC_PARENT_INVALID');
  }

  return value.trim();
}

function cleanEnum(payload, field, allowedValues, { partial }) {
  const value = payload[field];

  if (value === undefined || value === null || value === '') {
    if (partial) return undefined;
    return '';
  }

  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw new HttpError(400, `${field} is invalid.`, 'ACADEMIC_FIELD_INVALID');
  }

  return value;
}

export function validateAcademicEntityPayload(entityType, payload, { partial = false } = {}) {
  const config = getAcademicEntityConfig(entityType);

  if (!isPlainObject(payload)) {
    throw new HttpError(400, 'Request body must be a JSON object.', 'ACADEMIC_BODY_INVALID');
  }

  assertNoUnexpectedFields(payload, config);

  if (partial && Object.keys(payload).length === 0) {
    throw new HttpError(400, 'At least one field is required.', 'ACADEMIC_BODY_EMPTY');
  }

  const cleaned = {};

  for (const field of config.parentFields) {
    const value = cleanParentId(payload, field, { partial });
    if (value !== undefined) cleaned[field] = value;
  }

  for (const [field, rule] of Object.entries(config.textRules || {})) {
    const value = cleanText(payload, field, rule, {
      partial,
      required: config.requiredFields.includes(field),
    });
    if (value !== undefined) cleaned[field] = value;
  }

  const slug = cleanSlug(payload, { partial });
  if (slug !== undefined) cleaned.slug = slug;

  for (const [field, rule] of Object.entries(config.numberRules || {})) {
    const value = cleanNumber(payload, field, rule, {
      partial,
      required: config.requiredFields.includes(field),
    });
    if (value !== undefined) cleaned[field] = value;
  }

  for (const [field, allowedValues] of Object.entries(config.enumRules || {})) {
    const value = cleanEnum(payload, field, allowedValues, { partial });
    if (value !== undefined) cleaned[field] = value;
  }

  const status = cleanStatus(payload, { partial });
  if (status !== undefined) cleaned.status = status;

  const order = cleanOrder(payload, { partial });
  if (order !== undefined) cleaned.order = order;

  return cleaned;
}
