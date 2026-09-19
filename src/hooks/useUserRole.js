import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { USER_ROLE_STATUS, USER_ROLE_VALUES } from '../constants/roles';
import { fetchCurrentRole } from '../services/userApi.js';

const userRoleCache = new Map();
const userRoleRequests = new Map();
const USER_ROLE_CACHE_TTL_MS = 5 * 60 * 1000;

function createRoleState({ role = null, status = null, loading = false, error = null } = {}) {
  return { role, status, loading, error };
}

async function fetchUserRole(clerkUserId, getToken) {
  const cachedRole = userRoleCache.get(clerkUserId);
  if (cachedRole && cachedRole.expiresAt > Date.now()) return cachedRole.state;
  if (cachedRole) userRoleCache.delete(clerkUserId);
  if (userRoleRequests.has(clerkUserId)) return userRoleRequests.get(clerkUserId);

  const request = fetchCurrentRole(getToken)
    .then((data) => {
      const nextRole = typeof data.role === 'string' ? data.role : null;
      const nextStatus = typeof data.status === 'string' ? data.status : null;
      if (!USER_ROLE_VALUES.includes(nextRole)) return createRoleState({ status: nextStatus, error: 'Invalid user role.' });
      return createRoleState({ role: nextRole, status: nextStatus });
    })
    .catch((error) => createRoleState({ error: error?.message || 'Unable to load user role.' }))
    .finally(() => userRoleRequests.delete(clerkUserId));

  userRoleRequests.set(clerkUserId, request);
  const result = await request;
  if (!result.error) {
    userRoleCache.set(clerkUserId, { state: result, expiresAt: Date.now() + USER_ROLE_CACHE_TTL_MS });
  }
  return result;
}

export function useUserRole() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [roleState, setRoleState] = useState({ role: null, status: null, loading: true, error: null });

  const refetch = useCallback(() => {
    if (user?.id) {
      userRoleCache.delete(user.id);
      userRoleRequests.delete(user.id);
    }
    setReloadKey((current) => current + 1);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!isLoaded) {
        setRoleState((current) => ({ ...current, loading: true, error: null }));
        return;
      }
      if (!isSignedIn || !user?.id) {
        setRoleState(createRoleState());
        return;
      }
      setRoleState((current) => ({ ...current, loading: true, error: null }));
      const nextRoleState = await fetchUserRole(user.id, getToken);
      if (!cancelled) setRoleState(nextRoleState);
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, reloadKey, user?.id]);

  const hasRole = useCallback(
    (allowedRoles) => {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return roleState.status === USER_ROLE_STATUS.ACTIVE && Boolean(roleState.role) && roles.includes(roleState.role);
    },
    [roleState.role, roleState.status],
  );

  return { ...roleState, hasRole, refetch };
}
