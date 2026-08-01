import { concoursBadges, XP_LEVELS } from '../../data/concours/index.js';
import { getChapterById } from './catalog.js';

export function getLevelForXp(xp = 0) {
  const level = XP_LEVELS.find((item) => xp >= item.minXp && xp < item.maxXp);
  return level || XP_LEVELS[XP_LEVELS.length - 1];
}

export function getNextLevelProgress(xp = 0) {
  const current = getLevelForXp(xp);
  const span = Math.max(current.maxXp - current.minXp, 1);
  const currentXp = Math.min(Math.max(xp - current.minXp, 0), span);

  return {
    current,
    percent: Math.round((currentXp / span) * 100),
    remaining: Math.max(current.maxXp - xp, 0),
  };
}

export function isAnswerCorrect(question, answer) {
  if (!question || answer === undefined || answer === null || answer === '') return false;

  if (question.type === 'numeric') {
    const numericAnswer = Number(answer);
    if (!Number.isFinite(numericAnswer)) return false;
    const tolerance = Number(question.tolerance || 0);
    return Math.abs(numericAnswer - Number(question.correctNumericValue)) <= tolerance;
  }

  return answer === question.correctChoiceId;
}

export function getCorrectAnswerLabel(question) {
  if (!question) return '';
  if (question.type === 'numeric') return String(question.correctNumericValue);
  return question.choices?.find((choice) => choice.id === question.correctChoiceId)?.text || '';
}

export function getQuestionXp({ correct, usedHint, skipped }) {
  if (skipped || !correct) return 0;
  return usedHint ? 6 : 10;
}

export function summarizeSession(session) {
  const answers = Object.values(session.answers || {});
  const correct = answers.filter((answer) => answer.correct).length;
  const skipped = answers.filter((answer) => answer.skipped).length;
  const wrong = Math.max(session.questionIds.length - correct - skipped, 0);
  const baseXp = answers.reduce((total, answer) => total + Number(answer.xp || 0), 0);
  const perfectBonus = session.questionIds.length > 0 && correct === session.questionIds.length ? 20 : 0;
  const totalXp = baseXp + perfectBonus;
  const successRate = session.questionIds.length
    ? Math.round((correct / session.questionIds.length) * 100)
    : 0;

  return {
    correct,
    wrong,
    skipped,
    baseXp,
    perfectBonus,
    totalXp,
    successRate,
    answeredCount: answers.length,
  };
}

export function calculateBadges(progress, session, summary) {
  const unlocked = new Set(progress.badges || []);
  const totalCorrect = Number(progress.totalCorrect || 0) + summary.correct;
  const totalAnswered = Number(progress.totalAnswered || 0) + summary.answeredCount;
  const badges = [];

  function unlock(id) {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      badges.push(concoursBadges.find((badge) => badge.id === id));
    }
  }

  if (totalAnswered > 0) unlock('first-step');
  if (totalCorrect >= 10) unlock('ten-correct');
  if (summary.perfectBonus > 0) unlock('perfect-series');
  if (Number(progress.streak || 0) >= 3) unlock('three-day-streak');
  if (totalAnswered >= 100) unlock('hundred-questions');

  const limitCorrect = Object.values(session.answers || {}).filter((answer) => {
    const question = session.questionsById?.[answer.questionId];
    return question?.chapterId === 'limits' && answer.correct;
  }).length;
  if ((progress.limitsCorrect || 0) + limitCorrect >= 8) unlock('limits-master');

  const usedHint = Object.values(session.answers || {}).some((answer) => answer.usedHint);
  if (summary.correct > 0 && !usedHint) unlock('no-hint');
  if (summary.successRate >= 80 && session.averageSecondsPerQuestion <= 45) unlock('fast-accurate');

  return {
    badgeIds: [...unlocked],
    newlyUnlocked: badges.filter(Boolean),
  };
}

export function buildChapterPerformance(sessions) {
  const stats = {};

  sessions.forEach((session) => {
    Object.values(session.answers || {}).forEach((answer) => {
      const question = session.questionsById?.[answer.questionId];
      if (!question) return;
      const key = question.chapterId;
      stats[key] ||= { chapterId: key, total: 0, correct: 0 };
      stats[key].total += 1;
      if (answer.correct) stats[key].correct += 1;
    });
  });

  return Object.values(stats).map((item) => {
    const chapter = getChapterById(item.chapterId);
    return {
      ...item,
      name: chapter?.name || item.chapterId,
      rate: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    };
  });
}
