export const XP_LEVELS = [
  { level: 1, minXp: 0, maxXp: 500, label: 'Depart solide' },
  { level: 2, minXp: 500, maxXp: 1200, label: 'Rythme installe' },
  { level: 3, minXp: 1200, maxXp: 2500, label: 'Preparation serieuse' },
  { level: 4, minXp: 2500, maxXp: 5000, label: 'Candidat avance' },
  { level: 5, minXp: 5000, maxXp: 8500, label: 'Tres competitif' },
  { level: 6, minXp: 8500, maxXp: 14000, label: 'Elite concours' },
];

export const concoursBadges = [
  {
    id: 'first-step',
    name: 'Premier pas',
    description: 'Terminer une premiere question.',
  },
  {
    id: 'ten-correct',
    name: '10 bonnes reponses',
    description: 'Cumuler dix bonnes reponses.',
  },
  {
    id: 'perfect-series',
    name: 'Serie parfaite',
    description: 'Reussir une serie sans erreur.',
  },
  {
    id: 'three-day-streak',
    name: '3 jours de streak',
    description: 'Etudier trois jours de suite.',
  },
  {
    id: 'hundred-questions',
    name: '100 questions',
    description: 'Repondre a cent questions.',
  },
  {
    id: 'limits-master',
    name: 'Maitre des limites',
    description: 'Reussir huit questions du chapitre Limites.',
  },
  {
    id: 'no-hint',
    name: 'Sans indice',
    description: 'Terminer une serie correcte sans indice.',
  },
  {
    id: 'fast-accurate',
    name: 'Rapide et precis',
    description: 'Obtenir au moins 80% avec moins de 45 secondes par question.',
  },
];
