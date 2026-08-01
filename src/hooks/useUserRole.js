import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { USER_ROLE_STATUS, USER_ROLE_VALUES } from '../constants/roles';
import { getFirestoreErrorMessage } from '../utils/firebaseErrors';

const userRoleCache = new Map();
const userRoleRequests = new Map();

function createRoleState({ role = null, status = null, loading = false, error = null } = {}) {
  return {
    role,
    status,
    loading,
    error,
  };
}

async function fetchUserRole(clerkUserId) {
  if (userRoleCache.has(clerkUserId)) {
    return userRoleCache.get(clerkUserId);
  }

  if (userRoleRequests.has(clerkUserId)) {
    return userRoleRequests.get(clerkUserId);
  }

  const request = getDoc(doc(db, 'user_roles', clerkUserId))
    .then((roleSnapshot) => {
      if (!roleSnapshot.exists()) {
        return createRoleState();
      }

      const data = roleSnapshot.data();
      const nextRole = typeof data.role === 'string' ? data.role : null;
      const nextStatus = typeof data.status === 'string' ? data.status : null;

      if (!USER_ROLE_VALUES.includes(nextRole)) {
        return createRoleState({
          status: nextStatus,
          error: 'Invalid user role.',
        });
      }

      return createRoleState({
        role: nextRole,
        status: nextStatus,
      });
    })
    .catch((error) =>
      createRoleState({
        error: getFirestoreErrorMessage(error, 'Unable to load user role.'),
      }),
    )
    .finally(() => {
      userRoleRequests.delete(clerkUserId);
    });

  userRoleRequests.set(clerkUserId, request);

  const result = await request;
  if (!result.error) {
    userRoleCache.set(clerkUserId, result);
  }

  return result;
}

export function useUserRole() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [reloadKey, setReloadKey] = useState(0);
  const [roleState, setRoleState] = useState({
    role: null,
    status: null,
    loading: true,
    error: null,
  });

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

      // Temporary migration step: this direct Firestore read will be replaced by
      // a secured API that verifies Clerk tokens and uses Firebase Admin SDK.
      // The memory cache only reduces duplicate UI reads; server APIs still
      // verify roles independently for sensitive operations.
      const nextRoleState = await fetchUserRole(user.id);

      if (!cancelled) {
        setRoleState(nextRoleState);
      }
    }

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, reloadKey, user?.id]);

  const hasRole = useCallback(
    (allowedRoles) => {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return (
        roleState.status === USER_ROLE_STATUS.ACTIVE &&
        Boolean(roleState.role) &&
        roles.includes(roleState.role)
      );
    },
    [roleState.role, roleState.status],
  );

  return {
    ...roleState,
    hasRole,
    refetch,
  };
}
