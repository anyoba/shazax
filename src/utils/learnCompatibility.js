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

export function isResourceLinkedToModule(resource, moduleItem, scope = {}) {
  if (!resource || !moduleItem) return false;
  // Reject conflicting destinations even when a module identifier matches.
  const scopeItems = {
    institutionId: scope.institution,
    programId: scope.program,
    programYearId: scope.programYear,
    semesterId: scope.semester,
  };
  if (Object.entries(scopeItems).some(([field, item]) => {
    if (moduleItem[field] && item?.id && moduleItem[field] !== item.id) return true;
    const value = getResourceScopeValue(resource, field);
    return value && (
      (moduleItem[field] && value !== moduleItem[field]) ||
      (item?.id && value !== item.id)
    );
  })) return false;

  // Explicit links are authoritative: never fall back to a shared module name.
  if (Array.isArray(resource.moduleIds) && resource.moduleIds.length > 0) {
    return Boolean(moduleItem.id) && resource.moduleIds.includes(moduleItem.id);
  }
  if (resource.moduleId) return Boolean(moduleItem.id) && resource.moduleId === moduleItem.id;
  // A legacy name alone cannot identify an institution or academic destination.
  if (!hasMatchingAcademicScope(resource, moduleItem)) return false;

  const legacyModule = resource.legacy?.module || resource.module || '';
  const normalizedLegacyModule = normalizeLegacyValue(legacyModule);

  return getModuleLegacyAliases(moduleItem).some(
    (alias) => normalizeLegacyValue(alias) === normalizedLegacyModule,
  );
}

export function getResourceLinkMode(resource, moduleItem, scope = {}) {
  if (!isResourceLinkedToModule(resource, moduleItem, scope)) return 'none';
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
