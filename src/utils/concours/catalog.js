import {
  concoursChapters,
  concoursContests,
  concoursQuestions,
  concoursSubjects,
} from '../../data/concours/index.js';

export const DIFFICULTIES = [
  { id: 'easy', label: 'Facile' },
  { id: 'medium', label: 'Moyen' },
  { id: 'hard', label: 'Difficile' },
  { id: 'mixed', label: 'Mixte' },
];

export const QUESTION_COUNT_OPTIONS = [5, 10, 20, 40];
export const SESSION_MODES = ['training', 'exam'];

export function getContestBySlug(slug) {
  return concoursContests.find((contest) => contest.slug === slug) || null;
}

export function getContestById(id) {
  return concoursContests.find((contest) => contest.id === id) || null;
}

export function getSubjectById(id) {
  return concoursSubjects.find((subject) => subject.id === id) || null;
}

export function getChapterById(id) {
  return concoursChapters.find((chapter) => chapter.id === id) || null;
}

export function getQuestionById(id) {
  return concoursQuestions.find((question) => question.id === id) || null;
}

export function getSubjectsForContest(contestId) {
  const contest = getContestById(contestId);
  if (!contest) return [];
  return contest.subjects
    .map(getSubjectById)
    .filter(Boolean)
    .sort((first, second) => first.order - second.order);
}

export function getChaptersForSubject(contestId, subjectId) {
  return concoursChapters
    .filter((chapter) => chapter.contestId === contestId && chapter.subjectId === subjectId)
    .sort((first, second) => first.order - second.order);
}

export function getQuestionsForConfig(config) {
  const filtered = concoursQuestions.filter((question) => {
    const matchesContest = !config.contestId || question.contestId === config.contestId;
    const matchesSubject =
      !config.subjectId || config.subjectId === 'all' || question.subjectId === config.subjectId;
    const matchesChapter =
      !config.chapterId || config.chapterId === 'all' || question.chapterId === config.chapterId;
    const matchesDifficulty =
      !config.difficulty || config.difficulty === 'mixed' || question.difficulty === config.difficulty;
    return (
      question.status === 'published' &&
      matchesContest &&
      matchesSubject &&
      matchesChapter &&
      matchesDifficulty
    );
  });

  return filtered.slice(0, Number(config.questionCount || 10));
}

export function getCatalogStats(contestId) {
  const subjects = getSubjectsForContest(contestId);
  const chapters = concoursChapters.filter((chapter) => chapter.contestId === contestId);
  const questions = concoursQuestions.filter(
    (question) => question.contestId === contestId && question.status === 'published',
  );

  return {
    subjectsCount: subjects.length,
    chaptersCount: chapters.length,
    questionsCount: questions.length,
  };
}

export function getQuestionMeta(question) {
  const contest = getContestById(question?.contestId);
  const subject = getSubjectById(question?.subjectId);
  const chapter = getChapterById(question?.chapterId);

  return {
    contestName: contest?.name || 'Concours',
    subjectName: subject?.name || 'Matiere',
    chapterName: chapter?.name || 'Chapitre',
  };
}
