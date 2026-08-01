import { concoursQuestions } from '../data/concours/index.js';
import { getQuestionsForConfig } from '../utils/concours/catalog.js';
import {
  calculateBadges,
  getQuestionXp,
  isAnswerCorrect,
  summarizeSession,
} from '../utils/concours/scoring.js';

const VERSION = 1;
const PREFIX = 'shazax_concours_v1';

export const CONCOURS_STORAGE_KEYS = {
  progress: `${PREFIX}_progress`,
  sessions: `${PREFIX}_sessions`,
  favorites: `${PREFIX}_favorites`,
  mistakes: `${PREFIX}_mistakes`,
  settings: `${PREFIX}_settings`,
  profile: `${PREFIX}_profile`,
  reports: `${PREFIX}_reports`,
  adminQuestions: `${PREFIX}_admin_questions`,
  activations: `${PREFIX}_activations`,
};

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  reducedMotion: false,
  timerVisible: true,
  confirmBeforeQuit: true,
  dailyGoal: 20,
  language: 'fr',
};

export const DEFAULT_PROGRESS = {
  version: VERSION,
  xp: 860,
  totalAnswered: 34,
  totalCorrect: 23,
  totalStudySeconds: 6240,
  streak: 2,
  lastStudyDate: '',
  badges: ['first-step', 'ten-correct'],
  limitsCorrect: 7,
};

export const DEMO_ACTIVATION_CODES = ['SHAZAX-START', 'MED-2026', 'CONCOURS-DEMO'];

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureQuestionMap(questionIds) {
  return questionIds.reduce((map, questionId) => {
    const question = concoursQuestions.find((item) => item.id === questionId);
    if (question) map[questionId] = question;
    return map;
  }, {});
}

export function getSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...readJson(CONCOURS_STORAGE_KEYS.settings, {}),
  };
}

export function saveSettings(settings) {
  const nextSettings = {
    ...getSettings(),
    ...settings,
  };
  writeJson(CONCOURS_STORAGE_KEYS.settings, nextSettings);
  return nextSettings;
}

export function getProgress() {
  return {
    ...DEFAULT_PROGRESS,
    ...readJson(CONCOURS_STORAGE_KEYS.progress, {}),
    version: VERSION,
  };
}

export function saveProgress(progress) {
  const nextProgress = {
    ...getProgress(),
    ...progress,
    version: VERSION,
  };
  writeJson(CONCOURS_STORAGE_KEYS.progress, nextProgress);
  return nextProgress;
}

export function getSessions() {
  return readJson(CONCOURS_STORAGE_KEYS.sessions, []);
}

export function saveSessions(sessions) {
  writeJson(CONCOURS_STORAGE_KEYS.sessions, sessions);
  return sessions;
}

export function createSession(config) {
  const questions = Array.isArray(config.questionIds) && config.questionIds.length > 0
    ? config.questionIds
        .map((questionId) => concoursQuestions.find((question) => question.id === questionId))
        .filter(Boolean)
    : getQuestionsForConfig(config);
  const questionIds = questions.map((question) => question.id);
  const now = new Date().toISOString();
  const session = {
    id: generateSessionId(),
    config,
    status: 'active',
    mode: config.mode || 'training',
    createdAt: now,
    startedAt: now,
    completedAt: '',
    currentIndex: 0,
    questionIds,
    questionsById: ensureQuestionMap(questionIds),
    answers: {},
    hintQuestionIds: [],
    elapsedSeconds: 0,
    averageSecondsPerQuestion: 0,
    summary: null,
  };

  const sessions = [session, ...getSessions()].slice(0, 50);
  saveSessions(sessions);
  saveProgress({ lastSessionId: session.id });
  return session;
}

export function getSession(sessionId) {
  return getSessions().find((session) => session.id === sessionId) || null;
}

export function updateSession(sessionId, updates) {
  let updatedSession = null;
  const sessions = getSessions().map((session) => {
    if (session.id !== sessionId) return session;
    updatedSession = {
      ...session,
      ...updates,
      questionsById: {
        ...ensureQuestionMap(session.questionIds),
        ...(session.questionsById || {}),
      },
    };
    return updatedSession;
  });
  saveSessions(sessions);
  return updatedSession;
}

export function answerQuestion(sessionId, questionId, answerValue, { usedHint = false, skipped = false } = {}) {
  const session = getSession(sessionId);
  if (!session) return null;

  const question = session.questionsById?.[questionId] || concoursQuestions.find((item) => item.id === questionId);
  const correct = skipped ? false : isAnswerCorrect(question, answerValue);
  const xp = getQuestionXp({ correct, usedHint, skipped });
  const answer = {
    questionId,
    answerValue,
    correct,
    skipped,
    usedHint,
    xp,
    answeredAt: new Date().toISOString(),
  };

  const answers = {
    ...(session.answers || {}),
    [questionId]: answer,
  };

  return updateSession(sessionId, { answers });
}

export function completeSession(sessionId, elapsedSeconds = 0) {
  const session = getSession(sessionId);
  if (!session) return null;

  const averageSecondsPerQuestion = session.questionIds.length
    ? Math.round(elapsedSeconds / session.questionIds.length)
    : 0;
  const sessionWithTiming = {
    ...session,
    elapsedSeconds,
    averageSecondsPerQuestion,
  };
  const summary = summarizeSession(sessionWithTiming);
  const currentProgress = getProgress();
  const previousDate = currentProgress.lastStudyDate;
  const currentDate = todayKey();
  const streak =
    previousDate === currentDate
      ? currentProgress.streak
      : previousDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        ? Number(currentProgress.streak || 0) + 1
        : 1;
  const badgeResult = calculateBadges(currentProgress, sessionWithTiming, summary);
  const limitsCorrect = Object.values(session.answers || {}).filter((answer) => {
    const question = session.questionsById?.[answer.questionId];
    return question?.chapterId === 'limits' && answer.correct;
  }).length;

  const completed = updateSession(sessionId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    elapsedSeconds,
    averageSecondsPerQuestion,
    summary,
    badgesUnlocked: badgeResult.newlyUnlocked,
  });

  saveProgress({
    xp: Number(currentProgress.xp || 0) + summary.totalXp,
    totalAnswered: Number(currentProgress.totalAnswered || 0) + summary.answeredCount,
    totalCorrect: Number(currentProgress.totalCorrect || 0) + summary.correct,
    totalStudySeconds: Number(currentProgress.totalStudySeconds || 0) + elapsedSeconds,
    streak,
    lastStudyDate: currentDate,
    badges: badgeResult.badgeIds,
    limitsCorrect: Number(currentProgress.limitsCorrect || 0) + limitsCorrect,
    lastSessionId: sessionId,
  });

  syncMistakes(completed);
  return completed;
}

export function getFavorites() {
  return readJson(CONCOURS_STORAGE_KEYS.favorites, []);
}

export function toggleFavorite(questionId) {
  const favorites = getFavorites();
  const nextFavorites = favorites.includes(questionId)
    ? favorites.filter((id) => id !== questionId)
    : [questionId, ...favorites];
  writeJson(CONCOURS_STORAGE_KEYS.favorites, nextFavorites);
  return nextFavorites;
}

export function getMistakes() {
  return readJson(CONCOURS_STORAGE_KEYS.mistakes, []);
}

export function saveMistakes(mistakes) {
  writeJson(CONCOURS_STORAGE_KEYS.mistakes, mistakes);
  return mistakes;
}

function syncMistakes(session) {
  if (!session) return;
  const mistakes = getMistakes();
  const byQuestion = new Map(mistakes.map((mistake) => [mistake.questionId, mistake]));

  Object.values(session.answers || {}).forEach((answer) => {
    if (answer.correct || answer.skipped) return;
    const question = session.questionsById?.[answer.questionId];
    if (!question) return;
    const existing = byQuestion.get(answer.questionId);
    byQuestion.set(answer.questionId, {
      id: existing?.id || `mistake_${answer.questionId}`,
      questionId: answer.questionId,
      selectedAnswer: answer.answerValue,
      correctAnswer: question.correctChoiceId || String(question.correctNumericValue),
      contestId: question.contestId,
      subjectId: question.subjectId,
      chapterId: question.chapterId,
      explanation: question.explanation,
      date: new Date().toISOString(),
      failures: Number(existing?.failures || 0) + 1,
      status: existing?.status || 'a_revoir',
    });
  });

  saveMistakes([...byQuestion.values()]);
}

export function markMistakeMastered(questionId) {
  return saveMistakes(
    getMistakes().map((mistake) =>
      mistake.questionId === questionId ? { ...mistake, status: 'maitrisee' } : mistake,
    ),
  );
}

export function getReports() {
  return readJson(CONCOURS_STORAGE_KEYS.reports, []);
}

export function addReport(report) {
  const nextReport = {
    id: `report_${Date.now()}`,
    ...report,
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  writeJson(CONCOURS_STORAGE_KEYS.reports, [nextReport, ...getReports()]);
  return nextReport;
}

export function getProfile() {
  return readJson(CONCOURS_STORAGE_KEYS.profile, {});
}

export function saveProfile(profile) {
  writeJson(CONCOURS_STORAGE_KEYS.profile, profile);
  return profile;
}

export function activateCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  const current = readJson(CONCOURS_STORAGE_KEYS.activations, []);

  if (!DEMO_ACTIVATION_CODES.includes(normalized)) {
    return { success: false, message: 'Code invalide pour cette demo.' };
  }

  if (current.includes(normalized)) {
    return { success: true, message: 'Ce code est deja active.' };
  }

  writeJson(CONCOURS_STORAGE_KEYS.activations, [normalized, ...current]);
  return { success: true, message: 'Code active. Toutes les fonctionnalites restent gratuites pour cette demo.' };
}

export function getAdminQuestions() {
  return readJson(CONCOURS_STORAGE_KEYS.adminQuestions, concoursQuestions);
}

export function saveAdminQuestions(questions) {
  writeJson(CONCOURS_STORAGE_KEYS.adminQuestions, questions);
  return questions;
}

export function resetConcoursLocalData() {
  if (!canUseStorage()) return;
  Object.values(CONCOURS_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}
