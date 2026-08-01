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

export function isResourceLinkedToModule(resource, moduleItem) {
  if (!resource || !moduleItem) return false;
  if (Array.isArray(resource.moduleIds) && resource.moduleIds.includes(moduleItem.id)) return true;

  const legacyModule = resource.legacy?.module || resource.module || '';
  const normalizedLegacyModule = normalizeLegacyValue(legacyModule);

  return getModuleLegacyAliases(moduleItem).some(
    (alias) => normalizeLegacyValue(alias) === normalizedLegacyModule,
  );
}

export function getResourceLinkMode(resource, moduleItem) {
  if (Array.isArray(resource?.moduleIds) && resource.moduleIds.includes(moduleItem?.id)) {
    return 'academic';
  }

  if (isResourceLinkedToModule(resource, moduleItem)) {
    return 'legacy';
  }

  return 'none';
}
