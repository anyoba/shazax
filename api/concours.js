import { randomUUID } from 'node:crypto';
import { ACADEMIC_ADMIN_READ_ROLES, ACADEMIC_CONTENT_WRITE_ROLES, ACADEMIC_PUBLISH_ROLES, USER_ROLES } from '../server/_lib/serverConstants.js';
import { HttpError, requireAuthenticatedUser, requireRole, sendError, sendJson } from '../server/_lib/auth.js';
import { FieldValue, getAdminDb, getAdminStorageBucket } from '../server/_lib/firebaseAdmin.js';
import { readJsonBody, setMethodHeader } from '../server/_lib/request.js';

const ADMIN_READ_ROLES = ACADEMIC_ADMIN_READ_ROLES;
const WRITE_ROLES = ACADEMIC_CONTENT_WRITE_ROLES;
const PUBLISH_ROLES = ACADEMIC_PUBLISH_ROLES;
const OWNER_ROLES = [USER_ROLES.OWNER];
const IN_PROGRESS = 'IN_PROGRESS';
const COMPLETED = 'COMPLETED';
const EXPIRED = 'EXPIRED';
const DEFAULT_DURATION_MINUTES = 60;
const MAX_QUESTION_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getRequestId(req) {
  const header = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  return (Array.isArray(header) ? header[0] : header) || randomUUID();
}

function q(value) {
  return Array.isArray(value) ? value[0] : value;
}

function ts(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function record(data = {}) {
  return Object.entries(data).reduce((next, [key, value]) => {
    next[key] = key.endsWith('At') || ['startedAt', 'completedAt', 'updatedAt', 'createdAt'].includes(key) ? ts(value) : value;
    return next;
  }, {});
}

function docData(doc) {
  return record({ id: doc.id, ...(doc.data() || {}) });
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function safeFileName(value) {
  const cleaned = String(value || 'question-image')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return cleaned || 'question-image';
}

function parseImageDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new HttpError(400, 'Image upload payload is invalid.', 'QUESTION_IMAGE_INVALID');
  }

  const contentType = match[1].toLowerCase();
  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new HttpError(400, 'Only jpeg, png, webp, and gif images are allowed.', 'QUESTION_IMAGE_TYPE_INVALID');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_QUESTION_IMAGE_BYTES) {
    throw new HttpError(400, 'Image must be smaller than 2 MB.', 'QUESTION_IMAGE_TOO_LARGE');
  }

  return { buffer, contentType };
}

function int(value, fallback, min = 0, max = 10000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function status(value, fallback = 'draft') {
  const normalized = String(value || fallback).toLowerCase();
  return ['draft', 'published', 'archived'].includes(normalized) ? normalized : fallback;
}

function options(value) {
  const normalized = (Array.isArray(value) ? value : [])
    .map((item, index) => ({ id: String(item?.id || String.fromCharCode(65 + index)).trim(), text: String(item?.text || '').trim() }))
    .filter((item) => item.id && item.text)
    .slice(0, 8);
  return normalized.length ? normalized : [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ];
}

function validateConcours(input = {}, partial = false) {
  const out = {};
  if (!partial || input.name !== undefined) {
    out.name = String(input.name || '').trim().slice(0, 160);
    if (!out.name) throw new HttpError(400, 'Concours name is required.', 'CONCOURS_NAME_REQUIRED');
  }
  if (!partial || input.slug !== undefined || input.name !== undefined) {
    out.slug = slugify(input.slug || input.name);
    if (!out.slug) throw new HttpError(400, 'Concours slug is required.', 'CONCOURS_SLUG_REQUIRED');
  }
  if (!partial || input.school !== undefined) out.school = String(input.school || '').trim().slice(0, 120);
  if (!partial || input.description !== undefined) out.description = String(input.description || '').trim().slice(0, 2000);
  if (!partial || input.year !== undefined) out.year = String(input.year || new Date().getFullYear()).trim().slice(0, 12);
  if (!partial || input.category !== undefined) out.category = String(input.category || '').trim().slice(0, 120);
  if (!partial || input.durationMinutes !== undefined) out.durationMinutes = int(input.durationMinutes, DEFAULT_DURATION_MINUTES, 1, 600);
  if (!partial || input.totalPoints !== undefined) out.totalPoints = int(input.totalPoints, 0, 0, 100000);
  if (!partial || input.coverImageUrl !== undefined) out.coverImageUrl = String(input.coverImageUrl || '').trim().slice(0, 2000);
  if (!partial || input.status !== undefined) out.status = status(input.status, 'draft');
  return out;
}

function validateQuestion(input = {}, partial = false) {
  const out = {};
  if (!partial || input.concoursId !== undefined) {
    out.concoursId = String(input.concoursId || '').trim();
    if (!out.concoursId) throw new HttpError(400, 'concoursId is required.', 'QUESTION_CONCOURS_REQUIRED');
  }
  if (!partial || input.questionText !== undefined || input.statement !== undefined) {
    out.questionText = String(input.questionText || input.statement || '').trim().slice(0, 5000);
    out.statement = out.questionText;
    if (!out.questionText) throw new HttpError(400, 'Question text is required.', 'QUESTION_TEXT_REQUIRED');
  }
  if (!partial || input.imageUrl !== undefined) out.imageUrl = String(input.imageUrl || '').trim().slice(0, 2000);
  if (!partial || input.subject !== undefined || input.module !== undefined) {
    out.subject = String(input.subject || input.module || '').trim().slice(0, 120);
    out.module = out.subject;
  }
  if (!partial || input.points !== undefined) out.points = int(input.points, 1, 1, 1000);
  if (!partial || input.order !== undefined) out.order = int(input.order, 1, 1, 10000);
  if (!partial || input.explanation !== undefined) out.explanation = String(input.explanation || '').trim().slice(0, 5000);
  if (!partial || input.hint !== undefined) out.hint = String(input.hint || '').trim().slice(0, 2000);
  if (!partial || input.status !== undefined) out.status = status(input.status, 'draft');
  if (!partial || input.type !== undefined) out.type = String(input.type || 'single_choice').trim() || 'single_choice';
  if (!partial || input.options !== undefined || input.choices !== undefined) {
    out.options = options(input.options || input.choices);
    out.choices = out.options;
    if (out.options.filter((item) => item.text).length < 2) throw new HttpError(400, 'At least two answers are required.', 'QUESTION_OPTIONS_REQUIRED');
  }
  if (!partial || input.correctOptionId !== undefined || input.correctChoiceId !== undefined) {
    out.correctOptionId = String(input.correctOptionId || input.correctChoiceId || '').trim();
    out.correctChoiceId = out.correctOptionId;
    if (!out.correctOptionId) throw new HttpError(400, 'Correct answer is required.', 'QUESTION_CORRECT_REQUIRED');
  }
  return out;
}

function publicConcours(item) {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    school: item.school || '',
    description: item.description || '',
    year: item.year || '',
    category: item.category || '',
    durationMinutes: Number(item.durationMinutes || DEFAULT_DURATION_MINUTES),
    questionCount: Number(item.questionCount || 0),
    totalPoints: Number(item.totalPoints || 0),
    status: item.status,
    coverImageUrl: item.coverImageUrl || '',
    modules: Array.isArray(item.modules) ? item.modules : [],
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
}

function examQuestion(question) {
  const cleanOptions = options(question.options || question.choices).map(({ id, text }) => ({ id, text }));
  return {
    id: question.id,
    concoursId: question.concoursId,
    statement: question.questionText || question.statement || '',
    questionText: question.questionText || question.statement || '',
    imageUrl: question.imageUrl || '',
    choices: cleanOptions,
    options: cleanOptions,
    subject: question.subject || question.module || '',
    module: question.module || question.subject || '',
    points: Number(question.points || 1),
    order: Number(question.order || 0),
    type: question.type || 'single_choice',
  };
}

function resultQuestion(question) {
  return {
    ...examQuestion(question),
    correctOptionId: question.correctOptionId || question.correctChoiceId || '',
    correctChoiceId: question.correctOptionId || question.correctChoiceId || '',
    explanation: question.explanation || '',
    hint: question.hint || '',
  };
}

async function concoursBySlug(slug, includeUnpublished = false) {
  const snapshot = await getAdminDb().collection('concours').where('slug', '==', slug).limit(1).get();
  if (snapshot.empty) throw new HttpError(404, 'Concours not found.', 'CONCOURS_NOT_FOUND');
  const concours = docData(snapshot.docs[0]);
  if (!includeUnpublished && concours.status !== 'published') throw new HttpError(404, 'Concours not found.', 'CONCOURS_NOT_FOUND');
  return concours;
}

async function concoursById(id) {
  const doc = await getAdminDb().collection('concours').doc(id).get();
  if (!doc.exists) throw new HttpError(404, 'Concours not found.', 'CONCOURS_NOT_FOUND');
  return docData(doc);
}

async function questionsForConcours(concoursId, publishedOnly = false) {
  let query = getAdminDb().collection('concours_questions').where('concoursId', '==', concoursId);
  if (publishedOnly) query = query.where('status', '==', 'published');
  const snapshot = await query.get();
  return snapshot.docs.map(docData).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

async function questionsByIds(ids = []) {
  const unique = [...new Set(ids)].filter(Boolean);
  const docs = await Promise.all(unique.map((id) => getAdminDb().collection('concours_questions').doc(id).get()));
  const map = new Map();
  docs.forEach((doc) => { if (doc.exists) map.set(doc.id, docData(doc)); });
  return unique.map((id) => map.get(id)).filter(Boolean);
}

async function attemptAnswers(attemptId) {
  const snapshot = await getAdminDb().collection('concours_attempt_answers').where('attemptId', '==', attemptId).get();
  return snapshot.docs.map(docData);
}

function isCorrect(question, answerValue) {
  if (answerValue === undefined || answerValue === null || String(answerValue) === '') return false;
  if (question.type === 'numeric') {
    const expected = Number(question.correctNumericValue ?? question.correctOptionId ?? question.correctChoiceId);
    const actual = Number(answerValue);
    const tolerance = Number(question.tolerance || 0);
    return Number.isFinite(expected) && Number.isFinite(actual) && Math.abs(expected - actual) <= tolerance;
  }
  return String(answerValue) === String(question.correctOptionId || question.correctChoiceId || '');
}

async function updateConcoursCounters(concoursId) {
  if (!concoursId) return;
  const questions = await questionsForConcours(concoursId, true);
  const totalPoints = questions.reduce((sum, question) => sum + Number(question.points || 1), 0);
  const modules = [...new Set(questions.map((question) => question.subject || question.module).filter(Boolean))];
  await getAdminDb().collection('concours').doc(concoursId).set({ questionCount: questions.length, totalPoints, modules, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

async function listPublic(req, res) {
  const snapshot = await getAdminDb().collection('concours').where('status', '==', 'published').get();
  const concours = snapshot.docs.map(docData).map(publicConcours).sort((a, b) => String(b.year || '').localeCompare(String(a.year || '')) || a.name.localeCompare(b.name));
  return sendJson(res, 200, { concours });
}

async function detailPublic(req, res) {
  const slug = String(q(req.query?.slug) || '').trim();
  if (!slug) throw new HttpError(400, 'slug is required.', 'CONCOURS_SLUG_REQUIRED');
  const concours = await concoursBySlug(slug);
  const questions = await questionsForConcours(concours.id, true);
  const totalPoints = questions.reduce((sum, question) => sum + Number(question.points || 1), 0);
  const modules = [...new Set(questions.map((question) => question.subject || question.module).filter(Boolean))];
  return sendJson(res, 200, { concours: publicConcours({ ...concours, questionCount: questions.length, totalPoints, modules }) });
}

async function ownedAttempt(attemptId, userId) {
  if (!attemptId) throw new HttpError(400, 'attemptId is required.', 'ATTEMPT_ID_REQUIRED');
  const doc = await getAdminDb().collection('concours_attempts').doc(attemptId).get();
  if (!doc.exists) throw new HttpError(404, 'Attempt not found.', 'ATTEMPT_NOT_FOUND');
  const attempt = docData(doc);
  if (attempt.userId !== userId) throw new HttpError(403, 'Access forbidden.', 'ACCESS_FORBIDDEN');
  return attempt;
}

async function startAttempt(req, res) {
  const user = await requireAuthenticatedUser(req);
  const body = await readJsonBody(req);
  const slug = String(body.slug || '').trim();
  if (!slug) throw new HttpError(400, 'slug is required.', 'CONCOURS_SLUG_REQUIRED');
  const concours = await concoursBySlug(slug);
  const questions = await questionsForConcours(concours.id, true);
  if (questions.length === 0) throw new HttpError(409, 'This concours has no published questions yet.', 'CONCOURS_HAS_NO_QUESTIONS');

  const existingSnapshot = await getAdminDb()
    .collection('concours_attempts')
    .where('userId', '==', user.userId)
    .where('concoursId', '==', concours.id)
    .where('status', '==', IN_PROGRESS)
    .limit(1)
    .get();
  const nowMs = Date.now();
  if (!existingSnapshot.empty) {
    const existing = docData(existingSnapshot.docs[0]);
    if (!existing.expiresAtMs || Number(existing.expiresAtMs) > nowMs) return sendJson(res, 200, { attempt: existing, reused: true });
    await finalizeAttempt(existing.id, user.userId, EXPIRED);
  }

  const durationSeconds = Number(concours.durationMinutes || DEFAULT_DURATION_MINUTES) * 60;
  const questionIds = questions.map((question) => question.id);
  const ref = getAdminDb().collection('concours_attempts').doc();
  const attempt = {
    id: ref.id,
    userId: user.userId,
    concoursId: concours.id,
    concoursSlug: concours.slug,
    concoursName: concours.name,
    status: IN_PROGRESS,
    startedAt: FieldValue.serverTimestamp(),
    startedAtMs: nowMs,
    expiresAtMs: nowMs + durationSeconds * 1000,
    completedAt: null,
    completedAtMs: null,
    durationSeconds,
    currentIndex: 0,
    questionIds,
    questionCount: questionIds.length,
    totalPoints: questions.reduce((sum, question) => sum + Number(question.points || 1), 0),
    answersCount: 0,
    flaggedQuestionIds: [],
    score: 0,
    percentage: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(attempt);
  return sendJson(res, 201, { attempt: record({ ...attempt, startedAt: nowMs, createdAt: nowMs, updatedAt: nowMs }), reused: false });
}

async function serializeAttempt(attempt) {
  const [questions, answers] = await Promise.all([questionsByIds(attempt.questionIds || []), attemptAnswers(attempt.id)]);
  const answersByQuestionId = answers.reduce((map, answer) => ({ ...map, [answer.questionId]: answer }), {});
  return {
    attempt,
    questions: questions.map(examQuestion),
    answersByQuestionId,
    remainingSeconds: Math.max(0, Math.ceil((Number(attempt.expiresAtMs || 0) - Date.now()) / 1000)),
  };
}

async function getAttempt(req, res) {
  const user = await requireAuthenticatedUser(req);
  const attemptId = String(q(req.query?.id) || '').trim();
  let attempt = await ownedAttempt(attemptId, user.userId);
  if (attempt.status === IN_PROGRESS && Number(attempt.expiresAtMs || 0) <= Date.now()) {
    attempt = await finalizeAttempt(attempt.id, user.userId, EXPIRED);
  }
  return sendJson(res, 200, await serializeAttempt(attempt));
}

async function saveAnswer(req, res) {
  const user = await requireAuthenticatedUser(req);
  const body = await readJsonBody(req);
  const attemptId = String(body.attemptId || '').trim();
  const questionId = String(body.questionId || '').trim();
  if (!questionId) throw new HttpError(400, 'questionId is required.', 'QUESTION_ID_REQUIRED');
  const attempt = await ownedAttempt(attemptId, user.userId);
  if (attempt.status !== IN_PROGRESS) throw new HttpError(409, 'Attempt is already finished.', 'ATTEMPT_ALREADY_FINISHED');
  if (Number(attempt.expiresAtMs || 0) <= Date.now()) {
    await finalizeAttempt(attempt.id, user.userId, EXPIRED);
    throw new HttpError(409, 'Attempt time is over.', 'ATTEMPT_EXPIRED');
  }
  if (!attempt.questionIds?.includes(questionId)) throw new HttpError(404, 'Question is not part of this attempt.', 'QUESTION_NOT_IN_ATTEMPT');

  const answerValue = body.answerValue === null || body.answerValue === undefined ? '' : String(body.answerValue);
  const answerId = `${attemptId}_${questionId}`;
  const answer = {
    id: answerId,
    attemptId,
    userId: user.userId,
    concoursId: attempt.concoursId,
    questionId,
    answerValue,
    flagged: Boolean(body.flagged),
    answeredAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await getAdminDb().collection('concours_attempt_answers').doc(answerId).set(answer, { merge: true });

  const snapshot = await getAdminDb().collection('concours_attempt_answers').where('attemptId', '==', attemptId).get();
  const rows = snapshot.docs.map((doc) => doc.data() || {});
  const answersCount = rows.filter((row) => row.answerValue !== undefined && row.answerValue !== null && String(row.answerValue) !== '').length;
  const flaggedQuestionIds = rows.filter((row) => row.flagged).map((row) => row.questionId);
  await getAdminDb().collection('concours_attempts').doc(attemptId).update({
    answersCount,
    flaggedQuestionIds,
    currentIndex: int(body.currentIndex, attempt.currentIndex || 0, 0, Math.max(0, (attempt.questionIds || []).length - 1)),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return sendJson(res, 200, { answer: record({ ...answer, answeredAt: Date.now(), updatedAt: Date.now() }), answersCount, flaggedQuestionIds });
}

async function writeProgress(userId, concoursId, attempt) {
  const ref = getAdminDb().collection('concours_user_progress').doc(`${userId}_${concoursId}`);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists ? snapshot.data() || {} : {};
    const completedCount = Number(current.completedCount || 0) + 1;
    const bestPercentage = Math.max(Number(current.bestPercentage || 0), Number(attempt.percentage || 0));
    const bestScore = Number(attempt.percentage || 0) >= Number(current.bestPercentage || 0) ? Number(attempt.score || 0) : Number(current.bestScore || 0);
    transaction.set(ref, {
      userId,
      concoursId,
      attemptsCount: Number(current.attemptsCount || 0) + 1,
      completedCount,
      bestScore,
      bestPercentage,
      averagePercentage: Math.round(((Number(current.averagePercentage || 0) * Number(current.completedCount || 0)) + Number(attempt.percentage || 0)) / completedCount),
      lastScore: Number(attempt.score || 0),
      lastPercentage: Number(attempt.percentage || 0),
      totalQuestionsAnswered: Number(current.totalQuestionsAnswered || 0) + Number(attempt.answeredCount || 0),
      totalCorrect: Number(current.totalCorrect || 0) + Number(attempt.correctCount || 0),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

async function finalizeAttempt(attemptId, userId, finalStatus = COMPLETED) {
  const attempt = await ownedAttempt(attemptId, userId);
  if ([COMPLETED, EXPIRED].includes(attempt.status)) return attempt;
  const [questions, answers] = await Promise.all([questionsByIds(attempt.questionIds || []), attemptAnswers(attempt.id)]);
  const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const batch = getAdminDb().batch();
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let answeredCount = 0;

  questions.forEach((question) => {
    const answer = answersByQuestionId.get(question.id);
    const hasAnswer = answer && answer.answerValue !== undefined && answer.answerValue !== null && String(answer.answerValue) !== '';
    if (!hasAnswer) {
      unansweredCount += 1;
      return;
    }
    answeredCount += 1;
    const correct = isCorrect(question, answer.answerValue);
    const pointsAwarded = correct ? Number(question.points || 1) : 0;
    if (correct) correctCount += 1;
    else incorrectCount += 1;
    score += pointsAwarded;
    batch.set(getAdminDb().collection('concours_attempt_answers').doc(answer.id), {
      correct,
      pointsAwarded,
      resultStatus: correct ? 'correct' : 'incorrect',
      gradedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  const totalPoints = Number(attempt.totalPoints || questions.reduce((sum, question) => sum + Number(question.points || 1), 0));
  const percentage = totalPoints ? Math.round((score / totalPoints) * 100) : 0;
  const nowMs = Date.now();
  const updates = {
    status: finalStatus,
    score,
    totalPoints,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    answeredCount,
    completedAt: FieldValue.serverTimestamp(),
    completedAtMs: nowMs,
    timeSpentSeconds: Math.max(0, Math.round((nowMs - Number(attempt.startedAtMs || nowMs)) / 1000)),
    updatedAt: FieldValue.serverTimestamp(),
  };
  batch.update(getAdminDb().collection('concours_attempts').doc(attempt.id), updates);
  await batch.commit();
  const finalized = record({ ...attempt, ...updates, completedAt: nowMs, updatedAt: nowMs });
  await writeProgress(attempt.userId, attempt.concoursId, finalized);
  return finalized;
}

async function submitAttempt(req, res) {
  const user = await requireAuthenticatedUser(req);
  const body = await readJsonBody(req);
  const attempt = await finalizeAttempt(String(body.attemptId || '').trim(), user.userId, body.expired ? EXPIRED : COMPLETED);
  return sendJson(res, 200, { attempt });
}

async function results(req, res) {
  const user = await requireAuthenticatedUser(req);
  const attemptId = String(q(req.query?.id) || '').trim();
  let attempt = await ownedAttempt(attemptId, user.userId);
  if (attempt.status === IN_PROGRESS && Number(attempt.expiresAtMs || 0) <= Date.now()) attempt = await finalizeAttempt(attempt.id, user.userId, EXPIRED);
  if (attempt.status === IN_PROGRESS) throw new HttpError(409, 'Attempt is still in progress.', 'ATTEMPT_IN_PROGRESS');
  const [questions, answers, concours] = await Promise.all([questionsByIds(attempt.questionIds || []), attemptAnswers(attempt.id), concoursById(attempt.concoursId)]);
  const answersByQuestionId = answers.reduce((map, answer) => ({ ...map, [answer.questionId]: answer }), {});
  return sendJson(res, 200, { attempt, concours: publicConcours(concours), questions: questions.map(resultQuestion), answersByQuestionId });
}

async function progress(req, res) {
  const user = await requireAuthenticatedUser(req);
  const [attemptsSnapshot, progressSnapshot] = await Promise.all([
    getAdminDb().collection('concours_attempts').where('userId', '==', user.userId).get(),
    getAdminDb().collection('concours_user_progress').where('userId', '==', user.userId).get(),
  ]);
  const attempts = attemptsSnapshot.docs.map(docData).sort((a, b) => Number(b.startedAtMs || 0) - Number(a.startedAtMs || 0));
  const completed = attempts.filter((attempt) => [COMPLETED, EXPIRED].includes(attempt.status));
  const totalQuestionsAnswered = completed.reduce((sum, attempt) => sum + Number(attempt.answeredCount || 0), 0);
  const totalCorrect = completed.reduce((sum, attempt) => sum + Number(attempt.correctCount || 0), 0);
  return sendJson(res, 200, {
    progress: {
      attemptsCount: attempts.length,
      completedCount: completed.length,
      totalQuestionsAnswered,
      totalCorrect,
      accuracy: totalQuestionsAnswered ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0,
      averageScore: completed.length ? Math.round(completed.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / completed.length) : 0,
      bestScore: completed.reduce((best, attempt) => Math.max(best, Number(attempt.percentage || 0)), 0),
      recentAttempts: attempts.slice(0, 8),
      byConcours: progressSnapshot.docs.map(docData),
    },
  });
}

async function adminDashboard(req, res) {
  await requireRole(req, ADMIN_READ_ROLES);
  const db = getAdminDb();
  const [
    users,
    concours,
    questions,
    attempts,
    institutions,
    programs,
    programYears,
    semesters,
    modules,
    resources,
  ] = await Promise.all([
    db.collection('users').get(),
    db.collection('concours').get(),
    db.collection('concours_questions').get(),
    db.collection('concours_attempts').get(),
    db.collection('institutions').get(),
    db.collection('programs').get(),
    db.collection('program_years').get(),
    db.collection('semesters').get(),
    db.collection('modules').get(),
    db.collection('resources').get(),
  ]);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const attemptRows = attempts.docs.map(docData);
  const resourceRows = resources.docs.map(docData);
  const completed = attemptRows.filter((attempt) => [COMPLETED, EXPIRED].includes(attempt.status));
  const activeUsers = new Set(attemptRows.filter((attempt) => Number(attempt.startedAtMs || 0) >= weekAgo).map((attempt) => attempt.userId));
  const newUsersThisWeek = users.docs.map(docData).filter((user) => user.createdAt && new Date(user.createdAt).getTime() >= weekAgo).length;
  return sendJson(res, 200, {
    stats: {
      totalUsers: users.size,
      activeUsers: activeUsers.size,
      totalConcours: concours.size,
      publishedConcours: concours.docs.map(docData).filter((item) => item.status === 'published').length,
      totalQuestions: questions.size,
      publishedQuestions: questions.docs.map(docData).filter((item) => item.status === 'published').length,
      totalAttempts: attempts.size,
      averageScore: completed.length ? Math.round(completed.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / completed.length) : 0,
      newUsersThisWeek,
      totalInstitutions: institutions.size,
      publishedInstitutions: institutions.docs.map(docData).filter((item) => item.status === 'published').length,
      totalPrograms: programs.size,
      totalProgramYears: programYears.size,
      totalSemesters: semesters.size,
      totalModules: modules.size,
      totalResources: resources.size,
      publishedResources: resourceRows.filter((item) => item.status !== 'draft' && item.status !== 'archived' && item.visibility !== 'private').length,
      trashedResources: resourceRows.filter((item) => item.status === 'archived' || item.isDeleted === true).length,
    },
  });
}

async function adminUsers(req, res) {
  await requireRole(req, ADMIN_READ_ROLES);
  const db = getAdminDb();
  const [usersSnapshot, rolesSnapshot, attemptsSnapshot] = await Promise.all([
    db.collection('users').limit(int(q(req.query?.limit), 100, 1, 200)).get(),
    db.collection('user_roles').get(),
    db.collection('concours_attempts').get(),
  ]);
  const roles = new Map(rolesSnapshot.docs.map((doc) => [doc.id, doc.data() || {}]));
  const attempts = attemptsSnapshot.docs.map(docData);
  const users = usersSnapshot.docs.map((doc) => {
    const user = docData(doc);
    const userAttempts = attempts.filter((attempt) => attempt.userId === user.id);
    const completed = userAttempts.filter((attempt) => [COMPLETED, EXPIRED].includes(attempt.status));
    return {
      ...user,
      role: roles.get(user.id)?.role || USER_ROLES.STUDENT,
      roleStatus: roles.get(user.id)?.status || 'active',
      attemptsCount: userAttempts.length,
      completedCount: completed.length,
      bestScore: completed.reduce((best, attempt) => Math.max(best, Number(attempt.percentage || 0)), 0),
      averageScore: completed.length ? Math.round(completed.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / completed.length) : 0,
      lastActivityAt: userAttempts[0]?.startedAt || null,
    };
  }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return sendJson(res, 200, { users });
}

async function adminUserRole(req, res) {
  await requireRole(req, OWNER_ROLES);
  const body = await readJsonBody(req);
  const userId = String(body.userId || '').trim();
  const role = String(body.role || '').trim();
  const roleStatus = String(body.status || 'active').trim();
  if (!userId) throw new HttpError(400, 'userId is required.', 'USER_ID_REQUIRED');
  if (!Object.values(USER_ROLES).includes(role)) throw new HttpError(400, 'Role is invalid.', 'ROLE_INVALID');
  if (!['active', 'suspended'].includes(roleStatus)) throw new HttpError(400, 'Status is invalid.', 'STATUS_INVALID');
  const ref = getAdminDb().collection('user_roles').doc(userId);
  const current = await ref.get();
  const currentData = current.data() || {};
  const removingOwner = currentData.role === USER_ROLES.OWNER && currentData.status === 'active' && (role !== USER_ROLES.OWNER || roleStatus !== 'active');
  if (removingOwner) {
    const owners = await getAdminDb().collection('user_roles').where('role', '==', USER_ROLES.OWNER).where('status', '==', 'active').get();
    if (owners.docs.filter((doc) => doc.id !== userId).length < 1) throw new HttpError(409, 'Cannot remove the final owner account.', 'FINAL_OWNER_PROTECTED');
  }
  await ref.set({ role, status: roleStatus, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return sendJson(res, 200, { userRole: { userId, role, status: roleStatus } });
}

async function adminQuestionImageUpload(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const body = await readJsonBody(req);
  const { buffer, contentType } = parseImageDataUrl(body.dataUrl);
  const downloadToken = randomUUID();
  const fileName = safeFileName(body.fileName);
  const filePath = `concours/questions/${Date.now()}-${randomUUID()}-${fileName}`;
  const bucket = getAdminStorageBucket();
  const file = bucket.file(filePath);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        uploadedBy: user.userId,
      },
    },
  });

  const imageUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}` +
    `?alt=media&token=${downloadToken}`;

  return sendJson(res, 201, {
    imageUrl,
    path: filePath,
  });
}

async function adminConcoursList(req, res) {
  await requireRole(req, ADMIN_READ_ROLES);
  const snapshot = await getAdminDb().collection('concours').get();
  return sendJson(res, 200, { concours: snapshot.docs.map(docData).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))) });
}

async function adminConcoursCreate(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const payload = validateConcours(await readJsonBody(req));
  if (payload.status === 'published' && !PUBLISH_ROLES.includes(user.role)) throw new HttpError(403, 'Publish permission required.', 'PUBLISH_FORBIDDEN');
  const existing = await getAdminDb().collection('concours').where('slug', '==', payload.slug).limit(1).get();
  if (!existing.empty) throw new HttpError(409, 'Slug already exists.', 'CONCOURS_SLUG_EXISTS');
  const ref = getAdminDb().collection('concours').doc();
  const concours = { ...payload, id: ref.id, questionCount: 0, createdBy: user.userId, updatedBy: user.userId, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
  await ref.set(concours);
  return sendJson(res, 201, { concours: record({ ...concours, createdAt: Date.now(), updatedAt: Date.now() }) });
}

async function adminConcoursPatch(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const id = String(q(req.query?.id) || '').trim();
  if (!id) throw new HttpError(400, 'id is required.', 'CONCOURS_ID_REQUIRED');
  const ref = getAdminDb().collection('concours').doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, 'Concours not found.', 'CONCOURS_NOT_FOUND');
  const payload = validateConcours(await readJsonBody(req), true);
  if (payload.status === 'published' && !PUBLISH_ROLES.includes(user.role)) throw new HttpError(403, 'Publish permission required.', 'PUBLISH_FORBIDDEN');
  if (payload.slug && payload.slug !== snapshot.data()?.slug) {
    const existing = await getAdminDb().collection('concours').where('slug', '==', payload.slug).limit(1).get();
    if (!existing.empty) throw new HttpError(409, 'Slug already exists.', 'CONCOURS_SLUG_EXISTS');
  }
  await ref.update({ ...payload, updatedBy: user.userId, updatedAt: FieldValue.serverTimestamp() });
  return sendJson(res, 200, { concours: record({ id, ...snapshot.data(), ...payload, updatedAt: Date.now() }) });
}

async function adminConcoursDelete(req, res) {
  const user = await requireRole(req, PUBLISH_ROLES);
  const id = String(q(req.query?.id) || '').trim();
  if (!id) throw new HttpError(400, 'id is required.', 'CONCOURS_ID_REQUIRED');
  const ref = getAdminDb().collection('concours').doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, 'Concours not found.', 'CONCOURS_NOT_FOUND');
  const current = snapshot.data() || {};
  await ref.set({
    status: 'archived',
    previousStatus: current.status && current.status !== 'archived' ? current.status : current.previousStatus || 'draft',
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: user.userId,
    updatedBy: user.userId,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return sendJson(res, 200, { success: true, id });
}

async function adminQuestionsList(req, res) {
  await requireRole(req, ADMIN_READ_ROLES);
  const concoursId = String(q(req.query?.concoursId) || '').trim();
  if (!concoursId) throw new HttpError(400, 'concoursId is required.', 'QUESTION_CONCOURS_REQUIRED');
  return sendJson(res, 200, { questions: await questionsForConcours(concoursId) });
}

async function adminQuestionCreate(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const payload = validateQuestion(await readJsonBody(req));
  if (payload.status === 'published' && !PUBLISH_ROLES.includes(user.role)) throw new HttpError(403, 'Publish permission required.', 'PUBLISH_FORBIDDEN');
  await concoursById(payload.concoursId);
  const ref = getAdminDb().collection('concours_questions').doc();
  const question = { ...payload, id: ref.id, createdBy: user.userId, updatedBy: user.userId, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
  await ref.set(question);
  await updateConcoursCounters(payload.concoursId);
  return sendJson(res, 201, { question: record({ ...question, createdAt: Date.now(), updatedAt: Date.now() }) });
}

async function adminQuestionPatch(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const id = String(q(req.query?.id) || '').trim();
  if (!id) throw new HttpError(400, 'id is required.', 'QUESTION_ID_REQUIRED');
  const ref = getAdminDb().collection('concours_questions').doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, 'Question not found.', 'QUESTION_NOT_FOUND');
  const payload = validateQuestion(await readJsonBody(req), true);
  if (payload.status === 'published' && !PUBLISH_ROLES.includes(user.role)) throw new HttpError(403, 'Publish permission required.', 'PUBLISH_FORBIDDEN');
  await ref.update({ ...payload, updatedBy: user.userId, updatedAt: FieldValue.serverTimestamp() });
  await updateConcoursCounters(payload.concoursId || snapshot.data()?.concoursId);
  return sendJson(res, 200, { question: record({ id, ...snapshot.data(), ...payload, updatedAt: Date.now() }) });
}

async function adminQuestionDelete(req, res) {
  const user = await requireRole(req, WRITE_ROLES);
  const id = String(q(req.query?.id) || '').trim();
  if (!id) throw new HttpError(400, 'id is required.', 'QUESTION_ID_REQUIRED');
  const ref = getAdminDb().collection('concours_questions').doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, 'Question not found.', 'QUESTION_NOT_FOUND');
  const current = snapshot.data() || {};
  await ref.set({
    status: 'archived',
    previousStatus: current.status && current.status !== 'archived' ? current.status : current.previousStatus || 'draft',
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: user.userId,
    updatedBy: user.userId,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await updateConcoursCounters(snapshot.data()?.concoursId);
  return sendJson(res, 200, { success: true, id });
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET', 'POST', 'PATCH', 'DELETE']);
  const requestId = getRequestId(req);
  const action = String(q(req.query?.action) || 'list');
  try {
    if (req.method === 'GET' && action === 'list') return await listPublic(req, res);
    if (req.method === 'GET' && action === 'detail') return await detailPublic(req, res);
    if (req.method === 'POST' && action === 'start') return await startAttempt(req, res);
    if (req.method === 'GET' && action === 'attempt') return await getAttempt(req, res);
    if (req.method === 'PATCH' && action === 'answer') return await saveAnswer(req, res);
    if (req.method === 'POST' && action === 'submit') return await submitAttempt(req, res);
    if (req.method === 'GET' && action === 'results') return await results(req, res);
    if (req.method === 'GET' && action === 'progress') return await progress(req, res);
    if (req.method === 'GET' && action === 'admin-dashboard') return await adminDashboard(req, res);
    if (req.method === 'GET' && action === 'admin-users') return await adminUsers(req, res);
    if (req.method === 'PATCH' && action === 'admin-user-role') return await adminUserRole(req, res);
    if (req.method === 'POST' && action === 'admin-question-image') return await adminQuestionImageUpload(req, res);
    if (req.method === 'GET' && action === 'admin-concours') return await adminConcoursList(req, res);
    if (req.method === 'POST' && action === 'admin-concours') return await adminConcoursCreate(req, res);
    if (req.method === 'PATCH' && action === 'admin-concours') return await adminConcoursPatch(req, res);
    if (req.method === 'DELETE' && action === 'admin-concours') return await adminConcoursDelete(req, res);
    if (req.method === 'GET' && action === 'admin-questions') return await adminQuestionsList(req, res);
    if (req.method === 'POST' && action === 'admin-question') return await adminQuestionCreate(req, res);
    if (req.method === 'PATCH' && action === 'admin-question') return await adminQuestionPatch(req, res);
    if (req.method === 'DELETE' && action === 'admin-question') return await adminQuestionDelete(req, res);
    throw new HttpError(405, 'Method or action not allowed.', 'METHOD_NOT_ALLOWED');
  } catch (error) {
    console.error('[CONCOURS_API_FAILED]', { requestId, action, method: req.method, name: error?.name, code: error?.code, message: error?.message });
    return sendError(res, error, { requestId, stage: `CONCOURS_${action}` });
  }
}
