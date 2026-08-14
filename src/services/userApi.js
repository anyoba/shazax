import { getAuthHeaders, parseApiResponse } from './apiClient.js';

export async function syncCurrentUser(user, getToken) {
  const headers = await getAuthHeaders(getToken);
  const response = await fetch('/api/users?action=sync', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Student',
      email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '',
      profileImageUrl: user?.profileImageUrl || '',
    }),
  });
  return parseApiResponse(response);
}

export async function fetchCurrentRole(getToken) {
  const headers = await getAuthHeaders(getToken);
  const response = await fetch('/api/users?action=role', { headers });
  return parseApiResponse(response);
}
