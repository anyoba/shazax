const LEGACY_MODULE_ALIASES = {
  'analyse-2': ['Analysis 2', 'Analyse 2', 'Analyse II'],
  'algebre-2': ['Algebra 2', 'Algèbre 2', 'Algebra II'],
  mecanique: ['Mechanics', 'Mécanique', 'Mecanique'],
  thermodynamique: ['Thermodynamics', 'Thermodynamique'],
  'structure-de-la-matiere': [
    'Structure of Matter',
    'Structure de la matière',
    'Structure de matière',
  ],
};

const LEGACY_CATEGORY_ALIASES = {
  course: ['Courses', 'Course', 'Cours', 'course'],
  td: ['TD', 'td'],
  tp: ['TP', 'tp'],
  exam: ['Exams', 'Exam', 'Examens', 'examen', 'exam'],
  uncategorized: ['Resources', 'Resource', 'Ressources', 'uncategorized'],
  qcm: ['QCM', 'qcm'],
};

export function normalizeLegacyValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function getNormalizedResourceCategory(category) {
  const normalized = normalizeLegacyValue(category);

  return (
    Object.entries(LEGACY_CATEGORY_ALIASES).find(([, aliases]) =>
      aliases.some((alias) => normalizeLegacyValue(alias) === normalized),
    )?.[0] || 'uncategorized'
  );
}

export function getModuleLegacyAliases(moduleItem) {
  const configuredAliases = LEGACY_MODULE_ALIASES[moduleItem?.slug] || [];
  return [...new Set([moduleItem?.name, moduleItem?.shortName, ...configuredAliases].filter(Boolean))];
}

function getResourceScopeValue(resource, field) {
  return resource?.[field] || resource?.academic?.[field] || resource?.legacy?.[field] || '';
}

function hasMatchingAcademicScope(resource, moduleItem) {
  const scopedFields = ['institutionId', 'programId', 'programYearId', 'semesterId'];
  return scopedFields.every((field) => {
    const value = getResourceScopeValue(resource, field);
    return value && value === moduleItem?.[field];
  });
}

function hasAnyAcademicScope(resource) {
  return ['institutionId', 'programId', 'programYearId', 'semesterId'].some((field) =>
    Boolean(getResourceScopeValue(resource, field)),
  );
}

function isFstSettatScope(scope) {
  const institutionValues = [
    scope?.institution?.slug,
    scope?.institution?.shortName,
    scope?.institution?.name,
  ].map(normalizeLegacyValue);

  return institutionValues.some((value) => value === 'fst settat' || value === 'fst');
}

function canUseFstLegacyFallback(resource, moduleItem, scope) {
  if (hasAnyAcademicScope(resource)) return false;
  if (!isFstSettatScope(scope)) return false;
  if (moduleItem?.institutionId && scope?.institution?.id && moduleItem.institutionId !== scope.institution.id) {
    return false;
  }

  return true;
}

export function isResourceLinkedToModule(resource, moduleItem, scope = {}) {
  if (!resource || !moduleItem) return false;
  if (Array.isArray(resource.moduleIds) && resource.moduleIds.includes(moduleItem.id)) return true;
  if (resource.moduleId && resource.moduleId === moduleItem.id) return true;
  if (
    Array.isArray(resource.moduleIds) &&
    resource.moduleIds.length > 0 &&
    !hasMatchingAcademicScope(resource, moduleItem) &&
    !canUseFstLegacyFallback(resource, moduleItem, scope)
  ) {
    return false;
  }
  if (!hasMatchingAcademicScope(resource, moduleItem) && !canUseFstLegacyFallback(resource, moduleItem, scope)) {
    return false;
  }

  const legacyModule = resource.legacy?.module || resource.module || '';
  const normalizedLegacyModule = normalizeLegacyValue(legacyModule);

  return getModuleLegacyAliases(moduleItem).some(
    (alias) => normalizeLegacyValue(alias) === normalizedLegacyModule,
  );
}

export function getResourceLinkMode(resource, moduleItem, scope = {}) {
  if (Array.isArray(resource?.moduleIds) && resource.moduleIds.includes(moduleItem?.id)) {
    return 'academic';
  }
  if (resource?.moduleId && resource.moduleId === moduleItem?.id) {
    return 'academic';
  }

  if (isResourceLinkedToModule(resource, moduleItem, scope)) {
    return 'legacy';
  }

  return 'none';
}
