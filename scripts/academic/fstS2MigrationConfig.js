export const ACADEMIC_MIGRATION_VERSION = 1;

export const DEFAULT_STATUS = 'published';

export const TARGET_STRUCTURE = {
  institution: {
    plannedId: 'inst_fst_settat',
    name: 'FST Settat',
    shortName: 'FST Settat',
    slug: 'fst-settat',
    city: 'Settat',
    type: 'faculty',
    status: DEFAULT_STATUS,
    order: 1,
    isDeleted: false,
  },
  program: {
    plannedId: 'prog_fst_settat_msd',
    name: 'Mathématiques et Science des Données',
    shortName: 'MSD',
    slug: 'mathematiques-science-donnees',
    status: DEFAULT_STATUS,
    order: 1,
    isDeleted: false,
  },
  programYear: {
    plannedId: 'pyear_fst_settat_msd_1ere_annee',
    name: '1ère année',
    slug: '1ere-annee',
    yearNumber: 1,
    status: DEFAULT_STATUS,
    order: 1,
    isDeleted: false,
  },
  semester: {
    plannedId: 'sem_fst_settat_msd_s2',
    name: 'S2',
    slug: 's2',
    semesterNumber: 2,
    status: DEFAULT_STATUS,
    order: 2,
    isDeleted: false,
  },
};

export const TARGET_MODULES = [
  {
    plannedId: 'mod_fst_settat_msd_s2_analyse_2',
    name: 'Analyse 2',
    slug: 'analyse-2',
    order: 1,
    aliases: ['Analysis 2', 'Analyse 2', 'Analyse II'],
  },
  {
    plannedId: 'mod_fst_settat_msd_s2_algebre_2',
    name: 'Algèbre 2',
    slug: 'algebre-2',
    order: 2,
    aliases: ['Algebra 2', 'Algèbre 2', 'Algebra II'],
  },
  {
    plannedId: 'mod_fst_settat_msd_s2_mecanique',
    name: 'Mécanique',
    slug: 'mecanique',
    order: 3,
    aliases: ['Mechanics', 'Mécanique', 'Mecanique'],
  },
  {
    plannedId: 'mod_fst_settat_msd_s2_thermodynamique',
    name: 'Thermodynamique',
    slug: 'thermodynamique',
    order: 4,
    aliases: ['Thermodynamics', 'Thermodynamique'],
  },
  {
    plannedId: 'mod_fst_settat_msd_s2_structure_de_la_matiere',
    name: 'Structure de la matière',
    slug: 'structure-de-la-matiere',
    order: 5,
    aliases: ['Structure of Matter', 'Structure de la matière', 'Structure de matière'],
  },
];

export const CATEGORY_MAPPINGS = [
  {
    category: 'course',
    aliases: ['Courses', 'Course', 'Cours', 'course'],
  },
  {
    category: 'td',
    aliases: ['TD', 'td'],
  },
  {
    category: 'tp',
    aliases: ['TP', 'tp'],
  },
  {
    category: 'exam',
    aliases: ['Exams', 'Exam', 'Examens', 'examen', 'exam'],
  },
  {
    category: 'uncategorized',
    aliases: ['Resources', 'Resource', 'Ressources'],
  },
  {
    category: 'qcm',
    aliases: ['QCM', 'qcm'],
  },
];
