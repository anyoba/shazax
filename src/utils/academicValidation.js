import { ACADEMIC_STATUS_VALUES, RESOURCE_CATEGORY_VALUES } from '../constants/academic';

export function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function isValidSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isValidStatus(value) {
  return ACADEMIC_STATUS_VALUES.includes(value);
}

export function isValidResourceCategory(value) {
  return RESOURCE_CATEGORY_VALUES.includes(value);
}

export function validateRequiredText(value, maxLength = 160) {
  if (typeof value !== 'string') {
    return {
      valid: false,
      value: '',
      error: 'Value must be text.',
    };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return {
      valid: false,
      value: '',
      error: 'Value is required.',
    };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      value: trimmed,
      error: `Value must be ${maxLength} characters or fewer.`,
    };
  }

  return {
    valid: true,
    value: trimmed,
    error: null,
  };
}

export function sortByOrder(items) {
  return [...items].sort((first, second) => {
    const firstOrder = Number.isFinite(first?.order) ? first.order : Number.MAX_SAFE_INTEGER;
    const secondOrder = Number.isFinite(second?.order) ? second.order : Number.MAX_SAFE_INTEGER;

    if (firstOrder !== secondOrder) return firstOrder - secondOrder;

    return String(first?.name || '').localeCompare(String(second?.name || ''));
  });
}
