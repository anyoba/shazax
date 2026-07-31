import {
  ACADEMIC_STATUSES,
  ACADEMIC_STATUS_VALUES,
  INSTITUTION_TYPE_VALUES,
} from '../../src/constants/academic.js';
import { normalizeSlug, isValidSlug } from '../../src/utils/academicValidation.js';
import { HttpError } from './auth.js';

const ALLOWED_FIELDS = [
  'name',
  'shortName',
  'slug',
  'city',
  'type',
  'status',
  'order',
  'description',
  'logoUrl',
  'websiteUrl',
];

const TEXT_RULES = {
  name: { min: 2, max: 120, required: true },
  shortName: { min: 2, max: 50, required: true },
  city: { min: 2, max: 80, required: true },
  description: { min: 0, max: 2000, required: false },
};

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeSpaces(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function assertNoUnexpectedFields(data) {
  const unexpectedField = Object.keys(data).find((field) => !ALLOWED_FIELDS.includes(field));
  if (unexpectedField) {
    throw new HttpError(400, `Unexpected field: ${unexpectedField}.`);
  }
}

function cleanText(data, field, { partial }) {
  const rules = TEXT_RULES[field];
  const value = data[field];

  if (value === undefined || value === null) {
    if (partial || !rules.required) return undefined;
    throw new HttpError(400, `${field} is required.`);
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string.`);
  }

  const cleaned = normalizeSpaces(value);

  if (rules.required && cleaned.length < rules.min) {
    throw new HttpError(400, `${field} must be at least ${rules.min} characters.`);
  }

  if (cleaned.length > rules.max) {
    throw new HttpError(400, `${field} must be ${rules.max} characters or fewer.`);
  }

  return cleaned;
}

function cleanSlug(data, { partial }) {
  const value = data.slug;

  if (value === undefined || value === null) {
    if (partial) return undefined;
    throw new HttpError(400, 'slug is required.');
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'slug must be a string.');
  }

  const cleaned = normalizeSlug(value);

  if (!cleaned || !isValidSlug(cleaned)) {
    throw new HttpError(400, 'slug must contain lowercase letters, numbers, and single hyphens.');
  }

  return cleaned;
}

function cleanType(data, { partial }) {
  const value = data.type;

  if (value === undefined || value === null) {
    if (partial) return undefined;
    throw new HttpError(400, 'type is required.');
  }

  if (!INSTITUTION_TYPE_VALUES.includes(value)) {
    throw new HttpError(400, 'type is invalid.');
  }

  return value;
}

function cleanStatus(data, { partial }) {
  const value = data.status;

  if (value === undefined || value === null || value === '') {
    if (partial) return undefined;
    return ACADEMIC_STATUSES.DRAFT;
  }

  if (!ACADEMIC_STATUS_VALUES.includes(value)) {
    throw new HttpError(400, 'status is invalid.');
  }

  return value;
}

function cleanOrder(data, { partial }) {
  const value = data.order;

  if (value === undefined || value === null || value === '') {
    if (partial) return undefined;
    throw new HttpError(400, 'order is required.');
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 9999) {
    throw new HttpError(400, 'order must be an integer between 0 and 9999.');
  }

  return numberValue;
}

function cleanUrl(data, field, { partial }) {
  const value = data[field];

  if (value === undefined || value === null) {
    if (partial) return undefined;
    return '';
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string.`);
  }

  const cleaned = value.trim();
  if (!cleaned) return '';
  if (cleaned.length > 1000) {
    throw new HttpError(400, `${field} must be 1000 characters or fewer.`);
  }

  try {
    const url = new URL(cleaned);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw new HttpError(400, `${field} must be a valid http or https URL.`);
  }

  return cleaned;
}

export function validateInstitutionPayload(payload, { partial = false } = {}) {
  if (!isPlainObject(payload)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }

  assertNoUnexpectedFields(payload);

  if (partial && Object.keys(payload).length === 0) {
    throw new HttpError(400, 'At least one field is required.');
  }

  const cleaned = {};

  for (const field of ['name', 'shortName', 'city', 'description']) {
    const value = cleanText(payload, field, { partial });
    if (value !== undefined) cleaned[field] = value;
  }

  const slug = cleanSlug(payload, { partial });
  if (slug !== undefined) cleaned.slug = slug;

  const type = cleanType(payload, { partial });
  if (type !== undefined) cleaned.type = type;

  const status = cleanStatus(payload, { partial });
  if (status !== undefined) cleaned.status = status;

  const order = cleanOrder(payload, { partial });
  if (order !== undefined) cleaned.order = order;

  for (const field of ['logoUrl', 'websiteUrl']) {
    const value = cleanUrl(payload, field, { partial });
    if (value !== undefined) cleaned[field] = value;
  }

  return cleaned;
}

export function normalizeComparable(value) {
  return normalizeSpaces(value).toLowerCase();
}
