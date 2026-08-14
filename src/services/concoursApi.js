import { getAuthHeaders, parseApiResponse } from './apiClient.js';

async function concoursRequest(action, { method = 'GET', body, getToken, query = {} } = {}) {
  const params = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')) });
  const headers = body ? { 'Content-Type': 'application/json' } : {};
  if (getToken) Object.assign(headers, await getAuthHeaders(getToken));
  const response = await fetch(`/api/concours?${params.toString()}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse(response);
}

export const listConcours = () => concoursRequest('list');
export const getConcoursDetail = (slug) => concoursRequest('detail', { query: { slug } });
export const startConcoursAttempt = (slug, getToken) => concoursRequest('start', { method: 'POST', body: { slug }, getToken });
export const getAttempt = (attemptId, getToken) => concoursRequest('attempt', { query: { id: attemptId }, getToken });
export const saveAttemptAnswer = (payload, getToken) => concoursRequest('answer', { method: 'PATCH', body: payload, getToken });
export const submitAttempt = (attemptId, getToken, { expired = false } = {}) => concoursRequest('submit', { method: 'POST', body: { attemptId, expired }, getToken });
export const getAttemptResults = (attemptId, getToken) => concoursRequest('results', { query: { id: attemptId }, getToken });
export const getConcoursProgress = (getToken) => concoursRequest('progress', { getToken });

export const getAdminDashboard = (getToken) => concoursRequest('admin-dashboard', { getToken });
export const getAdminUsers = (getToken) => concoursRequest('admin-users', { getToken });
export const updateAdminUserRole = (payload, getToken) => concoursRequest('admin-user-role', { method: 'PATCH', body: payload, getToken });
export const getAdminConcours = (getToken) => concoursRequest('admin-concours', { getToken });
export const createAdminConcours = (payload, getToken) => concoursRequest('admin-concours', { method: 'POST', body: payload, getToken });
export const updateAdminConcours = (id, payload, getToken) => concoursRequest('admin-concours', { method: 'PATCH', query: { id }, body: payload, getToken });
export const archiveAdminConcours = (id, getToken) => concoursRequest('admin-concours', { method: 'DELETE', query: { id }, getToken });
export const getAdminQuestions = (concoursId, getToken) => concoursRequest('admin-questions', { query: { concoursId }, getToken });
export const createAdminQuestion = (payload, getToken) => concoursRequest('admin-question', { method: 'POST', body: payload, getToken });
export const updateAdminQuestion = (id, payload, getToken) => concoursRequest('admin-question', { method: 'PATCH', query: { id }, body: payload, getToken });
export const deleteAdminQuestion = (id, getToken) => concoursRequest('admin-question', { method: 'DELETE', query: { id }, getToken });
