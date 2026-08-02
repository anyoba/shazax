import { categories, modules } from '../../src/data/modules.js';
import { HttpError } from './auth.js';

const ALLOWED_FIELDS = [
  'module',
  'category',
  'title',
  'fileName',
  'fileUrl',
  'correctionTitle',
  'correctionUrl',
  'status',
  'moduleIds',
];

const MAX_LENGTHS = {
  module: 80,
  category: 40,
  title: 180,
  fileName: 180,
  fileUrl: 1000,
  correctionTitle: 180,
  correctionUrl: 1000,
  status: 40,
};

const PUBLIC_STATUSES = ['published', 'draft', 'archived'];

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertNoUnexpectedFields(data) {
  const unexpectedField = Object.keys(data).find((field) => !ALLOWED_FIELDS.includes(field));
  if (unexpectedField) {
    throw new HttpError(400, `Unexpected field: ${unexpectedField}.`);
  }
}

function cleanString(value, field, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `${field} is required.`);
    return '';
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string.`);
  }

  const trimmed = value.trim();
  if (required && !trimmed) {
    throw new HttpError(400, `${field} is required.`);
  }

  if (trimmed.length > MAX_LENGTHS[field]) {
    throw new HttpError(400, `${field} is too long.`);
  }

  return trimmed;
}

function assertUrl(value, field, { required = false } = {}) {
  const cleaned = cleanString(value, field, { required });
  if (!cleaned) return '';

  try {
    const url = new URL(cleaned);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    return cleaned;
  } catch {
    throw new HttpError(400, `${field} must be a valid http or https URL.`);
  }
}

function validateModule(moduleName) {
  if (!modules.includes(moduleName)) {
    throw new HttpError(400, 'module is invalid.');
  }
}

function validateCategory(categoryName) {
  if (!categories.includes(categoryName)) {
    throw new HttpError(400, 'category is invalid.');
  }
}

function cleanStatus(value) {
  const status = cleanString(value, 'status') || 'published';
  if (!PUBLIC_STATUSES.includes(status)) {
    throw new HttpError(400, 'status is invalid.');
  }
  return status;
}

function cleanModuleIds(value) {
  if (value === undefined || value === null) return undefined;

  if (!Array.isArray(value)) {
    throw new HttpError(400, 'moduleIds must be an array.');
  }

  const ids = value.map((item) => {
    if (typeof item !== 'string') {
      throw new HttpError(400, 'moduleIds must contain only strings.');
    }

    const trimmed = item.trim();
    if (!trimmed || trimmed.length > 160) {
      throw new HttpError(400, 'moduleIds contains an invalid id.');
    }

    return trimmed;
  });

  return [...new Set(ids)];
}

export function validateResourcePayload(payload, { partial = false } = {}) {
  if (!isPlainObject(payload)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }

  assertNoUnexpectedFields(payload);

  if (partial && Object.keys(payload).length === 0) {
    throw new HttpError(400, 'At least one field is required.');
  }

  const cleaned = {};

  if (!partial || payload.module !== undefined) {
    cleaned.module = cleanString(payload.module, 'module', { required: true });
    validateModule(cleaned.module);
  }

  if (!partial || payload.category !== undefined) {
    cleaned.category = cleanString(payload.category, 'category', { required: true });
    validateCategory(cleaned.category);
  }

  if (!partial || payload.title !== undefined) {
    cleaned.title = cleanString(payload.title, 'title', { required: true });
  }

  if (!partial || payload.fileName !== undefined) {
    cleaned.fileName = cleanString(payload.fileName, 'fileName', { required: true });
  }

  if (!partial || payload.fileUrl !== undefined) {
    cleaned.fileUrl = assertUrl(payload.fileUrl, 'fileUrl', { required: true });
  }

  if (!partial || payload.correctionTitle !== undefined) {
    cleaned.correctionTitle = cleanString(payload.correctionTitle, 'correctionTitle');
  }

  if (!partial || payload.correctionUrl !== undefined) {
    cleaned.correctionUrl = assertUrl(payload.correctionUrl, 'correctionUrl');
  }

  if (!partial || payload.status !== undefined) {
    cleaned.status = cleanStatus(payload.status);
  }

  if (payload.moduleIds !== undefined) {
    cleaned.moduleIds = cleanModuleIds(payload.moduleIds);
  }

  return cleaned;
}

export function isPublicResource(resource) {
  return resource.status !== 'draft' && resource.status !== 'archived' && resource.visibility !== 'private';
}
