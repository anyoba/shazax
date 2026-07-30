import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { USER_ROLE_STATUS, USER_ROLE_VALUES } from '../constants/roles';

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
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!isLoaded) {
        setRoleState((current) => ({ ...current, loading: true, error: null }));
        return;
      }

      if (!isSignedIn || !user?.id) {
        setRoleState({
          role: null,
          status: null,
          loading: false,
          error: null,
        });
        return;
      }

      setRoleState((current) => ({ ...current, loading: true, error: null }));

      try {
        // Temporary migration step: this direct Firestore read will be replaced by
        // a secured API that verifies Clerk tokens and uses Firebase Admin SDK.
        const roleSnapshot = await getDoc(doc(db, 'user_roles', user.id));

        if (cancelled) return;

        if (!roleSnapshot.exists()) {
          setRoleState({
            role: null,
            status: null,
            loading: false,
            error: null,
          });
          return;
        }

        const data = roleSnapshot.data();
        const nextRole = typeof data.role === 'string' ? data.role : null;
        const nextStatus = typeof data.status === 'string' ? data.status : null;

        if (!USER_ROLE_VALUES.includes(nextRole)) {
          setRoleState({
            role: null,
            status: nextStatus,
            loading: false,
            error: 'Invalid user role.',
          });
          return;
        }

        setRoleState({
          role: nextRole,
          status: nextStatus,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;

        setRoleState({
          role: null,
          status: null,
          loading: false,
          error: error?.message || 'Unable to load user role.',
        });
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
